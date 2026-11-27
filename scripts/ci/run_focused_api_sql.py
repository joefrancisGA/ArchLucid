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
from tempfile import NamedTemporaryFile
import time
import xml.etree.ElementTree as et

ROOT = Path(__file__).resolve().parents[2]
TEST_PROJECT = "ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj"
CASE_NAME = re.compile(r"ArchLucid\.Api\.Tests\.[A-Za-z0-9_.]+")
INVENTORY_CASE = ("ArchLucid.Api.Tests.AuthorityPipelineCommittedInventorySqlIntegrationTests."
                  "Repeat_finalize_rejects_a_corrupt_persisted_inventory_hash")
INVENTORY_STAGE_MARKER = "ARCHLUCID_SQL_INVENTORY_STAGE "
INVENTORY_STAGES = {
    "bootstrap", "create-review", "initial-finalize", "control-repeat-finalize",
    "prepare-fixture", "repeat-finalize", "cleanup",
}
INVENTORY_HTTP_STATUS_EXPECTED = {"initial-status": "2xx", "control-repeat-status": "2xx", "repeat-status": 409}
FINAL_OUTCOMES = ("passed", "failed", "skipped", "interrupted")
FIXTURE_PHASES = ("setup", "cleanup")
FIXTURE_CLEANUP_OUTCOMES = ("already-absent", "still-present", "unverified")


class Cancellation:
    def __init__(self):
        self.signum = None

    def request(self, signum, _frame):
        # Do not raise from a handler. A signal can arrive before Popen returns,
        # or while the runner is installing an atomic checkpoint.
        if self.signum is None:
            self.signum = signum

    @property
    def exit_code(self):
        return None if self.signum is None else 128 + self.signum


def inventory_failure(result):
    # VSTest captures ITestOutputHelper in StdOut. Copy only known stages and bounded
    # numbers or enums, never assertion messages, response bodies, or general stdout.
    report = {"stage": "not-reported"}
    for stdout in result.findall("./{*}Output/{*}StdOut"):
        for line in (stdout.text or "").splitlines():
            line = line.strip()
            if not line.startswith(INVENTORY_STAGE_MARKER):
                continue
            fields = line[len(INVENTORY_STAGE_MARKER):].split()
            if len(fields) == 1 and fields[0] in INVENTORY_STAGES:
                report = {"stage": fields[0]}
            elif len(fields) == 2:
                stage, value = fields
                if stage in INVENTORY_HTTP_STATUS_EXPECTED and re.fullmatch(r"[1-5][0-9]{2}", value):
                    report = {"stage": stage, "expected": INVENTORY_HTTP_STATUS_EXPECTED[stage], "actual": int(value)}
                elif stage == "fixture-row-count" and re.fullmatch(r"-1|[0-9]{1,6}", value):
                    report = {"stage": stage, "expected": 1, "actual": int(value)}
    return report


def read_result(trx, name, code, timed_out):
    if timed_out or not trx.is_file():
        return "interrupted", None
    try:
        results = et.parse(trx).findall(".//{*}UnitTestResult")
    except (et.ParseError, OSError):
        return "interrupted", None
    if len(results) != 1 or results[0].get("testName") != name:
        return "interrupted", None
    recorded = results[0].get("outcome")
    if recorded == "Passed":
        return ("passed" if code == 0 else "interrupted"), None
    if recorded in ("NotExecuted", "Skipped"):
        return "skipped", None
    if recorded == "Failed":
        return "failed", inventory_failure(results[0]) if name == INVENTORY_CASE else None
    return "interrupted", None


def stop_test_tree(child):
    if os.name == "posix":
        try:
            os.killpg(child.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
    elif child.poll() is None:
        result = subprocess.run(["taskkill", "/F", "/T", "/PID", str(child.pid)], check=False)
        if result.returncode and child.poll() is None:
            child.kill()
    child.wait()


def run_case(name, output, timeout, cancellation):
    result = {"case": name, "outcome": "interrupted", "exit_code": None, "artifact_dir": output.name}
    if cancellation.signum is not None:
        result["interruption"] = "cancelled"
        return result
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
        deadline = time.monotonic() + timeout
        while cancellation.signum is None:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                timed_out = True
                break
            try:
                child.wait(timeout=min(remaining, 0.2))
                break
            except subprocess.TimeoutExpired:
                continue
        cancelled = cancellation.signum is not None
        if timed_out or cancelled:
            stop_test_tree(child)
    outcome, failure = read_result(trx, name, child.returncode, timed_out or cancelled)
    result.update(outcome=outcome, exit_code=child.returncode)
    if cancelled:
        result["interruption"] = "cancelled"
    if failure is not None:
        result["failure"] = failure
    return result


def summarize(revision, reports):
    counts = {status: sum(row["outcome"] == status for row in reports) for status in FINAL_OUTCOMES}
    return {
        "commit": revision, "selected": len(reports), "counts": counts,
        "unreported": len(reports) - sum(counts.values()), "cases": reports,
    }


def checkpoint(path, summary):
    # Install each complete snapshot in one same-directory rename. An interrupted
    # write cannot leave a truncated or missing previously published summary.
    with NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent, delete=False) as temporary:
        temp_path = Path(temporary.name)
        try:
            json.dump(summary, temporary, indent=2)
            temporary.write("\n")
            temporary.close()
            temp_path.replace(path)
        finally:
            temp_path.unlink(missing_ok=True)


