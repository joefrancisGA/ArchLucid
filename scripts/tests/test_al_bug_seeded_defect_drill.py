#!/usr/bin/env python3
"""Unit tests for ABQ-33 seeded-defect drills (no /al-bug, no git push)."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

_AGENT_DIR = Path(__file__).resolve().parents[1] / "agent"
_SPEC = importlib.util.spec_from_file_location(
    "drill",
    _AGENT_DIR / "al-bug-seeded-defect-drill.py",
)
drill = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
sys.modules["drill"] = drill
_SPEC.loader.exec_module(drill)

FIXTURE = Path(__file__).resolve().parent / "fixtures/al-bug-drills/boolean-reader-guard.json"


def test_picker_hit_on_matching_zone(tmp_path: Path | None = None) -> None:
    root = Path("/tmp/al-bug-drill-root")
    root.mkdir(parents=True, exist_ok=True)
    hunt_log = root / "AL_BUG_HUNT_RUN_LOG.jsonl"
    hunt_log.write_text("", encoding="utf-8")
    drill_log = root / "AL_BUG_DRILL_LOG.jsonl"
    snippet_dir = root / "copy"
    snippet_dir.mkdir(exist_ok=True)
    snippet = snippet_dir / "JsonBooleanStringReader.cs"
    snippet.write_text("if (ok) { return true; }\n", encoding="utf-8")
    fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
    pushes: list[list[str]] = []

    def git_runner(args: list[str], _cwd: Path) -> tuple[int, str]:
        if args and args[0] == "push":
            pushes.append(args)
            raise RuntimeError("push forbidden")
        if args and args[0] == "worktree":
            return 0, "ok"
        return 0, "ok"

    def picker(_root: Path, _log: Path) -> str:
        return fixture["zoneId"]

    record = drill.run_drill(
        fixture=fixture,
        repo_root=root,
        hunt_run_log=hunt_log,
        drill_log=drill_log,
        git_runner=git_runner,
        picker_runner=picker,
        apply_in_copy=snippet_dir,
    )
    assert record["pickerHit"] is True
    assert record["seedHit"] is True
    assert "return false;" in snippet.read_text(encoding="utf-8")
    assert hunt_log.read_text(encoding="utf-8") == ""
    assert pushes == []
    assert drill_log.is_file()


def test_worktree_removed_after_error() -> None:
    root = Path("/tmp/al-bug-drill-cleanup")
    root.mkdir(parents=True, exist_ok=True)
    hunt_log = root / "AL_BUG_HUNT_RUN_LOG.jsonl"
    hunt_log.write_text("{}\n", encoding="utf-8")
    drill_log = root / "drill.jsonl"
    removed: list[str] = []

    def git_runner(args: list[str], _cwd: Path) -> tuple[int, str]:
        if args[:2] == ["worktree", "add"]:
            Path(args[3]).mkdir(parents=True, exist_ok=True)
            return 0, "ok"
        if args[:2] == ["worktree", "remove"]:
            removed.append(args[3])
            return 0, "ok"
        if args and args[0] == "push":
            raise RuntimeError("push forbidden")
        return 0, "ok"

    def picker(_root: Path, _log: Path) -> str:
        raise RuntimeError("picker boom")

    try:
        drill.run_drill(
            fixture={"zoneId": "core-json-boolean"},
            repo_root=root,
            hunt_run_log=hunt_log,
            drill_log=drill_log,
            git_runner=git_runner,
            picker_runner=picker,
        )
    except RuntimeError:
        pass
    assert removed, "worktree remove must run in finally"


def test_git_push_helper_raises() -> None:
    try:
        drill.default_git_runner(["push", "origin", "bugsmash"], Path("."))
        raise AssertionError("push should raise")
    except RuntimeError as exc:
        assert "must not git push" in str(exc)


if __name__ == "__main__":
    failures = 0
    for name, fn in sorted(globals().items()):
        if not name.startswith("test_") or not callable(fn):
            continue
        try:
            fn()
            print(f"PASS {name}")
        except AssertionError as exc:
            failures += 1
            print(f"FAIL {name}: {exc}")
        except Exception as exc:
            failures += 1
            print(f"ERROR {name}: {exc}")
    print(f"\n{failures} failure(s)")
    raise SystemExit(1 if failures else 0)
