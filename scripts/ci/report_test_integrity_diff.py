#!/usr/bin/env python3
"""FND-165 advisory review. Report test-integrity signals without judging or blocking a PR."""

from __future__ import annotations

import argparse
import ast
from collections import Counter, defaultdict, deque
from dataclasses import dataclass, replace
from datetime import date, datetime, timezone
from difflib import SequenceMatcher
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import time

from git_diff_paths import git_diff_paired_paths, repo_root
from test_integrity_patterns import (
    Anchor, CONFIG_CONTROL, CONFIG_PATH, GOLDEN_PATH, JS_SOURCE, JS_TEST,
    RUNNER_FILTER, SUPPRESSION, TEST_PATH, exact_renames, lost, token_anchors,
)
from test_integrity_review import REVIEW_PATH, disposition_index, register_findings

SHA = re.compile(r"[0-9a-f]{40}")
LIMIT_FILES = 80
LIMIT_BYTES = 256 * 1024
LIMIT_CONFIG_LINES = 9000
LIMIT_WORKFLOW_BYTES = 512 * 1024
LIMIT_FINDINGS = 100
LIMIT_SECONDS = 75
CONFIG_NAMES = {"pytest.ini", "pyproject.toml", "setup.cfg", "tox.ini"}
PYTEST_SETTINGS = re.compile(r"^\s*(testpaths|python_files|python_classes|python_functions|addopts|norecursedirs)\s*=")
WORKFLOW_FILTER = re.compile(r"(?:\s|^)--filter(?:=|\s|$)|\b(?:pytest|py\.test)\b[^#]*\s-[km](?:=|\s|$)")
SKIPS = {
    "pytest.mark.skip", "pytest.mark.skipif", "pytest.mark.xfail", "pytest.skip", "pytest.xfail",
    "unittest.skip", "unittest.skipIf", "unittest.skipUnless", "unittest.expectedFailure", "self.skipTest",
}
PYTEST_ASSERTIONS = {"pytest.raises", "pytest.warns", "pytest.fail"}


def git(repo: Path, *args: str) -> bytes:
    result = subprocess.run(["git", *args], cwd=repo, check=False, capture_output=True, timeout=20)
    if result.returncode:
        raise ValueError("Git objects or comparison history are unavailable")
    return result.stdout


def text_at(repo: Path, revision: str, path: str | None) -> str:
    if path is None:
        return ""
    oid = f"{revision}:{path}"
    cap = LIMIT_WORKFLOW_BYTES if path_kind(path) == "workflow" else LIMIT_BYTES
    if int(git(repo, "cat-file", "-s", oid)) > cap:
        raise ValueError("file exceeds the scan size budget")
    return git(repo, "cat-file", "blob", oid).decode("utf-8")


def path_kind(path: str | None) -> str | None:
    if path is None:
        return None
    name = PurePosixPath(path).name
    if path == REVIEW_PATH:
        return "dispositions"
    if GOLDEN_PATH.search(path) and not JS_SOURCE.search(name) and not name.endswith((".cs", ".py")):
        return "snapshot"
    if name.endswith(".py") and (name.startswith("test_") or name.endswith("_test.py") or
                                  name == "conftest.py" or TEST_PATH.search(path)):
        return "python-test"
    if name in CONFIG_NAMES:
        return "pytest-config"
    if path.startswith(".github/workflows/") and name.endswith((".yaml", ".yml")):
        return "workflow"
    if CONFIG_PATH.search(path):
        return "runner-config"
    if name.endswith(".cs") and TEST_PATH.search(path):
        return "dotnet-test"
    if JS_TEST.search(name) or (JS_SOURCE.search(name) and TEST_PATH.search(path)):
        return "js-test"
    if TEST_PATH.search(path):
        return "unsupported"
    return None


def name_of(node: ast.AST) -> str:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return f"{name_of(node.value)}.{node.attr}"
    return ""


@dataclass(frozen=True)
class Signal:
    key: str
    line: int


@dataclass(frozen=True)
class Case:
    assertions: list[Signal]
    skips: list[Signal]
    line: int
    fingerprint: str


