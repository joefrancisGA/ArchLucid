#!/usr/bin/env python3
"""SecureNow beta offline-gate evidence. Never asserts staging deployment or rollback."""
from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path


def build(env: dict[str, str]) -> dict:
    checks = {
        "matrix_structure": env.get("MATRIX_RESULT", "unknown"),
        "verification_and_cross_scope_tests": env.get("APPLICATION_RESULT", "unknown"),
        "product_boundary_tests": env.get("ARCHITECTURE_RESULT", "unknown"),
    }
    offline = (
        all(value == "success" for value in checks.values())
        and re.fullmatch(r"[0-9a-fA-F]{40}", env.get("TESTED_SHA", "")) is not None
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
    args = parser.parse_args()
    if args.output:
        payload = build(dict(os.environ))
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(payload, indent=2))
        return 0
    try:
        payload = json.loads(args.check.read_text(encoding="utf-8"))
    except (OSError, ValueError, UnicodeError) as exc:
        print(f"Missing/invalid evidence: {exc}")
        return 1
    if not isinstance(payload, dict) or not isinstance(payload.get("checks"), dict):
        print("Invalid beta evidence document; no promotion.")
        return 1
    if (\n        payload.get("schema_version") != 1
        or payload.get("product") != "SecureNow"\n        or not isinstance(payload.get("tested_commit_sha"), str)\n        or not re.fullmatch(r"[0-9a-fA-F]{40}", payload["tested_commit_sha"])\n        or not re.fullmatch(r"[1-9][0-9]*", str(payload.get("github_run_id", "")))\n        or payload.get("beta_release_decision") != "NO_GO"\n        or payload.get("staging_deployment") != "NOT_RUN"\n        or payload.get("live_auth_and_tenant_isolation") != "NOT_RUN"\n        or payload.get("real_azure_collection") != "NOT_RUN"\n        or payload.get("staging_rollback_and_evidence_preservation") != "NOT_RUN"\n        or payload.get("offline_gate") != "PASS"\n        or any(
        payload.get("checks", {}).get(k) != "success"
        for k in ("matrix_structure", "verification_and_cross_scope_tests", "product_boundary_tests")
        )\n    ):
        print("Offline gate failed or missing checks; no promotion.")
        return 1
    print("Offline checks passed. Beta release remains NO_GO until staging and human gates.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
