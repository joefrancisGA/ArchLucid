"""Tests for scripts/ci/check_canonical_doc_entry.py."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


def test_canonical_doc_entry_guard_passes_on_repo() -> None:
    script = REPO_ROOT / "scripts" / "ci" / "check_canonical_doc_entry.py"
    result = subprocess.run(
        [sys.executable, str(script)],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0, result.stdout + result.stderr