def read_fixture_summary(path, revision):
    summary = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(summary, dict) or summary.get("commit") != revision or not isinstance(summary.get("cases"), list):
        raise ValueError("fixture report is not from this revision")
    return summary


def record_fixture_timeout(path, revision, phase):
    summary = read_fixture_summary(path, revision)
    phases = summary.setdefault("fixture_timeouts", [])
    if not isinstance(phases, list) or any(item not in FIXTURE_PHASES for item in phases):
        raise ValueError("invalid fixture phases")
    if phase not in phases:
        phases.append(phase)
        checkpoint(path, summary)


def record_fixture_cleanup(path, revision, outcome):
    summary = read_fixture_summary(path, revision)
    summary["fixture_cleanup"] = outcome
    checkpoint(path, summary)


def main(argv=None, cancellation=None):
    cancellation = cancellation if cancellation is not None else Cancellation()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--results-dir", required=True, type=Path, help="New directory, or the directory from --prepare-only")
    parser.add_argument("--case", action="append", help="Exact fully qualified name; repeat to select multiple cases")
    parser.add_argument("--timeout-seconds", type=int, default=150, help="Limit per test process")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--prepare-only", action="store_true", help="Write the complete selection before fixture setup")
    mode.add_argument("--use-prepared", action="store_true", help="Run the same selection from an untouched prepared summary")
    mode.add_argument("--record-fixture-timeout", choices=FIXTURE_PHASES, help="Add a fixture timeout without changing test outcomes")
    mode.add_argument("--record-fixture-cleanup", choices=FIXTURE_CLEANUP_OUTCOMES,
                      help="Record cleanup verification without changing test outcomes")
    args = parser.parse_args(argv)
    if args.timeout_seconds < 20:
        parser.error("the case timeout must be at least 20 seconds")

    output = args.results_dir.resolve()
    summary_path = output / "summary.json"
    revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    if args.record_fixture_timeout or args.record_fixture_cleanup:
        try:
            if args.record_fixture_timeout:
                record_fixture_timeout(summary_path, revision, args.record_fixture_timeout)
            else:
                record_fixture_cleanup(summary_path, revision, args.record_fixture_cleanup)
        except (OSError, ValueError):
            parser.error("cannot annotate the existing focused SQL summary")
        return cancellation.exit_code or 0

    cases = args.case or (Path(__file__).parent / "focused-api-sql-cases.txt").read_text(encoding="utf-8").splitlines()
    if not cases or len(set(cases)) != len(cases) or not all(CASE_NAME.fullmatch(case) for case in cases):
        parser.error("provide unique fully qualified API test names")
    reports = [{"case": name, "outcome": "not-started", "artifact_dir": f"{index:02d}"}
               for index, name in enumerate(cases, 1)]
    initial = summarize(revision, reports)
    if args.use_prepared:
        try:
            prepared = json.loads(summary_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            parser.error("cannot read a prepared summary from the results directory")
        if prepared != initial:
            parser.error("prepared summary must match the revision and case selection and have no started cases")
    else:
        output.mkdir(parents=True, exist_ok=False)
        checkpoint(summary_path, initial)
        print(f"Selected cases: {json.dumps(cases)}", flush=True)
    if args.prepare_only or cancellation.signum is not None:
        return cancellation.exit_code or 0
    if not any(os.environ.get(key, "").strip() for key in ("ARCHLUCID_API_TEST_SQL", "ARCHLUCID_SQL_TEST")):
        parser.error("set ARCHLUCID_API_TEST_SQL or ARCHLUCID_SQL_TEST to the disposable SQL fixture")

    for index, name in enumerate(cases, 1):
        if cancellation.signum is not None:
            break
        row = reports[index - 1]
        row["outcome"] = "running"
        checkpoint(summary_path, summarize(revision, reports))
        print(f"[{index}/{len(cases)}] {name}", flush=True)
        result = run_case(name, output / row["artifact_dir"], args.timeout_seconds, cancellation)
        reports[index - 1] = result
        checkpoint(summary_path, summarize(revision, reports))
        print(f"  {result['outcome']}", flush=True)
        if "failure" in result:
            print(f"  {json.dumps(result['failure'], sort_keys=True)}", flush=True)
    counts = summarize(revision, reports)["counts"]
    print(json.dumps(counts, sort_keys=True))
    if cancellation.signum is not None:
        return cancellation.exit_code
    return 0 if counts["passed"] == len(cases) else 1


if __name__ == "__main__":
    cancellation = Cancellation()
    for signum in (signal.SIGINT, signal.SIGTERM):
        signal.signal(signum, cancellation.request)
    sys.exit(main(cancellation=cancellation))
