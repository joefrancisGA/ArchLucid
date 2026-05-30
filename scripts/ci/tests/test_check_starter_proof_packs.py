"""Tests for scripts/ci/check_starter_proof_packs.py."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _run_check(packs_root: Path) -> subprocess.CompletedProcess[str]:
    script = _repo_root() / "scripts" / "ci" / "check_starter_proof_packs.py"
    return subprocess.run(
        [sys.executable, str(script), "--packs-root", str(packs_root)],
        capture_output=True,
        text=True,
        check=False,
    )


def test_valid_fixture_passes(tmp_path: Path) -> None:
    pack = tmp_path / "demo-pack"
    pack.mkdir()
    meta = {
        "id": "demo-pack",
        "title": "Demo",
        "targetBuyer": "Evaluator",
        "buyerJob": "Demo job",
        "owner": "Test",
        "lastReviewedUtc": "2026-05-29",
        "requiredInputs": ["second-run.json"],
        "expectedOutputs": ["checklist"],
        "scopeLabel": "V1-ready",
        "doNotUseWhen": ["Never for real PHI"],
        "deferredScopeNotes": "Not certification.",
    }
    (pack / "starter-pack.json").write_text(json.dumps(meta), encoding="utf-8")
    (pack / "architecture-request.json").write_text('{"description":"synthetic demo no real costs"}', encoding="utf-8")
    (pack / "second-run.json").write_text("{}", encoding="utf-8")
    (pack / "policy-context.json").write_text("{}", encoding="utf-8")
    (pack / "proof-package-checklist.md").write_text("# Checklist", encoding="utf-8")
    (pack / "README.md").write_text("# Demo", encoding="utf-8")
    (tmp_path / "STARTER_PROOF_PACK_CHOOSER.md").write_text(
        "# Chooser\nSee CORE_PILOT.md\n[demo-pack/](demo-pack/)",
        encoding="utf-8",
    )

    result = _run_check(tmp_path)
    assert result.returncode == 0, result.stderr


def test_chooser_must_reference_packs(tmp_path: Path) -> None:
    pack = tmp_path / "demo-pack"
    pack.mkdir()
    meta = {
        "id": "demo-pack",
        "title": "Demo",
        "targetBuyer": "Evaluator",
        "buyerJob": "Demo job",
        "owner": "Test",
        "lastReviewedUtc": "2026-05-29",
        "requiredInputs": ["second-run.json"],
        "expectedOutputs": ["checklist"],
        "scopeLabel": "V1-ready",
        "doNotUseWhen": ["Never for real PHI"],
        "deferredScopeNotes": "Not certification.",
    }
    (pack / "starter-pack.json").write_text(json.dumps(meta), encoding="utf-8")
    (pack / "architecture-request.json").write_text('{"description":"synthetic demo no real costs"}', encoding="utf-8")
    (pack / "second-run.json").write_text("{}", encoding="utf-8")
    (pack / "policy-context.json").write_text("{}", encoding="utf-8")
    (pack / "proof-package-checklist.md").write_text("# Checklist", encoding="utf-8")
    (pack / "README.md").write_text("# Demo", encoding="utf-8")
    (tmp_path / "STARTER_PROOF_PACK_CHOOSER.md").write_text("# Chooser\nSee CORE_PILOT.md", encoding="utf-8")

    result = _run_check(tmp_path)
    assert result.returncode != 0
    assert "chooser does not reference pack folder" in result.stderr


def test_missing_metadata_fails(tmp_path: Path) -> None:
    pack = tmp_path / "bad-pack"
    pack.mkdir()
    (pack / "starter-pack.json").write_text("{}", encoding="utf-8")
    (pack / "architecture-request.json").write_text('{"description":"synthetic demo"}', encoding="utf-8")
    (pack / "second-run.json").write_text("{}", encoding="utf-8")
    (pack / "policy-context.json").write_text("{}", encoding="utf-8")
    (pack / "proof-package-checklist.md").write_text("# Checklist", encoding="utf-8")
    (pack / "README.md").write_text("# Bad", encoding="utf-8")
    (tmp_path / "STARTER_PROOF_PACK_CHOOSER.md").write_text("# Chooser\nSee CORE_PILOT.md\n[bad-pack/](bad-pack/)", encoding="utf-8")

    result = _run_check(tmp_path)
    assert result.returncode != 0
    assert "missing or empty" in result.stderr


def test_repo_starter_packs_pass() -> None:
    root = _repo_root() / "templates" / "starter-proof-packs"
    result = _run_check(root)
    assert result.returncode == 0, result.stderr
