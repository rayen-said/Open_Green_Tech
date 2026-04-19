#include <chrono>
#include <cstdarg>
#include <cstdio>
#include <cstdlib>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

#if !__has_include("model-parameters/model_metadata.h") || !__has_include("model-parameters/model_variables.h")
#error "Missing generated Edge Impulse model files: model-parameters/model_metadata.h and model-parameters/model_variables.h"
#endif

#include "edge-impulse-sdk/classifier/ei_run_classifier.h"

struct CsvRow {
    std::string timestamp;
    float tempC;
    float humPct;
    float moistPct;
    float lux;
    float flowRate;
};

struct InferenceRow {
    std::string timestamp;
    float tempC;
    float humPct;
    float moistPct;
    float lux;
    float flowRate;
    float anomaly;
    int signal_error;
    int classifier_error;
};

static bool parse_float(const std::string &text, float &out)
{
    try {
        out = std::stof(text);
        return true;
    }
    catch (...) {
        return false;
    }
}

static std::vector<std::string> split_csv_line(const std::string &line)
{
    std::vector<std::string> parts;
    std::stringstream ss(line);
    std::string cell;
    while (std::getline(ss, cell, ',')) {
        parts.push_back(cell);
    }
    return parts;
}

static bool read_csv_rows(const std::string &csv_path, std::vector<CsvRow> &rows)
{
    std::ifstream in(csv_path);
    if (!in.is_open()) {
        return false;
    }

    std::string line;
    if (!std::getline(in, line)) {
        return false;
    }

    while (std::getline(in, line)) {
        if (line.empty()) {
            continue;
        }

        std::vector<std::string> cols = split_csv_line(line);
        if (cols.size() < 10) {
            continue;
        }

        float temp = 0.0f;
        float hum = 0.0f;
        float moist = 0.0f;
        float lux = 0.0f;
        float water_pump = 0.0f;

        if (!parse_float(cols[1], temp) || !parse_float(cols[2], hum) ||
            !parse_float(cols[3], moist) || !parse_float(cols[4], lux) ||
            !parse_float(cols[7], water_pump)) {
            continue;
        }

        // Model expects 5 values, CSV has no explicit flow value, so we map pump flag to flow proxy.
        CsvRow row;
        row.timestamp = cols[0];
        row.tempC = temp;
        row.humPct = hum;
        row.moistPct = moist;
        row.lux = lux;
        row.flowRate = water_pump > 0.0f ? 1.0f : 0.0f;
        rows.push_back(row);
    }

    return !rows.empty();
}

static bool write_json_file(const std::string &path, const std::vector<InferenceRow> &rows)
{
    std::ofstream out(path, std::ios::out | std::ios::trunc);
    if (!out.is_open()) {
        return false;
    }

    out << "[\n";
    for (size_t i = 0; i < rows.size(); ++i) {
        const InferenceRow &row = rows[i];
        out << "  {\n";
        out << "    \"timestamp\": \"" << row.timestamp << "\",\n";
        out << "    \"tempC\": " << std::fixed << std::setprecision(2) << row.tempC << ",\n";
        out << "    \"humPct\": " << std::fixed << std::setprecision(2) << row.humPct << ",\n";
        out << "    \"moistPct\": " << std::fixed << std::setprecision(2) << row.moistPct << ",\n";
        out << "    \"lux\": " << std::fixed << std::setprecision(2) << row.lux << ",\n";
        out << "    \"flowRate\": " << std::fixed << std::setprecision(2) << row.flowRate << ",\n";
        out << "    \"anomaly\": " << std::fixed << std::setprecision(2) << row.anomaly << ",\n";
        out << "    \"signal_error\": " << row.signal_error << ",\n";
        out << "    \"classifier_error\": " << row.classifier_error << "\n";
        out << "  }";
        if (i + 1 < rows.size()) {
            out << ",";
        }
        out << "\n";
    }
    out << "]\n";

    return true;
}

extern "C" EI_IMPULSE_ERROR ei_run_impulse_check_canceled()
{
    return EI_IMPULSE_OK;
}