def walk_body(nodes: list[ast.AST]):
    for node in nodes:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Lambda)):
            continue
        yield node
        yield from walk_body(list(ast.iter_child_nodes(node)))


def python_cases(text: str) -> dict[str, Case]:
    cases = {}
    aliases = {}
    tree = ast.parse(text)
    all_imports = [node for node in tree.body if isinstance(node, (ast.Import, ast.ImportFrom))]
    for node in all_imports:
        if isinstance(node, ast.ImportFrom) and node.module in {"pytest", "unittest", "unittest.mock"}:
            for alias in node.names:
                aliases[alias.asname or alias.name] = f"{node.module}.{alias.name}"
        elif isinstance(node, ast.Import):
            for alias in node.names:
                if alias.asname:
                    aliases[alias.asname] = alias.name

    def resolve(value):
        root, dot, rest = name_of(value).partition(".")
        return aliases.get(root, root) + dot + rest

    def visit(nodes: list[ast.stmt], prefix: str = "") -> None:
        for node in nodes:
            if isinstance(node, ast.ClassDef):
                visit(node.body, prefix + node.name + ".")
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name.startswith("test"):
                assertions, skips = [], []
                # Direct decorators and calls only, not lookalike text or helper bodies.
                decorators = {id(item) for item in node.decorator_list}
                for part in walk_body(node.body + node.decorator_list):
                    if isinstance(part, ast.Assert):
                        assertions.append(Signal(ast.dump(part.test), part.lineno))
                    elif isinstance(part, ast.Call):
                        called = resolve(part.func)
                        sig = Signal(ast.dump(part), part.lineno)
                        if called in SKIPS:
                            skips.append(sig)
                        elif called in PYTEST_ASSERTIONS or re.fullmatch(r"self\.assert[A-Z]\w*", called):
                            assertions.append(sig)
                    elif id(part) in decorators and resolve(part) in SKIPS:
                        skips.append(Signal(ast.dump(part), part.lineno))
                key = prefix + node.name
                if key in cases:
                    raise ValueError("duplicate Python test identity")
                fingerprint = f"{prefix}|{type(node).__name__}|" + ast.dump(ast.Tuple(
                    elts=[node.args, *node.decorator_list, *node.body], ctx=ast.Load(),
                ))
                cases[key] = Case(assertions, skips, node.lineno, fingerprint)

    visit(tree.body)
    return cases


def difference(old: list[Signal], new: list[Signal]) -> list[Signal]:
    retained = Counter(signal.key for signal in new)
    lost = []
    for signal in old:
        if retained[signal.key]:
            retained[signal.key] -= 1
        else:
            lost.append(signal)
    return lost


def finding(code: str, old_path: str | None, new_path: str | None, *,
            base_line: int | None = None, head_line: int | None = None, test: str | None = None,
            evidence: str = "") -> dict:
    return {"signal": code, "base_path": old_path, "head_path": new_path,
            "base_line": base_line, "head_line": head_line, "test": test, "_evidence": evidence}


def scan_python(old: str, new: str, old_path: str | None, new_path: str | None) -> list[dict]:
    before, after = python_cases(old), python_cases(new)
    results = []
    removed_counts = Counter(case.fingerprint for name, case in before.items() if name not in after)
    added_counts = Counter(case.fingerprint for name, case in after.items() if name not in before)
    renamed = {key for key, count in removed_counts.items() if count == 1 and added_counts[key] == 1}
    for name, case in before.items():
        if name not in after:
            if case.fingerprint in renamed:
                continue
            results.append(finding("python-test-removed-or-renamed", old_path, new_path,
                                   base_line=case.line, test=name, evidence=case.fingerprint))
            continue
        current = after[name]
        removed = difference(case.assertions, current.assertions)
        added = difference(current.assertions, case.assertions)
        for index, signal in enumerate(removed):
            replacement = added[index].line if index < len(added) else None
            results.append(finding("python-assertion-changed" if replacement is not None else "python-assertion-removed",
                                   old_path, new_path, base_line=signal.line, head_line=replacement, test=name,
                                   evidence=signal.key + (added[index].key if replacement else "")))
    for name, case in after.items():
        if name not in before and case.fingerprint in renamed:
            continue
        previous = before[name].skips if name in before else []
        for signal in difference(case.skips, previous):
            results.append(finding("python-skip-or-xfail-added-or-changed", old_path, new_path,
                                   head_line=signal.line, test=name, evidence=signal.key))
    current_by_fingerprint = {case.fingerprint: name for name, case in after.items() if name not in before}
    python_renames = {name: current_by_fingerprint[case.fingerprint]
                      for name, case in before.items() if name not in after and case.fingerprint in renamed}
    previous = [replace(item, test=python_renames.get(item.test, item.test))
                for item in python_additional(old) if item.test not in before or
                item.test in after or item.test in python_renames]
    return results + scan_anchors(previous, python_additional(new), old_path, new_path)


