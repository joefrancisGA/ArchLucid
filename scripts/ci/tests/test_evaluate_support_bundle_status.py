"""Tests for support-bundle presence and redaction status."""

from __future__ import annotations

import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT / "scripts" / "ci") not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT / "scripts" / "ci"))

from evaluate_support_bundle_status import evaluate  # noqa: E402


def test_missing_support_bundle_reports_missing(tmp_path: Path) -> None:
    payload = evaluate(tmp_path)

    assert payload["status"] == "MISSING"
    assert payload["redactionStatus"] == "NOT_EVALUATED"


def test_present_support_bundle_passes_redaction(tmp_path: Path) -> None:
    (tmp_path / "support-bundle-summary.md").write_text(
        "# Support bundle\n\nAll sensitive values are redacted.\n",
        encoding="utf-8",
    )

    payload = evaluate(tmp_path)

    assert payload["status"] == "PASS"
    assert payload["redactionStatus"] == "PASS"
    assert payload["matchedFiles"] == ["support-bundle-summary.md"]


def test_secret_pattern_holds_without_echoing_secret(tmp_path: Path) -> None:
    (tmp_path / "support-bundle-summary.md").write_text(
        "ConnectionStrings__Default=Server=tcp:example;User Id=sa;Password=DefinitelySecret123!\n",
        encoding="utf-8",
    )

    payload = evaluate(tmp_path)

    assert payload["status"] == "HOLD"
    assert payload["redactionStatus"] == "FAIL"
    assert {"file": "support-bundle-summary.md", "pattern": "sql_connection_string", "line": 1} in payload[
        "redactionFindings"
    ]
    assert {"file": "support-bundle-summary.md", "pattern": "api_key_assignment", "line": 1} in payload[
        "redactionFindings"
    ]
    assert "DefinitelySecret" not in str(payload)


def test_status_file_does_not_count_as_support_bundle(tmp_path: Path) -> None:
    (tmp_path / "support-bundle-status.json").write_text("{}", encoding="utf-8")

    payload = evaluate(tmp_path)

    assert payload["status"] == "MISSING"


def test_nested_support_summary_counts_as_support_bundle(tmp_path: Path) -> None:
    nested = tmp_path / "first-pilot-evidence" / "bundle-001"
    nested.mkdir(parents=True)
    (nested / "support-summary.md").write_text("Support notes with redacted values.\n", encoding="utf-8")

    payload = evaluate(tmp_path)

    assert payload["status"] == "PASS"
    assert payload["matchedFiles"] == ["first-pilot-evidence/bundle-001/support-summary.md"]
