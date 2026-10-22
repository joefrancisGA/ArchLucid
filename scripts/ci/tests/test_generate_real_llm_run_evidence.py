"""Tests for scripts/ci/generate_real_llm_run_evidence.py."""

from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def test_real_llm_report_records_skipped_reason(tmp_path: Path) -> None:
    import importlib.util

    module_path = REPO_ROOT / "scripts" / "ci" / "generate_real_llm_run_evidence.py"
    spec = importlib.util.spec_from_file_location("generate_real_llm_run_evidence", module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)

    content = module.build_report(root=REPO_ROOT, skipped_reason="secrets unavailable")
    assert "Skipped live-mode collection" in content
    assert "secrets unavailable" in content
    assert "example-complete.json" in content
