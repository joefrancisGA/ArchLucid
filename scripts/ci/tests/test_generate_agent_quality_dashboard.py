"""Tests for scripts/ci/generate_agent_quality_dashboard.py."""

from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def test_dashboard_generates_from_committed_reports(tmp_path: Path) -> None:
    import importlib.util

    module_path = REPO_ROOT / "scripts" / "ci" / "generate_agent_quality_dashboard.py"
    spec = importlib.util.spec_from_file_location("generate_agent_quality_dashboard", module_path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)

    out = tmp_path / "agent-quality-dashboard.md"
    content = module.build_dashboard(REPO_ROOT)
    out.write_text(content, encoding="utf-8")

    text = out.read_text(encoding="utf-8")
    assert "Agent quality evidence dashboard" in text
    assert "Faithfulness positive readiness" in text
    assert "offline fixtures" in text
    assert "Internal-only caveats" in text
