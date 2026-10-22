"""Tests for retrieval quality rollup script."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[3]
SCRIPT = REPO_ROOT / "scripts" / "ci" / "report_retrieval_quality_rollup.py"


def test_retrieval_quality_rollup_emits_pass_when_ir_present(tmp_path: Path) -> None:
    md = tmp_path / "rollup.md"
    js = tmp_path / "rollup.json"
    proc = subprocess.run(
        [sys.executable, str(SCRIPT), "--markdown-out", str(md), "--json-out", str(js)],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
    )
    assert proc.returncode == 0
    payload = json.loads(js.read_text(encoding="utf-8"))
    assert payload["retrievalIrStatus"] == "present"
    assert md.is_file()
