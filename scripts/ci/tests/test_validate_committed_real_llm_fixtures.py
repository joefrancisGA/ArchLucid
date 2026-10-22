"""Tests for validate_committed_real_llm_fixtures.py."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def test_validate_existing_committed_fixtures_exit_zero() -> None:
    script = _repo_root() / "scripts" / "ci" / "validate_committed_real_llm_fixtures.py"
    completed = subprocess.run(
        [sys.executable, str(script)],
        cwd=_repo_root(),
        check=False,
        capture_output=True,
        text=True,
    )
    assert completed.returncode == 0, completed.stdout + completed.stderr


def test_rejects_forbidden_secret_pattern(tmp_path: Path) -> None:
    script = _repo_root() / "scripts" / "ci" / "validate_committed_real_llm_fixtures.py"
    folder = tmp_path / "agent-results"
    folder.mkdir()
    bad = {
        "resultId": "x",
        "taskId": "t",
        "runId": "r",
        "agentType": 1,
        "claims": [],
        "evidenceRefs": [],
        "confidence": 0.5,
        "findings": [{"severity": "Low", "description": "sk-abcdefghijklmnopqrstuvwxyz"}],
        "createdUtc": "2026-05-10T12:00:00Z",
    }
    (folder / "bad.real.json").write_text(json.dumps(bad), encoding="utf-8")
    completed = subprocess.run(
        [sys.executable, str(script), "--agent-results-dir", str(folder)],
        check=False,
        capture_output=True,
        text=True,
    )
    assert completed.returncode == 1
