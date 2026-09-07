#!/usr/bin/env python3
"""Verify (proven) ledger rows: revert production hunks; cited test must fail."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import tempfile
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Callable

_AGENT_DIR = Path(__file__).resolve().parent
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from al_bug_ledger import DEFAULT_LEDGER_PATH, ProvenRow, collect_proven_rows

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REPORT_PATH = REPO_ROOT / "docs/library/AL_BUG_PROVEN_REVERT_AUDIT.md"

SHA_PATTERN = re.compile(r"\b([0-9a-f]{7,40})\b", re.IGNORECASE)
DATE_PATTERN = re.compile(r"\b(20\d{2}-\d{2}-\d{2})\b")
BACKTICK_TEST = re.compile(r"`([^`]+)`")
DOTNET_TEST_FILTER = re.compile(r"(?:Tests\.|\.Tests\.|Test\.)")
VITEST_FILE = re.compile(r"\.test\.(tsx?|jsx?)$", re.IGNORECASE)

TestRunner = Callable[[str, str, Path], tuple[bool, str]]
GitRunner = Callable[[list[str], Path], tuple[int, str]]


@dataclass(frozen=True)
class RowVerification:
    zone_id: str
    text: str
    classification: str
    test_name: str | None = None
    commit_sha: str | None = None
    detail: str | None = None


def extract_commit_sha(text: str) -> str | None:
    for match in SHA_PATTERN.finditer(text):
        candidate = match.group(1).lower()
        if len(candidate) >= 7:
            return candidate
    return None


def extract_row_date(text: str) -> datetime | None:
    match = DATE_PATTERN.search(text)
    if not match:
        return None
    try:
        return datetime.strptime(match.group(1), "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def extract_test_citation(text: str) -> str | None:
    for match in BACKTICK_TEST.finditer(text):
        token = match.group(1).strip()
        if not token:
            continue
        if DOTNET_TEST_FILTER.search(token) or VITEST_FILE.search(token):
            return token
        if "." in token and "Tests" in token:
            return token
        if VITEST_FILE.search(token):
            return token
    return None


def is_excluded_revert_path(path: str) -> bool:
    normalized = path.replace("\\", "/")
    lowered = normalized.lower()
    if "/tests/" in lowered or lowered.endswith("tests.cs") or "__tests__" in lowered:
        return True
    if lowered.endswith(".md") or lowered.endswith(".jsonl"):
        return True
    if "/docs/" in lowered:
        return True
    return False


def classify_after_test_run(test_failed: bool) -> str:
    return "guarded" if test_failed else "unguarded"


def default_git_runner(args: list[str], cwd: Path) -> tuple[int, str]:
    completed = subprocess.run(
        ["git", *args],
        cwd=cwd,
        capture_output=True,
        text=True,
        check=False,
    )
    output = (completed.stdout or "") + (completed.stderr or "")
    return completed.returncode, output.strip()


def default_test_runner(test_citation: str, _sha: str, repo_root: Path) -> tuple[bool, str]:
    if VITEST_FILE.search(test_citation):
        file_part = test_citation.split(":")[0] if ":" in test_citation else test_citation
        cmd = ["npm", "exec", "--", "vitest", "run", file_part]
        completed = subprocess.run(cmd, cwd=repo_root, capture_output=True, text=True, check=False)
        output = (completed.stdout or "") + (completed.stderr or "")
        return completed.returncode != 0, output.strip()

    filter_value = test_citation
    if not filter_value.startswith("FullyQualifiedName~"):
        filter_value = f"FullyQualifiedName~{test_citation}"
    cmd = [
        "dotnet",
        "test",
        "ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj",
        "--filter",
        filter_value,
        "--no-restore",
    ]
    completed = subprocess.run(cmd, cwd=repo_root, capture_output=True, text=True, check=False)
    output = (completed.stdout or "") + (completed.stderr or "")
    if completed.returncode not in (0, 1):
        return False, output.strip()
    failed = "Failed!" in output or "Test Run Failed" in output
    passed = completed.returncode == 0 and not failed
    return not passed, output.strip()


def list_production_paths_at_commit(
    sha: str,
    git_runner: GitRunner,
    repo_root: Path,
) -> list[str]:
    code, output = git_runner(["show", "--name-only", "--pretty=format:", sha], repo_root)
    if code != 0:
        return []
    paths: list[str] = []
    for line in output.splitlines():
        trimmed = line.strip()
        if not trimmed or is_excluded_revert_path(trimmed):
            continue
        paths.append(trimmed)
    return paths


def verify_row(
    row: ProvenRow,
    repo_root: Path,
    git_runner: GitRunner,
    test_runner: TestRunner,
) -> RowVerification:
    test_name = extract_test_citation(row.text)
    if test_name is None:
        return RowVerification(row.zone_id, row.text, "no-test-cited")

    sha = extract_commit_sha(row.text)
    if sha is None:
        return RowVerification(row.zone_id, row.text, "no-commit-cited", test_name=test_name)

    production_paths = list_production_paths_at_commit(sha, git_runner, repo_root)
    if not production_paths:
        return RowVerification(
            row.zone_id,
            row.text,
            "could-not-run",
            test_name=test_name,
            commit_sha=sha,
            detail="no production paths in commit",
        )

    worktree_dir = Path(tempfile.mkdtemp(prefix="al-bug-revert-"))
    try:
        code, output = git_runner(["worktree", "add", "--detach", str(worktree_dir), sha], repo_root)
        if code != 0:
            return RowVerification(
                row.zone_id,
                row.text,
                "could-not-run",
                test_name=test_name,
                commit_sha=sha,
                detail=output,
            )

        for rel_path in production_paths:
            parent_sha = f"{sha}^"
            code, _ = git_runner(["checkout", parent_sha, "--", rel_path], worktree_dir)
            if code != 0:
                return RowVerification(
                    row.zone_id,
                    row.text,
                    "could-not-run",
                    test_name=test_name,
                    commit_sha=sha,
                    detail=f"checkout failed for {rel_path}",
                )

        test_failed, detail = test_runner(test_name, sha, worktree_dir)
        classification = classify_after_test_run(test_failed)
        return RowVerification(
            row.zone_id,
            row.text,
            classification,
            test_name=test_name,
            commit_sha=sha,
            detail=detail[:500] if detail else None,
        )
    finally:
        git_runner(["worktree", "remove", "--force", str(worktree_dir)], repo_root)
        if worktree_dir.exists():
            shutil.rmtree(worktree_dir, ignore_errors=True)


def select_rows(
    rows: list[ProvenRow],
    zone: str | None,
    since: datetime,
    limit: int,
) -> list[ProvenRow]:
    selected: list[ProvenRow] = []
    for row in rows:
        if zone is not None and row.zone_id != zone:
            continue
        row_date = extract_row_date(row.text)
        if row_date is None or row_date < since:
            continue
        selected.append(row)
        if len(selected) >= limit:
            break
    return selected


def render_report(results: list[RowVerification]) -> str:
    counts = Counter(item.classification for item in results)
    lines = [
        "> **Scope:** Sample of recent `(proven)` rows with cited tests — not a claim that all proven rows are guarded.",
        "",
        "# `/al-bug` proven-row revert audit",
        "",
        f"**Rows sampled:** {len(results)}",
        "",
        "## Classification counts",
        "",
        "| Class | Count |",
        "| --- | ---: |",
    ]
    for key in (
        "guarded",
        "unguarded",
        "could-not-run",
        "no-test-cited",
        "no-commit-cited",
    ):
        lines.append(f"| {key} | {counts.get(key, 0)} |")

    unguarded = [item for item in results if item.classification == "unguarded"]
    if unguarded:
        lines.extend(["", "## Unguarded rows", ""])
        for item in unguarded:
            lines.append(
                f"- `{item.zone_id}` test `{item.test_name}` sha `{item.commit_sha}` — cited test still passes after production revert"
            )

    return "\n".join(lines)


DEFAULT_UNGUARDED_BASELINE = REPO_ROOT / "scripts/ci/al-bug-unguarded-proven-baseline.json"
DEFAULT_UNCHECKABLE_BASELINE = REPO_ROOT / "scripts/ci/al-bug-uncheckable-proven-baseline.json"
UNCHECKABLE_CLASSIFICATIONS = frozenset({"no-test-cited", "could-not-run"})


def unguarded_key(item: RowVerification) -> str:
    """Stable identity: zoneId|testName|shaPrefix (7 chars when present)."""
    sha = (item.commit_sha or "")[:7]
    test_name = item.test_name or ""
    return f"{item.zone_id}|{test_name}|{sha}"


def load_unguarded_baseline(path: Path) -> set[str]:
    if not path.is_file():
        return set()
    payload = json.loads(path.read_text(encoding="utf-8"))
    keys = payload.get("unguardedKeys", [])
    return {str(key) for key in keys}


def new_unguarded_keys(results: list[RowVerification], baseline: set[str]) -> list[str]:
    found: list[str] = []
    for item in results:
        if item.classification != "unguarded":
            continue
        key = unguarded_key(item)
        if key not in baseline:
            found.append(key)
    return found


def uncheckable_key(item: RowVerification) -> str:
    """Stable identity for no-test-cited / could-not-run rows in the sample window."""
    sha = (item.commit_sha or "")[:7]
    test_name = item.test_name or ""
    return f"{item.zone_id}|{item.classification}|{test_name}|{sha}"


def load_uncheckable_baseline(path: Path) -> set[str]:
    if not path.is_file():
        return set()
    payload = json.loads(path.read_text(encoding="utf-8"))
    keys = payload.get("uncheckableKeys", [])
    return {str(key) for key in keys}


def new_uncheckable_keys(results: list[RowVerification], baseline: set[str]) -> list[str]:
    found: list[str] = []
    for item in results:
        if item.classification not in UNCHECKABLE_CLASSIFICATIONS:
            continue
        key = uncheckable_key(item)
        if key not in baseline:
            found.append(key)
    return found


def write_uncheckable_baseline(
    path: Path,
    results: list[RowVerification],
    previous: set[str],
    *,
    allow_shrink: bool,
) -> set[str]:
    current = {
        uncheckable_key(item)
        for item in results
        if item.classification in UNCHECKABLE_CLASSIFICATIONS
    }
    merged = set(previous) | current
    if allow_shrink:
        still_uncheckable = current
        merged = still_uncheckable | {key for key in previous if key in still_uncheckable}
    payload = {
        "uncheckableKeys": sorted(merged),
        "_measuredDate": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "_comment": "ABQ-45: known no-test-cited / could-not-run keys in the verifier sample window.",
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return merged


def write_unguarded_baseline(
    path: Path,
    results: list[RowVerification],
    previous: set[str],
    *,
    allow_shrink: bool,
) -> set[str]:
    current_unguarded = {unguarded_key(item) for item in results if item.classification == "unguarded"}
    guarded_now = {unguarded_key(item) for item in results if item.classification == "guarded"}
    merged = set(previous) | current_unguarded
    if allow_shrink:
        merged -= guarded_now
    payload = {
        "unguardedKeys": sorted(merged),
        "_measuredDate": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "_comment": "ABQ-34: known unguarded proven-row keys in the verifier sample window. Add-only unless --allow-shrink.",
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return merged


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--zone", help="Optional ledger zone id filter")
    parser.add_argument("--since", help="YYYY-MM-DD (default: 14 days ago)")
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT_PATH)
    parser.add_argument("--ledger", type=Path, default=DEFAULT_LEDGER_PATH)
    parser.add_argument("--fail-on-unguarded", action="store_true")
    parser.add_argument(
        "--fail-on-new-unguarded",
        action="store_true",
        help="Exit 1 only when unguarded keys are not in --baseline (ABQ-34 ratchet).",
    )
    parser.add_argument("--baseline", type=Path, default=DEFAULT_UNGUARDED_BASELINE)
    parser.add_argument("--write-baseline", action="store_true")
    parser.add_argument(
        "--allow-shrink",
        action="store_true",
        help="With --write-baseline, drop keys that this run classified as guarded.",
    )
    parser.add_argument(
        "--fail-on-new-uncheckable",
        action="store_true",
        help="Exit 1 when no-test-cited / could-not-run keys are not in --uncheckable-baseline (ABQ-45).",
    )
    parser.add_argument("--uncheckable-baseline", type=Path, default=DEFAULT_UNCHECKABLE_BASELINE)
    parser.add_argument("--write-uncheckable-baseline", action="store_true")
    parser.add_argument("--dry-run-fixture", action="store_true", help="Use built-in fixture rows (tests).")
    args = parser.parse_args()

    if args.since:
        since = datetime.strptime(args.since, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    else:
        since = datetime.now(timezone.utc) - timedelta(days=14)

    if args.dry_run_fixture:
        rows = [
            ProvenRow("zone-a", "`FooTests.Bar` — fix abcdef1 2026-09-01"),
        ]
        selected = rows
    else:
        ledger_text = args.ledger.read_text(encoding="utf-8")
        rows = collect_proven_rows(ledger_text)
        selected = select_rows(rows, args.zone, since, args.limit)

    results = [
        verify_row(row, REPO_ROOT, default_git_runner, default_test_runner)
        for row in selected
    ]
    report = render_report(results)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(report + "\n", encoding="utf-8")
    print(report)

    if args.write_baseline:
        previous = load_unguarded_baseline(args.baseline)
        write_unguarded_baseline(
            args.baseline,
            results,
            previous,
            allow_shrink=args.allow_shrink,
        )

    if args.write_uncheckable_baseline:
        previous_uncheckable = load_uncheckable_baseline(args.uncheckable_baseline)
        write_uncheckable_baseline(
            args.uncheckable_baseline,
            results,
            previous_uncheckable,
            allow_shrink=args.allow_shrink,
        )

    if args.fail_on_unguarded and any(item.classification == "unguarded" for item in results):
        return 1

    if args.fail_on_new_unguarded:
        baseline = load_unguarded_baseline(args.baseline)
        fresh = new_unguarded_keys(results, baseline)
        if fresh:
            print("New unguarded proven rows (not in baseline):", file=sys.stderr)
            for key in fresh:
                print(key, file=sys.stderr)
            return 1

    if args.fail_on_new_uncheckable:
        baseline = load_uncheckable_baseline(args.uncheckable_baseline)
        fresh_uncheckable = new_uncheckable_keys(results, baseline)
        if fresh_uncheckable:
            print("New uncheckable proven rows (not in baseline):", file=sys.stderr)
            for key in fresh_uncheckable:
                print(key, file=sys.stderr)
            return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