def python_additional(text: str) -> list[Anchor]:
    anchors = []

    class Visitor(ast.NodeVisitor):
        scope = None
        class_prefix = ""

        def visit_ClassDef(self, node):
            previous = self.class_prefix
            self.class_prefix += node.name + "."
            self.generic_visit(node)
            self.class_prefix = previous

        def visit_FunctionDef(self, node):
            previous, self.scope = self.scope, self.class_prefix + node.name
            for decorator in node.decorator_list:
                target = decorator.func if isinstance(decorator, ast.Call) else decorator
                if name_of(target) in {"fixture", "pytest.fixture"}:
                    anchors.append(Anchor("fixture-body", ast.dump(node), node.lineno, self.scope))
                    break
            self.generic_visit(node)
            self.scope = previous

        visit_AsyncFunctionDef = visit_FunctionDef

        def visit_Call(self, node):
            name = name_of(node.func)
            if (name.startswith(("mock.", "unittest.mock.", "monkeypatch.", "mocker."))
                    or name.split(".")[-1] in {"Mock", "MagicMock", "patch", "patch_object", "patch_dict", "AsyncMock"}):
                anchors.append(Anchor("mock-setup", ast.dump(node), node.lineno, self.scope))
            if name in {"pytest.approx", "approx", "math.isclose", "self.assertAlmostEqual"}:
                anchors.append(Anchor("tolerance", ast.dump(node), node.lineno, self.scope))
            if name in {"pytest.raises", "raises", "pytest.fail", "self.assertRaises", "self.assertFalse"}:
                anchors.append(Anchor("negative-control", ast.dump(node), node.lineno, self.scope))
            self.generic_visit(node)

        def visit_Assign(self, node):
            if self.scope and any(isinstance(target, ast.Name) and
                                  target.id.lower().startswith(("expected", "tolerance"))
                                  for target in node.targets):
                anchors.append(Anchor("expected-outcome", ast.dump(node), node.lineno, self.scope))
            self.generic_visit(node)

        def visit_If(self, node):
            def count_assertions(body):
                return sum(isinstance(item, ast.Assert) or
                           isinstance(item, ast.Call) and name_of(item.func).split(".")[-1].startswith("assert")
                           for item in walk_body(body))
            yes, no = count_assertions(node.body), count_assertions(node.orelse)
            if self.scope and (yes or no):
                fingerprint = ast.dump(ast.Tuple(elts=[node.test,
                                       ast.Constant(bool(yes)), ast.Constant(bool(no))], ctx=ast.Load()))
                anchors.append(Anchor("assertion-branch-guard", fingerprint, node.lineno, self.scope))
            self.generic_visit(node)

    Visitor().visit(ast.parse(text))
    return anchors


