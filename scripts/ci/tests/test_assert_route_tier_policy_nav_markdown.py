"""Markdown report helper for route/tier/policy/nav parity."""

from __future__ import annotations

import sys
from pathlib import Path

_CI_DIR = Path(__file__).resolve().parents[1]
if str(_CI_DIR) not in sys.path:
    sys.path.insert(0, str(_CI_DIR))

from assert_route_tier_policy_nav import render_markdown_report, repo_root, run_check  # noqa: E402


def test_render_markdown_report_passes_in_repo() -> None:
    root = repo_root()
    errors = run_check(root)
    body = render_markdown_report(root, errors)

    assert "**PASS**" in body or "**FAIL**" in body
    assert "Registry entries" in body
    assert errors == []


def test_render_markdown_report_includes_failures() -> None:
    root = repo_root()
    body = render_markdown_report(root, ["sample failure"])

    assert "**FAIL**" in body
    assert "sample failure" in body
    assert "## Next action" in body
