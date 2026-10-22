"""CLI tests for set-archlucid-ui-route-score.py UX cap mode."""

from __future__ import annotations

import subprocess
import sys
import tempfile
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parents[3]
_SCRIPT = _REPO_ROOT / "scripts" / "ci" / "set-archlucid-ui-route-score.py"


def _workbook(rows: str) -> str:
    return (
        "intro\n\n"
        "**OVERALL WEIGHT SCORE:** 0%\n\n"
        "## Master table (UX score 0 first; then Deficit desc; ties A→Z by path)\n\n"
        "| ID | Path | Hit% | Scores | Weight | Deficit | Section | Done | Notes |\n"
        "|----|------|------|--------|--------|---------|---------|------|-------|\n"
        f"{rows}\n\n"
        "---\n"
        "after\n"
    )


def _run_cli(*args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(_SCRIPT), *args],
        check=False,
        capture_output=True,
        text=True,
    )


def test_cap_ux_max_clamps_only_ux_and_recomputes_weight() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        doc = Path(tmp) / "workbook.md"
        doc.write_text(
            _workbook(
                "| SIG | `/signup` | 0.2% | 70,88 | 17.6 | 2.4 | Marketing | No | None |\n"
                "| HOM | `/` | 3% | 82,80 | 240 | 60 | Core review | No | None |"
            ),
            encoding="utf-8",
        )

        result = _run_cli("--cap-ux-max", "87", "--doc", str(doc))

        assert result.returncode == 0, result.stderr
        assert "Capped 1 UX score(s) to 87" in result.stdout
        text = doc.read_text(encoding="utf-8")
        assert "| SIG | `/signup` | 0.2% | 70,87 | 17.4 | 2.6 |" in text
        assert "| HOM | `/` | 3% | 82,80 | 240 | 60 |" in text


def test_cap_ux_max_rejects_out_of_range() -> None:
    result = _run_cli("--cap-ux-max", "101")

    assert result.returncode == 1
    assert "--cap-ux-max must be between 0 and 100" in result.stderr


def test_missing_id_and_score_without_cap_flag_fails() -> None:
    result = _run_cli()

    assert result.returncode == 1
    assert "Provide both ID and score" in result.stderr