def scan_anchors(before: list[Anchor], after: list[Anchor], old_path: str | None, new_path: str | None) -> list[dict]:
    results = []
    renamed = exact_renames(before, after)
    normalized = [replace(item, test=renamed.get(item.test, item.test)) for item in before]
    added = lost(after, normalized)
    replacement_queues = defaultdict(deque)
    for index, item in enumerate(added):
        replacement_queues[item.family, item.test].append(index)
    paired = set()
    removed = lost(normalized, after)
    removed_tests = {item.test for item in removed if item.family == "test-declaration"}
    for old in removed:
        if old.test in removed_tests and old.family != "test-declaration":
            continue
        if old.family in {"skip-or-exclusive", "mock-setup"}:
            continue
        queue = replacement_queues[old.family, old.test]
        replacement = None
        if queue:
            index = queue.popleft()
            paired.add(index)
            replacement = added[index]
        results.append(finding(old.family + ("-changed" if replacement else "-removed"),
                               old_path, new_path, base_line=old.line,
                               head_line=replacement.line if replacement else None, test=old.test,
                               evidence=json.dumps([old.key, replacement.key if replacement else None])))
    for index, current in enumerate(added):
        if index not in paired and current.family in {"skip-or-exclusive", "mock-setup", "assertion-branch-guard"}:
            results.append(finding(current.family + "-added-or-changed", old_path, new_path,
                                   head_line=current.line, test=current.test, evidence=current.key))
    return results


def scan_selection(old: str, new: str, kind: str, old_path: str | None, new_path: str | None) -> list[dict]:
    rules = {
        "pytest-config": [PYTEST_SETTINGS, CONFIG_CONTROL],
        "workflow": [WORKFLOW_FILTER, RUNNER_FILTER, CONFIG_CONTROL],
        "runner-config": [CONFIG_CONTROL, RUNNER_FILTER, SUPPRESSION],
        "suppression": [SUPPRESSION],
    }[kind]
    before, after = [line.strip() for line in old.splitlines()], [line.strip() for line in new.splitlines()]
    if max(len(before), len(after)) > LIMIT_CONFIG_LINES:
        raise ValueError("configuration exceeds the line budget")
    results = []
    for tag, i, j, k, m in SequenceMatcher(a=before, b=after, autojunk=True).get_opcodes():
        if tag == "equal":
            continue
        old_lines = [n + 1 for n in range(i, j) if any(rule.search(before[n]) for rule in rules) and not before[n].startswith(("# ", "//", "<!--"))]
        new_lines = [n + 1 for n in range(k, m) if any(rule.search(after[n]) for rule in rules) and not after[n].startswith(("# ", "//", "<!--"))]
        for index in range(max(len(old_lines), len(new_lines))):
            base_line = old_lines[index] if index < len(old_lines) else None
            head_line = new_lines[index] if index < len(new_lines) else None
            evidence = (before[base_line - 1] if base_line else "") + (after[head_line - 1] if head_line else "")
            results.append(finding("suppression-changed" if kind == "suppression" else "test-selection-or-discovery-changed",
                                   old_path, new_path, base_line=base_line, head_line=head_line, evidence=evidence))
    return results


