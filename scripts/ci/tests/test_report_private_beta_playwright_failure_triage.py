"""Tests for private-beta Playwright failure triage rollup script."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def _load_module():
    path = REPO_ROOT / "scripts/ci/report_private_beta_playwright_failure_triage.py"
    spec = importlib.util.spec_from_file_location("report_private_beta_playwright_failure_triage", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_build_summary_lists_triage_steps() -> None:
    module = _load_module()
    summary = module.build_summary(REPO_ROOT)

    assert summary["overallDisposition"] == "PASS"
    assert summary["stepCount"] >= 5
    steps = summary["steps"]
    assert isinstance(steps, list)
    assert any(row["stepId"] == "api-log" for row in steps)


def test_build_summary_smoke_branch_lane_artifact_names() -> None:
    module = _load_module()
    summary = module.build_summary(REPO_ROOT, lane="smoke-branch")
    steps = summary["steps"]
    api_log = next(row for row in steps if row["stepId"] == "api-log")

    assert api_log["artifact"] == "ui-e2e-live-beta-access-smoke-branch-api-log"
    assert summary["lane"] == "smoke-branch"


def test_render_markdown_includes_runbook_path() -> None:
    module = _load_module()
    summary = module.build_summary(REPO_ROOT)
    markdown = module.render_markdown(summary)

    assert "PRIVATE_BETA_TRUNK_SMOKE.md" in markdown
    assert "live-api-private-beta-access.spec.ts" in markdown
    assert "live-api-scim-invite-substitute-smoke.spec.ts" in markdown


def test_main_writes_json_output(tmp_path: Path) -> None:
    module = _load_module()
    json_out = tmp_path / "rollup.json"
    previous_argv = sys.argv

    sys.argv = [
        "report_private_beta_playwright_failure_triage.py",
        "--lane",
        "trunk",
        "--json-out",
        str(json_out),
    ]
    try:
        assert module.main() == 0
    finally:
        sys.argv = previous_argv

    payload = json.loads(json_out.read_text(encoding="utf-8"))
    assert payload["stepCount"] == len(module.build_triage_steps("trunk"))
    assert payload["lane"] == "trunk"
