#!/usr/bin/env python3
"""Run each named API SQL contract in a separate Release testhost."""
import argparse
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import xml.etree.ElementTree as et

ROOT = Path(__file__).resolve().parents[2]
TEST_PROJECT = "ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj"
CASE_NAME = re.compile(r"ArchLucid\.Api\.Tests\.[A-Za-z0-9_.]+")


def read_outcome(trx, name, code, timed_out):
    if timed_out or not trx.is_file():
        return "interrupted"
    try:
        results = et.parse(trx).findall(".//{*}UnitTestResult")
    except (et.ParseError, OSError):
        return "interrupted"
    if len(results) != 1 or results[0].get("testName") != name:
        return "interrupted"
    recorded = results[0].get("outcome")
    if recorded == "Passed":
        return "passed" if code == 0 else "interrupted"
    if recorded in ("NotExecuted", "Skipped"):
        return "skipped"
    return "failed" if recorded == "Failed" else "interrupted"


def run_case(name, output, timeout):
    output.mkdir()
    trx = output / "case.trx"
    cmd = [
        "dotnet", "test", TEST_PROJECT, "-c", "Release", "--no-build", "--no-restore",
        "--settings", "test.runsettings", "--filter", f"FullyQualifiedName={name}",
        "--results-directory", str(output), "--logger", "trx;LogFileName=case.trx",
        "--blame-hang-timeout", f"{timeout - 15}s", "--blame-hang-dump-type", "none",
    ]
    timed_out = False
    with (output / "console.log").open("w", encoding="utf-8") as log:
        child = subprocess.Popen(cmd, cwd=ROOT, stdout=log, stderr=subprocess.STDOUT,
                                 start_new_session=os.name == "posix")
        try:
            child.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            timed_out = True
            if os.name == "posix":
                try:
                    os.killpg(child.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            else:
                subprocess.run(["taskkill", "/F", "/T", "/PID", str(child.pid)], check=False)
            child.wait()
    return {"case": name, "outcome": read_outcome(trx, name, child.returncode, timed_out),
            "exit_code": child.returncode, "artifact_dir": output.name}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--results-dir", required=True, type=Path, help="Must be a new results directory")
    parser.add_argument("--case", action="append", help="Exact fully qualified name; repeat to select multiple cases")
    parser.add_argument("--timeout-seconds", type=int, default=150, help="Limit per test process")
    args = parser.parse_args()
    if args.timeout_seconds < 20:
        parser.error("the case timeout must be at least 20 seconds")
    if not any(os.environ.get(key, "").strip() for key in ("ARCHLUCID_API_TEST_SQL", "ARCHLUCID_SQL_TEST")):
        parser.error("set ARCHLUCID_API_TEST_SQL or ARCHLUCID_SQL_TEST to the disposable SQL fixture")

    cases = args.case or (Path(__file__).parent / "focused-api-sql-cases.txt").read_text(encoding="utf-8").splitlines()
    if not cases or len(set(cases)) != len(cases) or not all(CASE_NAME.fullmatch(case) for case in cases):
        parser.error("provide unique fully qualified API test names")
    output = args.results_dir.resolve()
    output.mkdir(parents=True, exist_ok=False)
    revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    reports = []
    for index, name in enumerate(cases, 1):
        print(f"[{index}/{len(cases)}] {name}", flush=True)
        result = run_case(name, output / f"{index:02d}", args.timeout_seconds)
        reports.append(result)
        print(f"  {result['outcome']}", flush=True)
        counts = {status: sum(row["outcome"] == status for row in reports)
                  for status in ("passed", "failed", "skipped", "interrupted")}
        (output / "summary.json").write_text(json.dumps({
            "commit": revision, "selected": len(cases), "counts": counts,
            "unreported": len(cases) - len(reports), "cases": reports,
        }, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(counts, sort_keys=True))
    return 0 if counts["passed"] == len(cases) else 1


if __name__ == "__main__":
    sys.exit(main())
