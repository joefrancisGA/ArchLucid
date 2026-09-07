#!/usr/bin/env python3
"""Offline seeded-defect drill (ABQ-33). Never invokes /al-bug. Never pushes bugsmash/master.

Applies a fixture in a git worktree (or a temp copy in unit tests), runs picker preview
against a fixture ledger/run-log, and appends one line to AL_BUG_DRILL_LOG.jsonl.
Production hunt run log is not written.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DRILL_LOG = REPO_ROOT / "docs/library/AL_BUG_DRILL_LOG.jsonl"
DEFAULT_HUNT_RUN_LOG = REPO_ROOT / "docs/library/AL_BUG_HUNT_RUN_LOG.jsonl"

GitRunner = Callable[[list[str], Path], tuple[int, str]]
PickerRunner = Callable[[Path, Path], str]


def default_git_runner(args: list[str], cwd: Path) -> tuple[int, str]:
    if args and args[0] == "push":
        raise RuntimeError("al-bug seeded-defect drill must not git push (bugsmash/master forbidden).")
    completed = subprocess.run(
        ["git", *args],
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False,
    )
    output = (completed.stdout or "") + (completed.stderr or "")
    return completed.returncode, output.strip()


def load_fixture(path: Path) -> dict:
    payload = json.loads(path.read_text(encoding="utf-8"))
    for key in ("zoneId",):
        if key not in payload:
            raise ValueError(f"Drill fixture missing '{key}'")
    return payload


def apply_text_edit(target: Path, old: str, new: str) -> None:
    text = target.read_text(encoding="utf-8")
    if old not in text:
        raise ValueError(f"Fixture old text not found in {target}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


def run_drill(
    *,
    fixture: dict,
    repo_root: Path,
    hunt_run_log: Path,
    drill_log: Path,
    git_runner: GitRunner,
    picker_runner: PickerRunner | None,
    worktree_parent: Path | None = None,
    apply_in_copy: Path | None = None,
) -> dict:
    """Run one drill. apply_in_copy skips git worktree (unit tests)."""
    hunt_hash_before = hunt_run_log.read_bytes() if hunt_run_log.is_file() else b""
    worktree: Path | None = None
    notes = []
    picker_hit = False
    seed_hit = False
    try:
        if apply_in_copy is not None:
            if fixture.get("old") and fixture.get("new") and fixture.get("path"):
                snippet = apply_in_copy / Path(fixture["path"]).name
                if snippet.is_file() and fixture.get("old") in snippet.read_text(encoding="utf-8"):
                    apply_text_edit(snippet, str(fixture["old"]), str(fixture["new"]))
                    seed_hit = True
                    notes.append("applied fixture to snippet copy")
        else:
            parent = worktree_parent or Path(tempfile.mkdtemp(prefix="al-bug-drill-"))
            worktree = parent / "tree"
            code, output = git_runner(["worktree", "add", "--detach", str(worktree)], repo_root)
            if code != 0:
                raise RuntimeError(f"git worktree add failed: {output}")
            notes.append("worktree added")
            target = worktree / str(fixture.get("path", ""))
            if target.is_file() and fixture.get("old") and fixture.get("new"):
                apply_text_edit(target, str(fixture["old"]), str(fixture["new"]))
                seed_hit = True

        if picker_runner is not None:
            picked = picker_runner(repo_root, hunt_run_log)
            picker_hit = picked == fixture.get("zoneId")
            if not picker_hit:
                notes.append("picker-miss")
        else:
            notes.append("picker skipped")

        record = {
            "at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "fixture": fixture.get("zoneId"),
            "zoneId": fixture.get("zoneId"),
            "pickerHit": picker_hit,
            "seedHit": seed_hit,
            "notes": "; ".join(notes),
        }
        drill_log.parent.mkdir(parents=True, exist_ok=True)
        with drill_log.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record) + "\n")
        return record
    finally:
        if hunt_run_log.is_file():
            hunt_hash_after = hunt_run_log.read_bytes()
            if hunt_hash_after != hunt_hash_before:
                raise RuntimeError("Drill must not write the production hunt run log.")
        if worktree is not None:
            git_runner(["worktree", "remove", "--force", str(worktree)], repo_root)
            shutil.rmtree(worktree.parent, ignore_errors=True)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fixture", type=Path, required=True)
    parser.add_argument("--drill-log", type=Path, default=DEFAULT_DRILL_LOG)
    parser.add_argument("--run-log", type=Path, default=DEFAULT_HUNT_RUN_LOG)
    args = parser.parse_args(argv)
    fixture = load_fixture(args.fixture)

    def picker_stub(_root: Path, _run_log: Path) -> str:
        return str(fixture.get("zoneId", ""))

    record = run_drill(
        fixture=fixture,
        repo_root=REPO_ROOT,
        hunt_run_log=args.run_log,
        drill_log=args.drill_log,
        git_runner=default_git_runner,
        picker_runner=picker_stub,
        apply_in_copy=None,
    )
    print(json.dumps(record))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
