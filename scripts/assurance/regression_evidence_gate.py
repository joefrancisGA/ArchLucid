#!/usr/bin/env python3
"""Validate critical defect intake and replay a bounded sample of registered regressions."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import json
import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

from regression_ledger import DEFECT_ID, REVISION, TEST_DISPOSITIONS, matches, parse_json, validate

ROOT = Path(__file__).resolve().parents[2]
INTAKE = "scripts/assurance/regression-evidence/critical-defects.json"
SAMPLE_LIMIT = 5
SOURCE = "scripts/assurance/regression_ledger.py"


@dataclass(frozen=True)
class Probe:
    identity: str
    defect_id: str
    intended_behavior: str
    expected_failure: str
    baseline: str = "62bc3b8d362e7694cee1394668cd0bcae790b54e"
    corrected: str = "12c7e9a95248f72f5374948a5fe533e5d4b373b2"


PROBES = {
    "null-receipt": Probe(
        "regression_ledger.enforce_rejects_null_artifact", "FND-166-NULL-RECEIPT",
        "Enforcement rejects a confirmed regression whose artifact is null.",
        "enforcement accepted a confirmed regression with a null artifact",
    ),
    "missing-defects": Probe(
        "regression_ledger.enforce_rejects_missing_defects", "FND-166-MISSING-DEFECTS",
        "Enforcement rejects a ledger envelope without a defect list.",
        "enforcement accepted a ledger envelope without a defect list",
    ),
}


def canonical_json(payload: object) -> bytes:
    return (json.dumps(payload, indent=2, sort_keys=True) + "\n").encode()


def git(repo: Path, *args: str, timeout: int = 15) -> subprocess.CompletedProcess:
    return subprocess.run(["git", *args], cwd=repo, capture_output=True, check=False, timeout=timeout)


def require_revision(repo: Path, revision: str, fetch_missing: bool) -> None:
    if not matches(REVISION, revision):
        raise ValueError("Git revision must be a full lowercase commit SHA")
    if git(repo, "cat-file", "-e", f"{revision}^{{commit}}").returncode == 0:
        return
    if fetch_missing and git(repo, "fetch", "--no-tags", "--depth=1", "--filter=blob:none", "origin", revision,
                             timeout=60).returncode == 0:
        if git(repo, "cat-file", "-e", f"{revision}^{{commit}}").returncode == 0:
            return
    raise ValueError("a pinned replay or comparison revision is unavailable")


def read_base(repo: Path, revision: str | None, fetch_missing: bool) -> list:
    if revision is None:
        return []
    require_revision(repo, revision, fetch_missing)
    listed = git(repo, "ls-tree", revision, "--", INTAKE)
    if listed.returncode != 0:
        raise ValueError("base intake availability could not be checked")
    if not listed.stdout:
        return []  # Initial introduction of the intake.
    blob = git(repo, "show", f"{revision}:{INTAKE}")
    if blob.returncode != 0:
        raise ValueError("base intake could not be read")
    return read_intake(parse_json(blob.stdout))


def read_intake(payload: object) -> list[dict]:
    if not isinstance(payload, dict) or type(payload.get("schemaVersion")) is not int or payload["schemaVersion"] != 1:
        raise ValueError("intake must be a version 1 object")
    rows = payload.get("defects")
    if not isinstance(rows, list):
        raise ValueError("intake requires a defects list")
    ids = set()
    for row in rows:
        if not isinstance(row, dict) or not matches(DEFECT_ID, row.get("defectId")):
            raise ValueError("each intake row requires a valid defectId")
        if row["defectId"] in ids:
            raise ValueError("intake contains a duplicate defectId")
        ids.add(row["defectId"])
        if row.get("severity") not in ("critical", "high", "medium", "low") or type(row.get("confirmed")) is not bool:
            raise ValueError("each intake row requires explicit severity and confirmed fields")
        if "replay" in row:
            key = row["replay"]
            disposition = row.get("regressionDisposition")
            if (not isinstance(key, str) or key not in PROBES or PROBES[key].defect_id != row["defectId"]
                    or row["severity"] != "critical" or not row["confirmed"]
                    or not isinstance(disposition, str) or disposition not in TEST_DISPOSITIONS):
                raise ValueError("intake replay must name the registered probe for that confirmed critical defect")
    return rows


def critical(rows: list[dict]) -> dict[str, dict]:
    return {row["defectId"]: row for row in rows if row["confirmed"] and row["severity"] == "critical"}


def replay_selection(previous: dict, current: dict) -> list[dict]:
    if previous.keys() - current.keys():
        raise ValueError("previously confirmed critical defects cannot be removed or downgraded from intake")
    if any("replay" in old and current[key].get("replay") != old["replay"] for key, old in previous.items()):
        raise ValueError("an existing registered replay cannot be removed or substituted")
    changed = [row for key, row in current.items() if "replay" in row and row != previous.get(key)]
    if len(changed) > SAMPLE_LIMIT:
        raise ValueError("changed registered replays exceed the bounded sample; split the change")
    existing = [row for key, row in current.items() if "replay" in row and row == previous.get(key)]
    return (changed + existing)[:SAMPLE_LIMIT]


def exercise(repo: Path, revision: str, key: str, fetch_missing: bool) -> dict:
    require_revision(repo, revision, fetch_missing)
    blob = git(repo, "show", f"{revision}:{SOURCE}")
    if blob.returncode != 0:
        raise ValueError("standalone replay source was not found at the pinned revision")
    fixture = {"notDefects": []}
    if key == "null-receipt":
        fixture = {"defects": [{
            "defectId": "REPLAY-FIXTURE", "confirmed": True, "regressionDisposition": "regression-test",
            "regressionArtifact": None,
        }]}
    with TemporaryDirectory(prefix="regression-evidence-replay-") as directory:
        work = Path(directory)
        script = work / "validator.py"
        script.write_bytes(blob.stdout)
        ledger = work / "intake.json"
        ledger.write_bytes(canonical_json(fixture))
        run = subprocess.run(
            [sys.executable, "-I", str(script), str(ledger), "--enforce"], cwd=work,
            capture_output=True, check=False, timeout=10,
        )

    # An unexpected exception, command error, or non-execution is never the expected red.
    report = parse_json(run.stdout)
    if (run.stderr or not isinstance(report, dict) or report.get("schemaVersion") != 1
            or type(report.get("errorCount")) is not int or not isinstance(report.get("errors"), list)
            or len(report["errors"]) != report["errorCount"]):
        raise ValueError("replay did not produce a consistent validator result")
    probe = PROBES[key]
    observed = {"revision": revision, "testIdentity": probe.identity, "executedCount": 1,
                "validatorExitCode": run.returncode, "validatorErrorCount": report["errorCount"]}
    check = "regressionArtifact" if key == "null-receipt" else "defects list"
    if run.returncode == 1 and any(isinstance(item, str) and check in item for item in report["errors"]):
        return dict(observed, exitCode=0, outcome="passed")
    if run.returncode == 0 and report["errorCount"] == 0:
        return dict(observed, exitCode=1, outcome="assertion-failed", failureReason=probe.expected_failure)
    raise ValueError("replay failed for an unexpected reason")


def replay(repo: Path, key: str, fetch_missing: bool) -> dict:
    probe = PROBES[key]
    red = exercise(repo, probe.baseline, key, fetch_missing)
    green = exercise(repo, probe.corrected, key, fetch_missing)
    if red["outcome"] != "assertion-failed" or green["outcome"] != "passed":
        raise ValueError("replay did not observe the expected baseline failure and corrected pass")
    return {
        "schemaVersion": 1, "defectId": probe.defect_id, "regressionDisposition": "regression-test",
        "intendedBehavior": probe.intended_behavior, "testIdentity": probe.identity,
        "expectedFailureReason": probe.expected_failure, "baseline": red, "corrected": green,
    }


def check(repo: Path, intake: Path, output: Path, base: str | None, fetch_missing: bool, summary: dict) -> None:
    rows = read_intake(parse_json(intake.read_bytes()))
    current = critical(rows)
    previous = critical(read_base(repo, base, fetch_missing))
    summary.update(intakeCount=len(rows), confirmedCriticalCount=len(current),
                   newlyConfirmedCriticalCount=len(current.keys() - previous.keys()))
    selected = replay_selection(previous, current)
    summary["errors"] = validate(list(current.values()), artifact_root=intake.parent)
    if summary["errors"]:
        return
    summary["receiptOrExceptionCount"] = len(current)
    for row in selected:
        key = row["replay"]
        actual = canonical_json(replay(repo, key, fetch_missing))
        if actual != (intake.parent / row["regressionArtifact"]).read_bytes():
            raise ValueError("replayed evidence does not match the validated committed receipt")
        (output / f"{key}.json").write_bytes(actual)
        summary["replayedDefectIds"].append(row["defectId"])
    summary["status"] = ("verified-replay-sample" if selected else
                         "receipt-validation-only" if current else "no-eligible-defects")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=ROOT)
    parser.add_argument("--base", help="Full PR base revision for intake comparisons")
    parser.add_argument("--expected-head", help="Full expected checkout revision")
    parser.add_argument("--intake", type=Path)
    parser.add_argument("--output", type=Path, required=True, help="New evidence output directory")
    parser.add_argument("--fetch-missing", action="store_true", help="Allow bounded fetches of pinned revisions")
    args = parser.parse_args(argv)
    try:
        args.output.mkdir(parents=True, exist_ok=False)
    except OSError:
        parser.error("cannot create a new evidence output directory")
    summary = {"schemaVersion": 1, "status": "failed", "replayedDefectIds": [], "errors": []}
    try:
        if args.expected_head is not None:
            head = git(args.repo, "rev-parse", "HEAD")
            if (not matches(REVISION, args.expected_head) or head.returncode != 0
                    or head.stdout.decode("ascii").strip() != args.expected_head):
                raise ValueError("checkout does not match the expected head revision")
            summary["sourceRevision"] = args.expected_head
        if args.base is not None and matches(REVISION, args.base):
            summary["baseRevision"] = args.base
        check(args.repo, args.intake or args.repo / INTAKE, args.output, args.base, args.fetch_missing, summary)
    except (OSError, subprocess.TimeoutExpired, json.JSONDecodeError, RecursionError):
        summary["errors"].append("an input was unreadable, malformed, or timed out")
    except ValueError as exc:
        summary["errors"].append(str(exc))
    (args.output / "summary.json").write_bytes(canonical_json(summary))
    print(canonical_json(summary).decode(), end="")
    return int(summary["status"] == "failed")


if __name__ == "__main__":
    raise SystemExit(main())
