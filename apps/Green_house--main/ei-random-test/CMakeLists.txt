cmake_minimum_required(VERSION 3.16)

project(ei_random_test LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Full EI export that contains model-parameters/ and tflite-model/
set(EI_EXPORT_DIR "${CMAKE_CURRENT_LIST_DIR}/../mohamed_said-project-1-cpp-mcu-v12-impulse-#5")
set(EI_SDK_DIR "${EI_EXPORT_DIR}/edge-impulse-sdk")

file(GLOB_RECURSE EI_SDK_SOURCES CONFIGURE_DEPENDS
    "${EI_SDK_DIR}/classifier/*.cpp"
    "${EI_SDK_DIR}/dsp/*.cpp"
    "${EI_SDK_DIR}/tensorflow/lite/c/*.c"
    "${EI_SDK_DIR}/tensorflow/lite/micro/*.cpp"
)

file(GLOB_RECURSE EI_MODEL_SOURCES CONFIGURE_DEPENDS
    "${EI_EXPORT_DIR}/tflite-model/*.cpp"
)

list(FILTER EI_SDK_SOURCES EXCLUDE REGEX ".*/porting/.*")
list(FILTER EI_SDK_SOURCES EXCLUDE REGEX ".*/test_.*")
list(FILTER EI_SDK_SOURCES EXCLUDE REGEX ".*/classifier/ei_run_classifier_c\\.cpp$")

add_executable(ei_random_test
    main.cpp
    ${EI_SDK_SOURCES}
    ${EI_MODEL_SOURCES}
)

target_include_directories(ei_random_test PRIVATE
    "${EI_EXPORT_DIR}"
    "${EI_SDK_DIR}"
    "${EI_SDK_DIR}/classifier"
    "${EI_SDK_DIR}/dsp"
    "${EI_SDK_DIR}/CMSIS/Core/Include"
    "${EI_SDK_DIR}/CMSIS/DSP/Include"
    "${EI_SDK_DIR}/third_party/flatbuffers/include"
    "${EI_SDK_DIR}/third_party/gemmlowp"
    "${EI_SDK_DIR}/third_party/ruy"
    "${EI_SDK_DIR}/third_party/incbin"
    "${EI_SDK_DIR}/tensorflow/lite"
    "${EI_SDK_DIR}/tensorflow/lite/c"
    "${EI_SDK_DIR}/tensorflow/lite/micro"
)

target_compile_definitions(ei_random_test PRIVATE
    EI_C_LINKAGE=1
    EI_PORTING_CLIB=1
    EIDSP_USE_CMSIS_DSP=0
    EIDSP_USE_ESP_DSP=0
    EIDSP_USE_NEON=0
    WIN32_LEAN_AND_MEAN
    NOMINMAX
    _CRT_SECURE_NO_WARNINGS
)

if (MSVC)
    target_compile_options(ei_random_test PRIVATE /FI"${CMAKE_CURRENT_LIST_DIR}/msvc_compat.h")
    target_compile_options(ei_random_test PRIVATE /bigobj)
endif()