"""Tests for scripts/ci/build_real_llm_session_record.py."""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
if str(REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(REPO_ROOT / "scripts" / "ci"))

from build_real_llm_session_record import (  # noqa: E402
    build_session_record_markdown,
    resolve_session_status,
)


def test_skipped_credentials_status() -> None:
    status = resolve_session_status(credentials_present=False, gate=None)
    assert status == "SKIPPED_NO_CREDENTIALS"

    markdown, status = build_session_record_markdown(
        gate_json_path=None,
        gate_markdown_rel="artifacts/release/real-llm-evidence-gate.md",
        session_markdown_rel="docs/quality/REAL_LLM_SESSION_test.md",
        credentials_present=False,
    )

    assert status == "SKIPPED_NO_CREDENTIALS"
    assert "SKIPPED_NO_CREDENTIALS" in markdown
    assert "release-usable" in markdown


def test_incomplete_when_gate_missing_with_credentials() -> None:
    status = resolve_session_status(credentials_present=True, gate=None)
    assert status == "INCOMPLETE"


def test_hold_when_gate_disposition_hold(tmp_path: Path) -> None:
    gate = tmp_path / "gate.json"
    gate.write_text(
        json.dumps(
            {
                "schema": "archlucid.real-llm-evidence-gate.v2",
                "disposition": "HOLD",
                "generatedUtc": "2026-06-01T12:00:00Z",
            }
        ),
        encoding="utf-8",
    )

    status = resolve_session_status(credentials_present=True, gate=json.loads(gate.read_text(encoding="utf-8")))
    assert status == "HOLD"

    markdown, status = build_session_record_markdown(
        gate_json_path=gate,
        gate_markdown_rel="artifacts/release/real-llm-evidence-gate.md",
        session_markdown_rel="docs/quality/REAL_LLM_SESSION_test.md",
        credentials_present=True,
    )

    assert status == "HOLD"
    assert "Human verdict" in markdown


def test_pass_when_gate_complete(tmp_path: Path) -> None:
    gate = tmp_path / "gate.json"
    gate.write_text(
        json.dumps(
            {
                "schema": "archlucid.real-llm-evidence-gate.v2",
                "disposition": "PASS",
                "generatedUtc": "2026-06-01T12:00:00Z",
                "gitCommitSha": "abc123def456",
                "fullPipelineProfile": {"mergeSuccess": True},
            }
        ),
        encoding="utf-8",
    )

    status = resolve_session_status(credentials_present=True, gate=json.loads(gate.read_text(encoding="utf-8")))
    assert status == "PASS"

    markdown, status = build_session_record_markdown(
        gate_json_path=gate,
        gate_markdown_rel="artifacts/release/real-llm-evidence-gate.md",
        session_markdown_rel="docs/quality/REAL_LLM_SESSION_test.md",
        credentials_present=True,
    )

    assert status == "PASS"
    assert "Topology, Cost, Compliance, Critic" in markdown
    assert "abc123def456" in markdown
