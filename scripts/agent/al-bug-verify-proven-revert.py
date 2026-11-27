#!/usr/bin/env python3
"""Sample proven ledger rows with an isolated green run and production-revert red run."""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Callable

_AGENT_DIR = Path(__file__).resolve().parent
if str(_AGENT_DIR) not in sys.path:
    sys.path.insert(0, str(_AGENT_DIR))

from al_bug_ledger import DEFAULT_LEDGER_PATH, ProvenRow, collect_proven_rows, load_ledger_text

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_REPORT_PATH = REPO_ROOT / "docs/library/AL_BUG_PROVEN_REVERT_AUDIT.md"

SHA_PATTERN = re.compile(r"\b([0-9a-f]{7,40})\b", re.IGNORECASE)
DATE_PATTERN = re.compile(r"\b(20\d{2}-\d{2}-\d{2})\b")
BACKTICK_TEST = re.compile(r"`([^`]+)`")
DOTNET_TEST_FILTER = re.compile(r"(?:Tests\.|\.Tests\.|Test\.)")
VITEST_FILE = re.compile(r"\.test\.(tsx?|jsx?)$", re.IGNORECASE)

EXPECTED_FAILURE = re.compile(r"\[expected-failure:\s*([^\]\r\n]+)\]")
TEST_TIMEOUT_SECONDS = 60
MAX_TRX_BYTES = 2 * 1024 * 1024


@dataclass(frozen=True)
class TestObservation:
    outcome: str
    identity: str | None = None
    failure_message: str | None = None
    detail: str | None = None


TestRunner = Callable[[str, str, Path], TestObservation]
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
    parts = lowered.split("/")
    if any(part in {"tests", "__tests__", "docs", ".github"} or part.endswith(".tests") for part in parts[:-1]):
        return True
    return lowered.endswith(("tests.cs", ".md", ".jsonl", ".runsettings")) or bool(VITEST_FILE.search(lowered))


def classify_after_test_run(green: TestObservation, red: TestObservation, expected_failure: str | None) -> str:
    if green.outcome != "passed" or not green.identity or green.identity != red.identity:
        return "could-not-run"
    if red.outcome == "passed":
        return "unguarded"
    if red.outcome == "failed" and expected_failure and expected_failure in (red.failure_message or ""):
        return "guarded"
    return "could-not-run"


def default_git_runner(args: list[str], cwd: Path) -> tuple[int, str]:
    try:
        completed = subprocess.run(
            ["git", *args], cwd=cwd, capture_output=True, text=True, check=False, timeout=45,
        )
    except (OSError, subprocess.TimeoutExpired):
        return 1, "git unavailable or timed out"
    output = (completed.stdout or "") + (completed.stderr or "")
    return completed.returncode, output.strip()


def read_trx(path: Path, citation: str, status: int) -> TestObservation:
    uncheckable = TestObservation("uncheckable", detail="no matching executed result with a consistent exit status")
    try:
        if path.stat().st_size > MAX_TRX_BYTES:
            return uncheckable
        root = ET.parse(path).getroot()
    except FileNotFoundError:
        return TestObservation("not-run", detail="no test result was produced")
    except (OSError, ET.ParseError, ValueError):
        return uncheckable

    if root.tag.rsplit("}", 1)[-1] != "TestRun":
        return uncheckable
    results = root.findall(".//{*}UnitTestResult")
    if not results or all(result.get("outcome") in {"NotExecuted", "Skipped"} for result in results):
        return TestObservation("not-run", detail="no tests executed")
    if len(results) != 1 or not results[0].get("testId"):
        return uncheckable
    counters = root.findall("./{*}ResultSummary/{*}Counters")
    if len(counters) != 1 or counters[0].get("total") != "1" or counters[0].get("executed") != "1":
        return uncheckable
    result = results[0]
    methods = [
        method for definition in root.findall(".//{*}UnitTest")
        if definition.get("id") == result.get("testId")
        for method in definition.findall("./{*}TestMethod")
    ]
    if len(methods) != 1 or not all(methods[0].get(key) for key in ("className", "name")):
        return uncheckable
    identity = f"{methods[0].get('className')}.{methods[0].get('name')}"
    if identity != citation and not identity.endswith("." + citation):
        return uncheckable
    if status == 0 and result.get("outcome") == "Passed" and counters[0].get("passed") == "1":
        return TestObservation("passed", identity)
    message = result.findtext("./{*}Output/{*}ErrorInfo/{*}Message")
    if status == 1 and result.get("outcome") == "Failed" and counters[0].get("failed") == "1" and message and message.strip():
        return TestObservation("failed", identity, message)
    return uncheckable


