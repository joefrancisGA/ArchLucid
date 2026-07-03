"""Unit tests for TB-166 release real-mode claim gate."""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "scripts" / "ci"))

from check_release_real_mode_claim import evaluate_release_real_mode_claim  # noqa: E402


def test_committed_fixtures_cover_all_four_agent_types() -> None:
    agent_dir = _REPO_ROOT / "tests" / "eval-corpus" / "agent-results"
    disposition, rows, wording = evaluate_release_real_mode_claim(
        agent_results_dir=agent_dir,
        gate_json=None,
        require_gate=False,
        max_gate_age_days=30,
        allow_simulator_only=False,
    )

    fixture_row = next(row for row in rows if row["check"].startswith("Committed"))
    assert fixture_row["result"] == "PASS"
    assert disposition in {"WARN", "PASS"}
    assert wording in {"partial-real-mode", "simulator-only", "full-real-mode"}


def test_missing_agent_type_fails() -> None:
    disposition, rows, wording = evaluate_release_real_mode_claim(
        agent_results_dir=_REPO_ROOT / "tests" / "eval-corpus" / "agent-results",
        gate_json=_REPO_ROOT / "scripts" / "ci" / "fixtures" / "missing-real-mode-gate.json",
        require_gate=True,
        max_gate_age_days=30,
        allow_simulator_only=False,
    )

    assert disposition == "HOLD"
    assert any(row["result"] == "FAIL" for row in rows)
    assert wording == "partial-real-mode"


def test_simulator_only_override_passes() -> None:
    disposition, rows, wording = evaluate_release_real_mode_claim(
        agent_results_dir=_REPO_ROOT / "tests" / "eval-corpus" / "agent-results",
        gate_json=None,
        require_gate=True,
        max_gate_age_days=30,
        allow_simulator_only=True,
    )

    assert disposition == "PASS"
    assert rows[0]["check"] == "Simulator-only override"
    assert wording == "simulator-only"


def test_gate_pass_with_pipeline_profile(tmp_path: Path) -> None:
    gate = tmp_path / "gate.json"
    gate.write_text(
        json.dumps(
            {
                "schema": "archlucid.real-llm-evidence-gate.v2",
                "generatedUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "disposition": "PASS",
                "fullPipelineProfile": {"mergeSuccess": True},
                "gitCommitSha": "abc123def456",
            }
        ),
        encoding="utf-8",
    )

    disposition, rows, wording = evaluate_release_real_mode_claim(
        agent_results_dir=_REPO_ROOT / "tests" / "eval-corpus" / "agent-results",
        gate_json=gate,
        require_gate=True,
        max_gate_age_days=30,
        allow_simulator_only=False,
        expected_commit_sha="abc123def456",
    )

    assert disposition == "PASS"
    assert any(row["check"] == "Full pipeline profile" and row["result"] == "PASS" for row in rows)
    assert any(row["check"] == "Gate commit SHA (RC freshness)" and row["result"] == "PASS" for row in rows)
    assert wording == "full-real-mode"


def test_gate_commit_sha_mismatch_fails(tmp_path: Path) -> None:
    gate = tmp_path / "gate.json"
    gate.write_text(
        json.dumps(
            {
                "schema": "archlucid.real-llm-evidence-gate.v2",
                "generatedUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
                "disposition": "PASS",
                "fullPipelineProfile": {"mergeSuccess": True},
                "gitCommitSha": "deadbeef0001",
            }
        ),
        encoding="utf-8",
    )

    disposition, rows, wording = evaluate_release_real_mode_claim(
        agent_results_dir=_REPO_ROOT / "tests" / "eval-corpus" / "agent-results",
        gate_json=gate,
        require_gate=True,
        max_gate_age_days=30,
        allow_simulator_only=False,
        rc_strict_claims=True,
        expected_commit_sha="abc123def456",
    )

    assert disposition == "HOLD"
    assert any(row["check"] == "Gate commit SHA (RC freshness)" and row["result"] == "FAIL" for row in rows)
    assert wording == "partial-real-mode"


def test_waiver_required_when_gate_missing_and_strict(tmp_path: Path) -> None:
    disposition, rows, wording = evaluate_release_real_mode_claim(
        agent_results_dir=_REPO_ROOT / "tests" / "eval-corpus" / "agent-results",
        gate_json=None,
        require_gate=True,
        max_gate_age_days=30,
        allow_simulator_only=False,
        rc_strict_claims=True,
    )

    assert disposition == "HOLD"
    assert wording == "waiver-required"
    assert any(row["check"] == "real-llm-evidence-gate.json" and row["result"] == "FAIL" for row in rows)


def test_waiver_marks_waived_not_verified(tmp_path: Path) -> None:
    waiver = tmp_path / "waiver.json"
    waiver.write_text(
        json.dumps(
            {
                "schema": "archlucid.real-mode-evidence-waiver.v1",
                "owner": "release-owner",
                "rationale": "Staging AOAI outage; simulator RC with explicit buyer caveat.",
            }
        ),
        encoding="utf-8",
    )

    disposition, rows, wording = evaluate_release_real_mode_claim(
        agent_results_dir=_REPO_ROOT / "tests" / "eval-corpus" / "agent-results",
        gate_json=None,
        require_gate=True,
        max_gate_age_days=30,
        allow_simulator_only=False,
        waiver_json=waiver,
    )

    assert disposition == "HOLD"
    assert wording == "waived-not-verified"
    assert any(row["check"] == "Real-mode evidence waiver" and row["result"] == "PASS" for row in rows)


def test_cli_simulator_only_rc_strict_exits_zero(tmp_path: Path) -> None:
    json_out = tmp_path / "claim.json"
    md_out = tmp_path / "claim.md"
    result = subprocess.run(
        [
            sys.executable,
            str(_REPO_ROOT / "scripts" / "ci" / "check_release_real_mode_claim.py"),
            "--allow-simulator-only",
            "--rc-strict-claims",
            "--json-out",
            str(json_out),
            "--markdown-out",
            str(md_out),
        ],
        cwd=_REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    payload = json.loads(json_out.read_text(encoding="utf-8"))
    assert payload["disposition"] == "PASS"
    assert payload["claimWordingClass"] == "simulator-only"
    assert isinstance(payload.get("blockingReasons"), list)
    assert result.returncode == 0, result.stderr or result.stdout
