"""Unit tests for assert_coverage_floor_ratchet._main()."""

from __future__ import annotations

from pathlib import Path

import assert_coverage_floor_ratchet as ratchet


def _write_cobertura(path: Path, *, line_rate: str) -> Path:
    path.write_text(
        f"""<?xml version="1.0"?>
<coverage line-rate="{line_rate}" branch-rate="0.60">
  <package name="ArchLucid.Core" line-rate="0.90" branch-rate="0.80">
    <line number="1"/>
  </package>
</coverage>""",
        encoding="utf-8",
    )
    return path


def test_ratchet_ok_at_threshold(tmp_path: Path) -> None:
    floor = tmp_path / ".coverage-floor"
    floor.write_text("83.0\n", encoding="utf-8")
    xml = _write_cobertura(tmp_path / "m.xml", line_rate="0.81")
    # 81.0 >= 83 - 2
    assert ratchet._main([str(xml), "--floor-file", str(floor), "--slack-pct", "2"]) == 0


def test_ratchet_fails_below_slack(tmp_path: Path) -> None:
    floor = tmp_path / ".coverage-floor"
    floor.write_text("83.0\n", encoding="utf-8")
    xml = _write_cobertura(tmp_path / "m.xml", line_rate="0.809")
    # 80.9 < 81.0
    assert ratchet._main([str(xml), "--floor-file", str(floor), "--slack-pct", "2"]) == 1


def test_ratchet_allows_comment_line(tmp_path: Path) -> None:
    floor = tmp_path / ".coverage-floor"
    floor.write_text("# note\n80.5 # inline\n", encoding="utf-8")
    xml = _write_cobertura(tmp_path / "m.xml", line_rate="0.785")
    # 78.5 >= 80.5 - 2
    assert ratchet._main([str(xml), "--floor-file", str(floor)]) == 0


def test_ratchet_missing_floor_file(tmp_path: Path) -> None:
    xml = _write_cobertura(tmp_path / "m.xml", line_rate="0.90")
    assert ratchet._main([str(xml), "--floor-file", str(tmp_path / "nope")]) == 2