def report(repo: Path, base: str, head: str, today: date | None = None) -> dict:
    result = {"schema_version": 2, "mode": "report-only", "requested_base": base, "head": head,
              "merge_base": None, "status": "incomplete", "files_scanned": 0, "unsupported_files": 0, "scope": "recognized-patterns-only",
              "scanned_paths": [], "unsupported_examples": [], "unscanned_files": [],
              "finding_count": 0, "findings": [],
              "findings_truncated": False, "reason": None,
              "review_errors": [], "review_counts": {}, "limits": {"files": LIMIT_FILES, "file_bytes": LIMIT_BYTES,
              "config_lines": LIMIT_CONFIG_LINES, "workflow_bytes": LIMIT_WORKFLOW_BYTES,
              "findings": LIMIT_FINDINGS, "seconds": LIMIT_SECONDS}}
    try:
        if not SHA.fullmatch(base) or not SHA.fullmatch(head):
            raise ValueError("expected full pinned PR base and head SHAs")
        commit = git(repo, "merge-base", base, head).decode("ascii").strip()
        if not SHA.fullmatch(commit):
            raise ValueError("comparison merge base is invalid")
        result["merge_base"] = commit
        pairs = git_diff_paired_paths(repo, commit, head)
    except (OSError, ValueError, RuntimeError, StopIteration, subprocess.TimeoutExpired):
        result["reason"] = "Git comparison unavailable or invalid"
        return result

    today = today or datetime.now(timezone.utc).date()
    indexes = []
    for revision, side in ((commit, "base"), (head, "head")):
        try:
            exists = git(repo, "ls-tree", revision, "--", REVIEW_PATH)
            indexes.append(disposition_index(text_at(repo, revision, REVIEW_PATH), today) if exists else {})
        except (OSError, ValueError, subprocess.TimeoutExpired):
            result["review_errors"].append(f"{side} dispositions could not be loaded or validated")
            indexes.append({})
    before, pending = indexes
    for key, row in before.items():
        if row["decision"] == "historical-debt" and pending.get(key) != row:
            result["review_errors"].append(f"historical debt record changed or removed: {key}")
    for key, row in pending.items():
        if row["decision"] == "historical-debt" and key not in before:
            result["review_errors"].append(f"new historical debt claim requires owner review: {key}")
    counts = Counter()
    tally = Counter()
    seen = 0
    live = time.monotonic()
    for old_path, new_path in pairs:
        old_kind, new_kind = path_kind(old_path), path_kind(new_path)
        if old_kind is None and new_kind is None:
            continue
        kind = new_kind or old_kind
        if kind == "dispositions":
            continue
        discovery = {"python-test", "dotnet-test", "js-test"}
        left_discovery = old_kind in discovery and new_path and new_kind != old_kind
        if not left_discovery and (kind == "unsupported" or (old_kind and new_kind and old_kind != new_kind)):
            result["unsupported_files"] += 1
            if len(result["unsupported_examples"]) < 12:
                result["unsupported_examples"].append(new_path or old_path)
            continue
        path = new_path or old_path
        seen += 1
        if seen > LIMIT_FILES or time.monotonic() - live > LIMIT_SECONDS:
            result["reason"] = "scan budget exhausted"
            break
        try:
            if kind == "snapshot" and not left_discovery:
                signals = [finding("snapshot-or-golden-changed", old_path, new_path,
                                   evidence=json.dumps([
                                       git(repo, "ls-tree", rev, "--", f":(literal){path}").decode("utf-8", "replace")
                                       if path else None for rev, path in ((commit, old_path), (head, new_path))]))]
            else:
                old = text_at(repo, commit, old_path)
                if left_discovery:
                    first_case = (min((case.line for case in python_cases(old).values()), default=1)
                                  if old_kind == "python-test" else 1)
                    signals = [finding(old_kind + "-file-left-supported-discovery", old_path, new_path,
                                       base_line=first_case, evidence=new_path)]
                else:
                    new = text_at(repo, head, new_path)
                    if kind == "python-test":
                        signals = scan_python(old, new, old_path, new_path)
                    elif kind in {"dotnet-test", "js-test"}:
                        signals = scan_anchors(token_anchors(old, kind), token_anchors(new, kind), old_path, new_path)
                    else:
                        signals = scan_selection(old, new, kind, old_path, new_path)
                    if kind in discovery and (SUPPRESSION.search(old) or SUPPRESSION.search(new)):
                        signals.extend(scan_selection(old, new, "suppression", old_path, new_path))
        except (OSError, ValueError, SyntaxError, RecursionError, subprocess.TimeoutExpired):
            result["unscanned_files"].append(path)
            continue
        result["files_scanned"] += 1
        result["scanned_paths"].append(path)
        register_findings(signals, before, pending, counts)
        tally.update(signal["review_status"] for signal in signals)
        result["finding_count"] += len(signals)
        result["findings"].extend(signals[:max(0, LIMIT_FINDINGS - len(result["findings"]))])
    result["review_counts"] = dict(sorted(tally.items()))
    result["findings_truncated"] = result["finding_count"] > len(result["findings"])
    if (result["reason"] or result["unscanned_files"] or result["unsupported_files"] or
            result["review_errors"] or result["findings_truncated"]):
        result["status"] = "partial"
    elif not result["files_scanned"]:
        result["status"] = "no-supported-changes"
    else:
        result["status"] = "complete-for-supported-scope"
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo-root", type=Path, default=repo_root())
    parser.add_argument("--base", required=True)
    parser.add_argument("--head", required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    payload = report(args.repo_root, args.base, args.head)
    rendered = json.dumps(payload, indent=2) + "\n"
    if args.output:
        args.output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    print(f"Test integrity ({payload['status']}): {payload['finding_count']} review signals")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
