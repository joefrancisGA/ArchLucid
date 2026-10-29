#!/usr/bin/env python3
"""SecureNow beta offline-gate evidence. Never asserts staging deployment or rollback."""
from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path


def core_candidate_attribution_valid(attribution: object, sha: str, run_id: str) -> bool:
    """Require observed, passing Core TRX candidates tied to this exact Actions run.

    This is *not* verification of the underlying requirements or authorization
    to release. It prevents a successful dotnet exit with missing/empty TRX
    from being counted as useful Core evidence.
    """
    if not isinstance(attribution, dict):
        return False
    if (attribution.get("schemaVersion") != 1
            or attribution.get("product") != "SecureNow"
            or attribution.get("evidenceClass") != "OBSERVED_TEST_RESULTS_CANDIDATE_ONLY"
            or attribution.get("betaReleaseDecision") != "NO_GO"
            or attribution.get("fullyVerifiedRequirementCount") != 0
            or not isinstance(sha, str)
            or not re.fullmatch(r"[0-9a-fA-F]{40}", sha)
            or sha == "0" * 40
            or attribution.get("testedSha") != sha.lower()
            or attribution.get("githubRunId") != run_id
            or attribution.get("sourceProblems") != []):
        return False
    rows = attribution.get("requirements")
    if not isinstance(rows, list) or len(rows) != 22:
        return False
    if len({row.get("id") for row in rows if isinstance(row, dict)}) != 22:
        return False
    for rid in ("FR-EV-03", "NFR-02"):
        row = next((entry for entry in rows if isinstance(entry, dict) and entry.get("id") == rid), None)
        if (row is None or row.get("status") != "UNKNOWN"
                or row.get("releaseEvidenceVerified") is not False
                or row.get("blocker") != "CANDIDATE_TEST_PASSED_REQUIREMENT_UNVERIFIED"):
            return False
        observed = row.get("observedTests")
        if not isinstance(observed, list) or not observed:
            return False
        if not any(isinstance(test, dict)
                   and isinstance(test.get("name"), str)
                   and "SecurityEvidencePathGuardTests." in test["name"]
                   and test.get("outcomes") == ["passed"] for test in observed):
            return False
        if any(not isinstance(test, dict) or test.get("outcomes") != ["passed"] for test in observed):
            return False
    return True


def build(env: dict[str, str], *, attribution: object = None) -> dict:
    checks = {
        "matrix_structure": env.get("MATRIX_RESULT", "unknown"),
        "verification_and_cross_scope_tests": env.get("APPLICATION_RESULT", "unknown"),
        "product_boundary_tests": env.get("ARCHITECTURE_RESULT", "unknown"),
        "security_path_guard_tests": env.get("CORE_RESULT", "unknown"),
        "security_path_guard_attribution": (
            "success" if core_candidate_attribution_valid(
                attribution, env.get("TESTED_SHA", ""), env.get("RUN_ID", "")) else "failure"
        ),
    }
    offline = (
        all(value == "success" for value in checks.values())
        and re.fullmatch(r"[0-9a-fA-F]{40}", env.get("TESTED_SHA", "")) is not None
        and int(env.get("TESTED_SHA", "0"), 16) != 0
        and re.fullmatch(r"[1-9][0-9]*", env.get("RUN_ID", "")) is not None
    )
    return {
        "schema_version": 1,
        "product": "SecureNow",
        "tested_commit_sha": env.get("TESTED_SHA", "UNKNOWN"),
        "github_run_id": env.get("RUN_ID", "UNKNOWN"),
        "checks": checks,
        "offline_gate": "PASS" if offline else "FAIL",
        "staging_deployment": "NOT_RUN",
        "live_auth_and_tenant_isolation": "NOT_RUN",
        "real_azure_collection": "NOT_RUN",
        "staging_rollback_and_evidence_preservation": "NOT_RUN",
        "beta_release_decision": "NO_GO",
        "reason": "Offline test success alone cannot establish staging deployment, authentication, recovery, or live evidence correctness.",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--output", type=Path)
    group.add_argument("--check", type=Path)
    parser.add_argument("--attribution", type=Path, help="Observed TRX candidate report (required for PASS)")
    parser.add_argument("--expected-sha", help="Expected immutable GitHub commit SHA for --check")
    parser.add_argument("--expected-run-id", help="Expected GitHub Actions run ID for --check")
    args = parser.parse_args()
    if args.output:
        try:
            attribution = (json.loads(args.attribution.read_text(encoding="utf-8"))
                           if args.attribution is not None else None)
        except (OSError, ValueError, UnicodeError):
            attribution = None  # Missing or invalid proof fails closed.
        payload = build(dict(os.environ), attribution=attribution)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(payload, indent=2))
        return 0
    try:
        payload = json.loads(args.check.read_text(encoding="utf-8"))
    except (OSError, ValueError, UnicodeError) as exc:
        print(f"Missing/invalid evidence: {exc}")
        return 1
    if args.expected_sha is not None and (
        not re.fullmatch(r"[0-9a-fA-F]{40}", args.expected_sha)
        or args.expected_sha == "0" * 40
    ):
        print("Invalid expected commit SHA; no promotion.")
        return 1
    if args.expected_run_id is not None and not re.fullmatch(r"[1-9][0-9]*", args.expected_run_id):
        print("Invalid expected Actions run identifier; no promotion.")
        return 1
    if not isinstance(payload, dict) or not isinstance(payload.get("checks"), dict):
        print("Invalid beta evidence document; no promotion.")
        return 1
    if (
        payload.get("schema_version") != 1
        or payload.get("product") != "SecureNow"
        or not isinstance(payload.get("tested_commit_sha"), str)
        or not re.fullmatch(r"[0-9a-fA-F]{40}", payload["tested_commit_sha"])
        or not re.fullmatch(r"[1-9][0-9]*", str(payload.get("github_run_id", "")))
        or payload.get("beta_release_decision") != "NO_GO"
        or payload.get("staging_deployment") != "NOT_RUN"
        or payload.get("live_auth_and_tenant_isolation") != "NOT_RUN"
        or payload.get("real_azure_collection") != "NOT_RUN"
        or payload.get("staging_rollback_and_evidence_preservation") != "NOT_RUN"
        or payload.get("offline_gate") != "PASS"
        or payload.get("tested_commit_sha") == "0" * 40
        or (args.expected_sha is not None and payload.get("tested_commit_sha", "").lower() != args.expected_sha.lower())
        or (args.expected_run_id is not None and str(payload.get("github_run_id", "")) != args.expected_run_id)
        or any(
        payload.get("checks", {}).get(k) != "success"
        for k in ("matrix_structure", "verification_and_cross_scope_tests",
                  "product_boundary_tests", "security_path_guard_tests",
                  "security_path_guard_attribution")
        )
    ):
        print("Offline gate failed or missing checks; no promotion.")
        return 1
    print("Offline checks passed. Beta release remains NO_GO until staging and human gates.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
