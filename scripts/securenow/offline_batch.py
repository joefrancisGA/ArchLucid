#!/usr/bin/env python3
"""Bounded, strictly offline multi-subscription SecureNow evidence replay.

Reuses existing evidence_lab and reconciliation logic plus a PREBUILT
SecureNow.QuestionReplay.dll. Does NOT execute the SQL-backed security engines,
restore/build .NET code, access Azure, or accept risk on behalf of operators.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import os
from pathlib import Path
import subprocess
import sys
from typing import Callable

sys.path.insert(0, str(Path(__file__).resolve().parent))
import evidence_lab  # noqa: E402
import reconcile_replay  # noqa: E402

SCHEMA = "securenow.evidence-lab.batch.v1"
MAX_SUBSCRIPTIONS = 100
MAX_WORKERS = 4
MAX_TOTAL_ZIP_BYTES = 1024 * 1024 * 1024
STAGES_NOT_EXECUTED = (
    "sqlSnapshotMaterialization",
    "privilegePathEngine",
    "intendedReachabilityEngine",
    "toxicCombinationEngine",
    "capabilityToFlowEngine",
    "sharedControlBlastRadiusEngine",
    "fourRealityDriftEngine",
    "pathRankingEngine",
    "cutPointAnalysisEngine",
    "pathRoutingSynchronization",
    "policyPackResolution",
    "humanDispositionResolution",
)


def run_native(dll: Path, package: Path, output: Path, timeout: int) -> str:
    """Run an already-built native replay executable; never restore/build."""
    try:
        environment = {
            key: value for key, value in os.environ.items()
            if key in {
                "PATH", "HOME", "USERPROFILE", "SYSTEMROOT", "WINDIR",
                "DOTNET_ROOT", "DOTNET_ROOT_X64", "LD_LIBRARY_PATH",
                "TMPDIR", "TMP", "TEMP",
            }
        }
        environment["DOTNET_CLI_TELEMETRY_OPTOUT"] = "1"
        environment["DOTNET_SKIP_FIRST_TIME_EXPERIENCE"] = "1"
        completed = subprocess.run(
            ["dotnet", str(dll), "--zip", str(package), "--out", str(output)],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
            env=environment,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return "TIMEOUT"
    except OSError:
        return "EXECUTION_UNAVAILABLE"
    return "EXECUTED" if completed.returncode == 0 else "PROCESS_FAILED"


def verify_native(native_dir: Path, sub: str, package_hash: str) -> dict:
    """Use the existing strict reconciliation validator, not a second parser."""
    data = reconcile_replay.read_native(native_dir, sub, package_hash)
    if data is None:
        raise ValueError("Native replay did not create a valid report")
    count = data.get("resourceCount")
    if type(count) is not int or count < 0:
        raise ValueError("Native replay missing trustworthy resource count")
    return data


def execute(
    package_dir: Path,
    native_dll: Path,
    out_dir: Path,
    expected_subscriptions: Path,
    questions_dir: Path | None = None,
    coverage_dir: Path | None = None,
    workers: int = 2,
    timeout: int = 120,
    executor: Callable[[Path, Path, Path, int], str] = run_native,
) -> dict:
    if workers < 1 or workers > MAX_WORKERS:
        raise ValueError(f"workers must be 1..{MAX_WORKERS}")
    if timeout < 1 or timeout > 600:
        raise ValueError("timeout must be 1..600 seconds")
    if not package_dir.is_dir():
        raise ValueError("packages must be an existing directory")
    if not native_dll.is_file() or native_dll.name != "SecureNow.QuestionReplay.dll":
        raise ValueError("Pass an already-built SecureNow.QuestionReplay.dll")
    if questions_dir is not None and not questions_dir.is_dir():
        raise ValueError("questions-dir must be an existing directory")
    if coverage_dir is not None and not coverage_dir.is_dir():
        raise ValueError("coverage-dir must be an existing directory")
    if out_dir.resolve().is_relative_to(package_dir.resolve()):
        raise ValueError("output directory cannot be inside package directory")
    expected = evidence_lab.read_json_file(expected_subscriptions)
    if (not isinstance(expected, list) or not expected
            or any(not isinstance(s, str) or not reconcile_replay.SUB_PATTERN.fullmatch(
                evidence_lab.normalize(s)) for s in expected)):
        raise ValueError("expected subscriptions must be a nonempty JSON array of IDs")
    if len(set(map(evidence_lab.normalize, expected))) != len(expected):
        raise ValueError("expected subscription IDs must be unique")

    packages = sorted(package_dir.glob("*.zip"))
    if not packages or len(packages) > MAX_SUBSCRIPTIONS:
        raise ValueError(f"Provide 1..{MAX_SUBSCRIPTIONS} ZIP packages")
    if sum(p.stat().st_size for p in packages) > MAX_TOTAL_ZIP_BYTES:
        raise ValueError("Total ZIP input exceeds 1 GiB")
    v1 = evidence_lab.run(
        packages, questions_dir, coverage_dir, expected_subscriptions, False
    )
    files_by_sub = {}
    for package in packages:
        identity = evidence_lab.load_package(package)
        sub = identity["subscriptionId"]
        if sub in files_by_sub:
            raise ValueError(f"Duplicate subscription: {sub}")
        files_by_sub[sub] = package

    out_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    # Avoid stale aggregate comparison/results from a prior invocation.
    for report_file in ("batch-report.json", "reconciliation.json"):
        (out_dir / report_file).unlink(missing_ok=True)
    native_dir = out_dir / "native"
    native_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    (out_dir / "evidence-coverage.json").write_text(
        json.dumps(v1, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    (out_dir / "evidence-coverage.md").write_text(
        evidence_lab.to_markdown(v1), encoding="utf-8"
    )
    outcomes = {}

    def one(sub: str, package: Path) -> tuple[str, str]:
        destination = native_dir / f"{sub}.native.json"
        # Never reuse a previous result as evidence of this execution.
        destination.unlink(missing_ok=True)
        state = executor(native_dll, package, destination, timeout)
        if state != "EXECUTED":
            return sub, state
        try:
            package_sha = next(p["packageSha256"] for p in v1["subscriptions"]
                               if p["subscriptionId"] == sub)
            verify_native(native_dir, sub, package_sha)
        except (ValueError, OSError, json.JSONDecodeError, StopIteration):
            return sub, "INVALID_NATIVE_REPORT"
        return sub, "NATIVE_PARTIAL_REPLAY"

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {
            pool.submit(one, sub, path): sub
            for sub, path in sorted(files_by_sub.items())
        }
        for future in as_completed(futures):
            sub = futures[future]
            try:
                key, state = future.result()
                outcomes[key] = state
            except Exception:
                # Never turn an unexpected worker exception into a passing result,
                # nor include raw input/customer fields from exception strings.
                outcomes[sub] = "WORKER_FAILED"

    # Comparison uses the existing strict package-binding code. For failed
    # native workers, reports are absent and comparisons become NOT_COMPARABLE.
    reconciliation = (
        reconcile_replay.compare(v1, native_dir, questions_dir)
        if questions_dir is not None else None
    )
    if reconciliation is not None:
        (out_dir / "reconciliation.json").write_text(
            json.dumps(reconciliation, indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
    compared = {
        row["subscriptionId"]: row
        for row in (reconciliation or {}).get("subscriptions", [])
    }
    rows = []
    for package in v1["subscriptions"]:
        sub = package["subscriptionId"]
        native_state = outcomes.get(sub, "WORKER_FAILED")
        parity = compared.get(sub, {}).get("state", "NOT_COMPARABLE")
        rows.append({
            "subscriptionId": sub,
            "packageSha256": package["packageSha256"],
            "resourceCountFromZip": package["resourceCount"],
            "nativeReplay": native_state,
            "inventoryQuestionParity": parity,
            "questionQueueStatus": package["questionQueueStatus"],
            "evidenceFileCoverage": package["evidenceFileCoverage"],
            "nativeStages": {
                stage: (
                    "EXECUTED_PARTIAL" if native_state == "NATIVE_PARTIAL_REPLAY"
                    else "NOT_VERIFIED"
                )
                for stage in (
                    "zipInventoryReader", "securityEdgeMaterializer",
                    "diagramQuestionCompiler",
                )
            },
            "engineStages": {name: "NOT_EXECUTED" for name in STAGES_NOT_EXECUTED},
            "provenanceAuthenticated": False,
            "questionsAutomaticallyAnswered": 0,
        })

    missing = v1["notCollectedSubscriptions"] or []
    extra = v1["unexpectedSubscriptions"] or []
    native_failures = any(row["nativeReplay"] != "NATIVE_PARTIAL_REPLAY" for row in rows)
    parity_issue = questions_dir is not None and any(
        row["inventoryQuestionParity"] != "MATCHED_PARTIAL_SLICE" for row in rows
    )
    outcome = (
        "HOLD" if missing or extra or native_failures or parity_issue
        else "PARTIAL_NATIVE_REPLAY_ONLY"
    )
    return {
        "schema": SCHEMA,
        "status": outcome,
        "nativeExecutionCount": sum(
            row["nativeReplay"] == "NATIVE_PARTIAL_REPLAY" for row in rows
        ),
        "missingExpectedSubscriptions": missing,
        "unexpectedSubscriptions": extra,
        "subscriptions": rows,
        "limitations": [
            "No SQL-backed security engines, rankings, or cut points executed in this batch.",
            "A successful partial replay does not prove complete Azure collection or a safe configuration.",
            "Question export provenance is not authenticated; snapshot and policy may differ.",
            "Absent evidence files do not establish Azure permission denial.",
            "No findings, questions, owner-gated holds, or risks are automatically resolved.",
        ],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packages", type=Path, required=True)
    parser.add_argument("--native-dll", type=Path, required=True)
    parser.add_argument("--expected-subscriptions", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--questions-dir", type=Path)
    parser.add_argument("--coverage-dir", type=Path)
    parser.add_argument("--workers", type=int, default=2)
    parser.add_argument("--timeout-seconds", type=int, default=120)
    args = parser.parse_args(argv)
    try:
        report = execute(
            args.packages, args.native_dll, args.out, args.expected_subscriptions,
            args.questions_dir, args.coverage_dir, args.workers, args.timeout_seconds,
        )
        (args.out / "batch-report.json").write_text(
            json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8"
        )
        print(f"SecureNow offline batch: {report['status']}; "
              f"{report['nativeExecutionCount']} native partial replays.")
        return 3 if report["status"] == "HOLD" else 0
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        print(f"SecureNow offline batch input failure: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
