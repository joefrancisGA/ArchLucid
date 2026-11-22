#!/usr/bin/env python3
"""Run independent FND-010 verifier, emit bounded incident event, return failure."""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
from datetime import datetime, timezone


def incident_from_failure(alert_path: Path, run_url: str) -> dict:
    try:
        alert = json.loads(alert_path.read_text())
    except (OSError, ValueError):
        alert = {"errorType": "VerifierUnavailable"}
    return {
        "schemaVersion": 1,
        "source": "fnd010-independent-monitor",
        "severity": "critical",
        "status": "verification_failed",
        "errorType": str(alert.get("errorType", "Unknown"))[:80],
        "observedUtc": datetime.now(timezone.utc).isoformat(),
        "runUrl": run_url[:512],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", required=True)
    parser.add_argument("--pinned-public-key", required=True)
    parser.add_argument("--expected-key-id", required=True)
    parser.add_argument("--sqlcmd", nargs="+", required=True)
    parser.add_argument("--incident", required=True)
    args = parser.parse_args()
    incident = Path(args.incident)
    alert = incident.with_suffix(".verifier.json")
    cmd = [
        sys.executable, "-m", "scripts.security.fnd010_integrity_monitor",
        "--checkpoint", args.checkpoint,
        "--pinned-public-key", args.pinned_public_key,
        "--expected-key-id", args.expected_key_id,
        "--alert-file", str(alert),
        "--sqlcmd", *args.sqlcmd,
    ]
    try:
        result = subprocess.run(cmd, timeout=300, check=False)
        if result.returncode == 0:
            return 0
    except (OSError, subprocess.TimeoutExpired):
        pass
    incident.write_text(json.dumps(
        incident_from_failure(alert, os.getenv("GITHUB_SERVER_URL", "") + "/" +
                              os.getenv("GITHUB_REPOSITORY", "") + "/actions/runs/" +
                              os.getenv("GITHUB_RUN_ID", "")), sort_keys=True) + "\n")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