extern "C" EI_IMPULSE_ERROR ei_sleep(int32_t time_ms)
{
    std::this_thread::sleep_for(std::chrono::milliseconds(time_ms));
    return EI_IMPULSE_OK;
}

extern "C" uint64_t ei_read_timer_ms()
{
    using clock_type = std::chrono::steady_clock;
    const auto now = clock_type::now().time_since_epoch();
    return static_cast<uint64_t>(std::chrono::duration_cast<std::chrono::milliseconds>(now).count());
}

extern "C" uint64_t ei_read_timer_us()
{
    using clock_type = std::chrono::steady_clock;
    const auto now = clock_type::now().time_since_epoch();
    return static_cast<uint64_t>(std::chrono::duration_cast<std::chrono::microseconds>(now).count());
}

extern "C" void ei_printf(const char *format, ...)
{
    va_list args;
    va_start(args, format);
    std::vprintf(format, args);
    va_end(args);
}

extern "C" void ei_printf_float(float value)
{
    ei_printf("%f", value);
}

extern "C" void *ei_malloc(size_t size)
{
    return std::malloc(size);
}

extern "C" void *ei_calloc(size_t nitems, size_t size)
{
    return std::calloc(nitems, size);
}

extern "C" void ei_free(void *ptr)
{
    std::free(ptr);
}

extern "C" void ei_putchar(char data)
{
    std::putchar(static_cast<int>(data));
}

extern "C" char ei_getchar(void)
{
    return static_cast<char>(std::getchar());
}

int main(int argc, char **argv)
{
    const std::string input_csv = (argc > 1) ? argv[1] : "..\\gabes_year_dataset.csv";
    const std::string output_json = (argc > 2) ? argv[2] : "file.json";

    std::vector<CsvRow> csv_rows;
    if (!read_csv_rows(input_csv, csv_rows)) {
        std::cerr << "Failed to read CSV rows from: " << input_csv << "\n";
        return 1;
    }

    std::cout << "=== Edge Impulse CSV Inference ===\n";
    std::cout << "Input CSV: " << input_csv << "\n";
    std::cout << "Rows: " << csv_rows.size() << "\n";
    std::cout << "Frame size: " << EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE << "\n\n";

    std::vector<InferenceRow> out_rows;
    out_rows.reserve(csv_rows.size());

    for (size_t i = 0; i < csv_rows.size(); ++i) {
        const CsvRow &r = csv_rows[i];

        std::vector<float> features(EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE, 0.0f);
        if (features.size() >= 5) {
            features[0] = r.tempC;
            features[1] = r.humPct;
            features[2] = r.moistPct;
            features[3] = r.lux;
            features[4] = r.flowRate;
        }

        signal_t signal;
        const int signal_error = numpy::signal_from_buffer(features.data(), features.size(), &signal);
        if (signal_error != EI_IMPULSE_OK) {
            out_rows.push_back({ r.timestamp, r.tempC, r.humPct, r.moistPct, r.lux, r.flowRate, 0.0f, signal_error, 0 });
            continue;
        }

        ei_impulse_result_t result = { 0 };
        const EI_IMPULSE_ERROR classifier_error = run_classifier(&signal, &result, false);
        if (classifier_error != EI_IMPULSE_OK) {
            out_rows.push_back({ r.timestamp, r.tempC, r.humPct, r.moistPct, r.lux, r.flowRate, 0.0f, EI_IMPULSE_OK, classifier_error });
            continue;
        }

        out_rows.push_back({ r.timestamp, r.tempC, r.humPct, r.moistPct, r.lux, r.flowRate, result.anomaly, EI_IMPULSE_OK, EI_IMPULSE_OK });
    }

    if (!write_json_file(output_json, out_rows)) {
        std::cerr << "Failed to write output JSON: " << output_json << "\n";
        return 1;
    }

    std::cout << "Wrote JSON: " << output_json << " (" << out_rows.size() << " rows)\n";
    return 0;
}