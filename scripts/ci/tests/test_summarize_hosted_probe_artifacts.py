"""Tests for scripts/ops/summarize_hosted_probe_artifacts.py (hosted probe rollup)."""

from __future__ import annotations

import sys
from pathlib import Path

import pytest

_OPS_ROOT = Path(__file__).resolve().parent.parent.parent / "ops"
_FIXTURES = Path(__file__).resolve().parent.parent.parent / "fixtures" / "hosted_probe_rollup"

if str(_OPS_ROOT) not in sys.path:
    sys.path.insert(0, str(_OPS_ROOT))

import summarize_hosted_probe_artifacts as sh  # noqa: E402


def _load_fixture_dir(name: str) -> list[dict]:
    return sh.load_rows_from_json_paths([_FIXTURES / name])


def test_all_green_staging_and_full_uptime() -> None:
    rows = _load_fixture_dir("all_green")
    model = sh.build_rollup(rows)

    assert model.environment_label == "staging"
    assert model.attempted_count == 3
    assert model.both_ok_count == 3
    assert model.failed_probe_count == 0
    assert model.uptime_percent_of_attempted is not None
    assert abs(model.uptime_percent_of_attempted - 100.0) < 0.0001
    assert model.overall_disposition == "WARN"
    assert model.buyer_safe_evidence is False

    md = sh.render_markdown(model)

    assert "Not a contractual SLA" in md
    assert "**staging**" in md or "staging" in md
    assert "100.0000%" in md
    assert "**WARN**" in md


def test_partial_failure_uptime_and_caveat() -> None:
    rows = _load_fixture_dir("partial_failure")
    model = sh.build_rollup(rows)

    assert model.attempted_count == 3
    assert model.both_ok_count == 2
    assert model.failed_probe_count == 1
    assert model.uptime_percent_of_attempted is not None
    assert abs(model.uptime_percent_of_attempted - (100.0 * 2 / 3)) < 0.001

    md = sh.render_markdown(model)

    assert "Some runs failed live/ready checks" in md


def test_insufficient_data_no_attempted_probes() -> None:
    rows = _load_fixture_dir("insufficient")
    model = sh.build_rollup(rows)

    assert model.attempted_count == 0
    assert model.uptime_percent_of_attempted is None
    assert model.overall_disposition == "INCONCLUSIVE"
    assert model.buyer_safe_evidence is False

    md = sh.render_markdown(model)

    assert "insufficient data" in md.lower()
    assert "99.9" in md
    assert "Target SLO" in md
    assert "**INCONCLUSIVE**" in md


def test_csv_loads_and_inference_production() -> None:
    rows = sh.load_rows_from_csv(_FIXTURES / "csv" / "sample.csv")
    model = sh.build_rollup(rows)

    assert model.attempted_count == 1
    assert model.environment_label == "production"
    assert model.overall_disposition == "PASS"
    assert model.buyer_safe_evidence is True


def test_mixed_base_urls_environment_unknown() -> None:
    rows = [
        {
            "skipped": False,
            "probedAtUtc": "2026-05-01T00:00:00Z",
            "baseUrl": "https://staging.archlucid.net",
            "live_ok": True,
            "ready_ok": True,
        },
        {
            "skipped": False,
            "probedAtUtc": "2026-05-02T00:00:00Z",
            "baseUrl": "https://api.archlucid.net",
            "live_ok": True,
            "ready_ok": True,
        },
    ]
    model = sh.build_rollup(rows)

    assert model.environment_label == "unknown"
    assert model.overall_disposition == "INCONCLUSIVE"
    assert model.buyer_safe_evidence is False
    assert any("Mixed environment" in c for c in model.caveats)


def test_main_writes_markdown(tmp_path: Path) -> None:
    out = tmp_path / "rollup.md"
    exit_code = sh.main(["--format", "markdown", "-o", str(out), str(_FIXTURES / "all_green")])

    assert exit_code == 0
    text = out.read_text(encoding="utf-8")

    assert "Hosted SaaS probe availability rollup" in text
    assert "Not a contractual SLA" in text


def test_render_text_contains_slo_disclaimer() -> None:
    rows = _load_fixture_dir("all_green")
    model = sh.build_rollup(rows)
    text = sh.render_text(model)

    assert "target_availability_slo_percent (published target, not claimed achieved)" in text
