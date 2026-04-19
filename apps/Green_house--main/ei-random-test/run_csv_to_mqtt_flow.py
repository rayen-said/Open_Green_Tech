import argparse
import shutil
import subprocess
import sys
from pathlib import Path


def find_cmake() -> str:
    cmake_from_path = shutil.which("cmake")
    if cmake_from_path:
        return cmake_from_path

    candidates = [
        Path("C:/Program Files (x86)/Microsoft Visual Studio/18/BuildTools/Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe"),
        Path("C:/Program Files (x86)/Microsoft Visual Studio/2026/BuildTools/Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe"),
        Path("C:/Program Files/Microsoft Visual Studio/2022/BuildTools/Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe"),
        Path("C:/Program Files/Microsoft Visual Studio/2026/BuildTools/Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)

    vswhere = Path("C:/Program Files (x86)/Microsoft Visual Studio/Installer/vswhere.exe")
    if vswhere.exists():
        try:
            result = subprocess.run(
                [str(vswhere), "-latest", "-products", "*", "-find", "**/cmake.exe"],
                capture_output=True,
                text=True,
                check=False,
            )
            discovered = result.stdout.strip().splitlines()
            if discovered:
                cmake_path = discovered[0].strip()
                if cmake_path and Path(cmake_path).exists():
                    return cmake_path
        except Exception:
            pass

    raise FileNotFoundError("cmake executable was not found in PATH or known Visual Studio locations")


def find_executable(build_dir: Path) -> Path:
    candidates = [
        build_dir / "Release" / "ei_random_test.exe",
        build_dir / "ei_random_test.exe",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0]


def run_command(cmd: list[str], cwd: Path) -> None:
    print("Running:", " ".join(str(p) for p in cmd))
    subprocess.run(cmd, cwd=str(cwd), check=True)


def ensure_built(cmake_exe: str, project_dir: Path, build_dir: Path) -> Path:
    cache_file = build_dir / "CMakeCache.txt"
    if not cache_file.exists():
        run_command([cmake_exe, "-S", str(project_dir), "-B", str(build_dir)], cwd=project_dir)

    run_command([cmake_exe, "--build", str(build_dir), "--config", "Release"], cwd=project_dir)
    return find_executable(build_dir)


def main() -> int:
    parser = argparse.ArgumentParser(description="CSV -> Edge Impulse model -> MQTT flow runner")
    parser.add_argument("csv", nargs="?", default="../gabes_year_dataset.csv", help="Input CSV file path")
    parser.add_argument("--output-json", default="file.json", help="Inference JSON output path")
    parser.add_argument("--skip-build", action="store_true", help="Skip CMake build step")
    parser.add_argument("--skip-publish", action="store_true", help="Run inference only, do not publish")
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    project_dir = script_dir
    build_dir = script_dir / "build"

    csv_path = Path(args.csv)
    if not csv_path.is_absolute():
        csv_path = (script_dir / csv_path).resolve()
    if not csv_path.exists():
        print(f"ERROR: CSV file not found: {csv_path}")
        return 1

    output_json = Path(args.output_json)
    if not output_json.is_absolute():
        output_json = (script_dir / output_json).resolve()

    try:
        exe_path = find_executable(build_dir)
        if not args.skip_build or not exe_path.exists():
            cmake_exe = find_cmake()
            exe_path = ensure_built(cmake_exe, project_dir, build_dir)

        run_command([str(exe_path), str(csv_path), str(output_json)], cwd=script_dir)

        if not args.skip_publish:
            publisher_script = script_dir / "publish_file_json_hivemq.py"
            run_command([sys.executable, str(publisher_script), str(output_json)], cwd=script_dir)

        print("Flow completed successfully.")
        return 0

    except subprocess.CalledProcessError as exc:
        print(f"ERROR: command failed with exit code {exc.returncode}")
        return exc.returncode
    except Exception as exc:
        print(f"ERROR: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
