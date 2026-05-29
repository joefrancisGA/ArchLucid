"""Drift guard for mutating route idempotency posture."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
DRIFT = REPO_ROOT / "scripts" / "ci" / "detect_mutating_route_idempotency_drift.py"
BASELINE = REPO_ROOT / "scripts" / "ci" / "fixtures" / "mutating_route_idempotency_baseline.json"


def test_idempotency_drift_passes_against_committed_baseline() -> None:
    proc = subprocess.run(
        [sys.executable, str(DRIFT)],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 0, proc.stderr or proc.stdout
    assert BASELINE.is_file()
    payload = json.loads(BASELINE.read_text(encoding="utf-8"))
    assert payload.get("formatVersion") == "1.0"
    assert isinstance(payload.get("routes"), dict)
