"""Contract checks for offline retrieval IR harness."""

from __future__ import annotations

import importlib.util
import json
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "ci" / "eval_retrieval_ir.py"
CASES = REPO_ROOT / "tests" / "eval-datasets" / "retrieval-golden" / "cases.json"


def test_eval_retrieval_ir_writes_markdown_and_json(tmp_path: Path) -> None:
    if not CASES.is_file():
        return

    report = tmp_path / "retrieval-ir-report.md"
    summary = tmp_path / "retrieval-ir-summary.json"

    completed = subprocess.run(
        [
            sys.executable,
            str(SCRIPT),
            "--cases",
            str(CASES),
            "--report",
            str(report),
            "--json-summary",
            str(summary),
        ],
        cwd=REPO_ROOT,
        check=False,
        capture_output=True,
        text=True,
    )

    assert completed.returncode == 0, completed.stderr
    assert report.is_file()
    assert summary.is_file()

    report_text = report.read_text(encoding="utf-8")
    assert "Mean recall@5:" in report_text
    assert "## Per-corpus breakdown" in report_text

    payload = json.loads(summary.read_text(encoding="utf-8"))
    assert payload["formatVersion"] in ("1.0", "1.1")
    assert "meanRecallAt5" in payload
    assert "meanMrr" in payload
    assert "meanNdcgAt10" in payload
    assert isinstance(payload["corpusBreakdown"], list)


def test_ndcg_at_k_prefers_expected_order_when_ordering_sensitive() -> None:
    if not SCRIPT.is_file():
        return

    spec = importlib.util.spec_from_file_location("eval_retrieval_ir", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)

    good = module._ndcg_at_k(
        ["pp-kv-01", "pp-pe-03", "noise"],
        ["pp-kv-01", "pp-pe-03"],
        10,
        ordering_sensitive=True,
    )
    bad = module._ndcg_at_k(
        ["pp-pe-03", "pp-kv-01", "noise"],
        ["pp-kv-01", "pp-pe-03"],
        10,
        ordering_sensitive=True,
    )

    assert good > bad
    assert good == 1.0
