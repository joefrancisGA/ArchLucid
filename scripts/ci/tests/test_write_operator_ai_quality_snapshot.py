"""Tests for operator AI quality snapshot writer."""

from __future__ import annotations

import json
from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parents[3]


def test_write_operator_ai_quality_snapshot_passes_with_current_report() -> None:
    import scripts.ci.write_operator_ai_quality_snapshot as module  # noqa: PLC0415

    exit_code = module.main()
    assert exit_code == 0

    out_path = REPO_ROOT / "archlucid-ui" / "public" / "operator-ai-quality-snapshot.json"
    payload = json.loads(out_path.read_text(encoding="utf-8"))
    assert payload["disposition"] in ("PASS", "WARN", "NOT_GENERATED")
    assert payload["retrievalIr"]["meanRecallAt5"] is not None
    assert isinstance(payload.get("history"), list)
    assert len(payload["history"]) >= 1

    history_path = REPO_ROOT / "archlucid-ui" / "public" / "operator-ai-quality-history.json"
    history = json.loads(history_path.read_text(encoding="utf-8"))
    assert isinstance(history, list)
    assert len(history) >= 1