def default_test_runner(test_citation: str, _sha: str, repo_root: Path) -> TestObservation:
    if VITEST_FILE.search(test_citation):
        return TestObservation("uncheckable", detail="Vitest file citation does not identify one executed assertion")
    citation = test_citation.removeprefix("FullyQualifiedName~")
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_.]*", citation):
        return TestObservation("uncheckable", detail="unsupported .NET test citation")
    project = "ArchLucid.Core.Tests/ArchLucid.Core.Tests.csproj"
    if not (repo_root / project).is_file():
        return TestObservation("uncheckable", detail="supported Core test project is unavailable")
    with tempfile.TemporaryDirectory(prefix="al-bug-trx-") as directory:
        cmd = [
            "dotnet", "test", project, "--filter", f"FullyQualifiedName~{citation}",
            "--results-directory", directory, "--logger", "trx;LogFileName=case.trx",
        ]
        try:
            with subprocess.Popen(cmd, cwd=repo_root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                  start_new_session=os.name == "posix") as child:
                try:
                    status = child.wait(timeout=TEST_TIMEOUT_SECONDS)
                except subprocess.TimeoutExpired:
                    if os.name == "posix":
                        try:
                            os.killpg(child.pid, signal.SIGKILL)
                        except ProcessLookupError:
                            pass
                    else:
                        child.kill()
                    return TestObservation("uncheckable", detail="test command timed out")
        except OSError:
            return TestObservation("uncheckable", detail="test command unavailable")
        return read_trx(Path(directory) / "case.trx", citation, status)


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

    def result(classification: str, detail: str) -> RowVerification:
        return RowVerification(row.zone_id, row.text, classification, test_name, sha, detail)

    production_paths = list_production_paths_at_commit(sha, git_runner, repo_root)
    if not production_paths:
        return result("could-not-run", "no production paths in commit")

    worktree_dir = Path(tempfile.mkdtemp(prefix="al-bug-revert-"))
    try:
        code, _ = git_runner(["worktree", "add", "--detach", str(worktree_dir), sha], repo_root)
        if code != 0:
            return result("could-not-run", "temporary worktree could not be created")

        green = test_runner(test_name, sha, worktree_dir)
        if green.outcome != "passed":
            return result("could-not-run", green.detail or "corrected revision had no verified passing test")
        code, _ = git_runner(
            ["--literal-pathspecs", "restore", f"--source={sha}^", "--staged", "--worktree", "--", *production_paths],
            worktree_dir,
        )
        if code != 0:
            return result("could-not-run", "production paths could not be restored in the isolated worktree")

        red = test_runner(test_name, sha, worktree_dir)
        match = EXPECTED_FAILURE.search(row.text)
        expectation = match.group(1).strip() if match else None
        classification = classify_after_test_run(green, red, expectation)
        if classification == "guarded":
            return result(classification, "same test passed on the fix and failed for the expected reason after revert")
        if classification == "unguarded":
            return result(classification, "same test passed before and after the production revert")
        return result(classification, red.detail or "revert did not demonstrate the expected failure of the same test")
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
    if limit <= 0:
        return selected
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


def render_report(
    results: list[RowVerification],
    eligible_count: int | None = None,
    citing_test_and_commit: int | None = None,
) -> str:
    counts = Counter(item.classification for item in results)
    lines = [
        "> **Scope:** Sample of recent `(proven)` rows with cited tests — not a claim that all proven rows are guarded.",
        "",
        "# `/al-bug` proven-row revert audit",
        "",
        f"**Rows sampled:** {len(results)}",
    ]
    if eligible_count is not None:
        lines.append(f"**Rows in selection window:** {eligible_count}")
    if citing_test_and_commit is not None:
        lines.append(f"**Rows in selection window citing a test and commit:** {citing_test_and_commit}")
    lines.extend([
        "",
        "## Classification counts",
        "",
        "| Class | Count |",
        "| --- | ---: |",
    ])
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

    uncheckable = [item for item in results if item.classification in UNCHECKABLE_CLASSIFICATIONS]
    if uncheckable:
        lines.extend(["", "## Uncheckable rows", ""])
        for item in uncheckable:
            lines.append(f"- `{item.zone_id}` — {item.detail or item.classification}")

    return "\n".join(lines)


DEFAULT_UNGUARDED_BASELINE = REPO_ROOT / "scripts/ci/al-bug-unguarded-proven-baseline.json"
DEFAULT_UNCHECKABLE_BASELINE = REPO_ROOT / "scripts/ci/al-bug-uncheckable-proven-baseline.json"
UNCHECKABLE_CLASSIFICATIONS = frozenset({"no-test-cited", "no-commit-cited", "could-not-run"})


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
    """Stable identity for no-test-cited / no-commit-cited / could-not-run rows in the sample window."""
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
        "_comment": "ABQ-45: known no-test-cited / no-commit-cited / could-not-run keys in the verifier sample window.",
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
        help="Exit 1 when no-test-cited / no-commit-cited / could-not-run keys are not in --uncheckable-baseline (ABQ-45).",
    )
    parser.add_argument("--uncheckable-baseline", type=Path, default=DEFAULT_UNCHECKABLE_BASELINE)
    parser.add_argument("--write-uncheckable-baseline", action="store_true")
    parser.add_argument("--dry-run-fixture", action="store_true", help="Use built-in fixture rows (tests).")
    args = parser.parse_args()
    if args.limit < 1:
        parser.error("--limit must be positive")

    if args.since:
        since = datetime.strptime(args.since, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    else:
        since = datetime.now(timezone.utc) - timedelta(days=14)

    if args.dry_run_fixture:
        rows = [
            ProvenRow("zone-a", "`FooTests.Bar` — fix abcdef1 2026-09-01"),
        ]
        eligible = rows
    else:
        ledger_text = load_ledger_text(args.ledger)
        rows = collect_proven_rows(ledger_text)
        eligible = select_rows(rows, args.zone, since, len(rows))

    results = [
        verify_row(row, REPO_ROOT, default_git_runner, default_test_runner)
        for row in eligible[:args.limit]
    ]
    cited = sum(bool(extract_test_citation(row.text) and extract_commit_sha(row.text)) for row in eligible)
    report = render_report(results, len(eligible), cited)
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
