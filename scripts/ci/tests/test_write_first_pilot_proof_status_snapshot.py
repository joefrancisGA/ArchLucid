"""Tests for first-pilot proof status snapshot writer."""

from __future__ import annotations

import json
from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parents[3]


def test_write_first_pilot_proof_status_snapshot_writes_payload() -> None:
    import write_first_pilot_proof_status_snapshot as module  # noqa: PLC0415

    exit_code = module.main()
    assert exit_code == 0

    out_path = REPO_ROOT / "archlucid-ui" / "public" / "first-pilot-proof-status-snapshot.json"
    payload = json.loads(out_path.read_text(encoding="utf-8"))
    assert payload["disposition"] in ("PASS", "WARN", "BLOCK", "NOT_RUN")
    assert "nextAction" in payload
