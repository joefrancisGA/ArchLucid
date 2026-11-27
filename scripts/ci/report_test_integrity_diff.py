#!/usr/bin/env python3
"""FND-165 pilot. Report test-integrity signals without judging or blocking a PR."""

from __future__ import annotations

import argparse
import ast
from collections import Counter
from dataclasses import dataclass
from difflib import SequenceMatcher
import json
from pathlib import Path, PurePosixPath
import re
import subprocess
import time

from git_diff_paths import git_diff_paired_paths, repo_root

SHA = re.compile(r"[0-9a-f]{40}")
LIMIT_FILES = 80
LIMIT_BYTES = 256 * 1024
LIMIT_CONFIG_LINES = 4000
LIMIT_FINDINGS = 100
LIMIT_SECONDS = 75
CONFIG_NAMES = {"pytest.ini", "pyproject.toml", "setup.cfg", "tox.ini"}
PYTEST_SETTINGS = re.compile(r"^\s*(testpaths|python_files|python_classes|python_functions|addopts|norecursedirs)\s*=")
WORKFLOW_FILTER = re.compile(r"(?:\s|^)--filter(?:=|\s|$)|\b(?:pytest|py\.test)\b[^#]*\s-[km](?:=|\s|$)")
OTHER_TEST = re.compile(r"(?:^|/)(?:tests?|__tests__|[^/]+\.Tests)(?:/|$)|\.(?:test|spec)\.[cm]?[jt]sx?$", re.I)
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
    if int(git(repo, "cat-file", "-s", oid)) > LIMIT_BYTES:
        raise ValueError("file exceeds the scan size budget")
    return git(repo, "cat-file", "blob", oid).decode("utf-8")


def path_kind(path: str | None) -> str | None:
    if path is None:
        return None
    name = PurePosixPath(path).name
    if name.endswith(".py") and (name.startswith("test_") or name.endswith("_test.py")):
        return "python-test"
    if name in CONFIG_NAMES:
        return "pytest-config"
    if path.startswith(".github/workflows/") and name.endswith((".yaml", ".yml")):
        return "workflow"
    if name == "conftest.py" or name.endswith(".runsettings") or OTHER_TEST.search(path):
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
                        called = name_of(part.func)
                        sig = Signal(ast.dump(part), part.lineno)
                        if called in SKIPS:
                            skips.append(sig)
                        elif called in PYTEST_ASSERTIONS or re.fullmatch(r"self\.assert[A-Z]\w*", called):
                            assertions.append(sig)
                    elif id(part) in decorators and name_of(part) in SKIPS:
                        skips.append(Signal(ast.dump(part), part.lineno))
                key = prefix + node.name
                if key in cases:
                    raise ValueError("duplicate Python test identity")
                fingerprint = f"{prefix}|{type(node).__name__}|" + ast.dump(ast.Tuple(
                    elts=[node.args, *node.decorator_list, *node.body], ctx=ast.Load(),
                ))
                cases[key] = Case(assertions, skips, node.lineno, fingerprint)

    visit(ast.parse(text).body)
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
            base_line: int | None = None, head_line: int | None = None, test: str | None = None) -> dict:
    return {"signal": code, "base_path": old_path, "head_path": new_path,
            "base_line": base_line, "head_line": head_line, "test": test}


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
                                   base_line=case.line, test=name))
            continue
        current = after[name]
        removed = difference(case.assertions, current.assertions)
        added = difference(current.assertions, case.assertions)
        for index, signal in enumerate(removed):
            replacement = added[index].line if index < len(added) else None
            results.append(finding("python-assertion-changed" if replacement is not None else "python-assertion-removed",
                                   old_path, new_path, base_line=signal.line, head_line=replacement, test=name))
    for name, case in after.items():
        if name not in before and case.fingerprint in renamed:
            continue
        previous = before[name].skips if name in before else []
        for signal in difference(case.skips, previous):
            results.append(finding("python-skip-or-xfail-added-or-changed", old_path, new_path,
                                   head_line=signal.line, test=name))
    return results


def scan_selection(old: str, new: str, kind: str, old_path: str | None, new_path: str | None) -> list[dict]:
    rule = PYTEST_SETTINGS if kind == "pytest-config" else WORKFLOW_FILTER
    before, after = [line.strip() for line in old.splitlines()], [line.strip() for line in new.splitlines()]
    if max(len(before), len(after)) > LIMIT_CONFIG_LINES:
        raise ValueError("configuration exceeds the line budget")
    results = []
    for tag, i, j, k, m in SequenceMatcher(a=before, b=after, autojunk=True).get_opcodes():
        if tag == "equal":
            continue
        old_lines = [n + 1 for n in range(i, j) if not before[n].lstrip().startswith("#") and rule.search(before[n])]
        new_lines = [n + 1 for n in range(k, m) if not after[n].lstrip().startswith("#") and rule.search(after[n])]
        for index in range(max(len(old_lines), len(new_lines))):
            results.append(finding("test-selection-or-discovery-changed", old_path, new_path,
                                   base_line=old_lines[index] if index < len(old_lines) else None,
                                   head_line=new_lines[index] if index < len(new_lines) else None))
    return results


def report(repo: Path, base: str, head: str) -> dict:
    result = {"schema_version": 1, "mode": "report-only", "requested_base": base, "head": head,
              "merge_base": None, "status": "incomplete", "files_scanned": 0, "unsupported_files": 0,
              "scanned_paths": [], "unsupported_examples": [], "unscanned_files": [],
              "finding_count": 0, "findings": [],
              "findings_truncated": False, "reason": None}
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

    seen = 0
    live = time.monotonic()
    for old_path, new_path in pairs:
        old_kind, new_kind = path_kind(old_path), path_kind(new_path)
        if old_kind is None and new_kind is None:
            continue
        kind = new_kind or old_kind
        left_discovery = old_kind == "python-test" and new_path and new_kind != "python-test"
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
            old = text_at(repo, commit, old_path)
            if left_discovery:
                first_case = min((case.line for case in python_cases(old).values()), default=1)
                signals = [finding("python-test-file-left-supported-discovery", old_path, new_path,
                                   base_line=first_case)]
            else:
                new = text_at(repo, head, new_path)
                signals = (scan_python(old, new, old_path, new_path) if kind == "python-test"
                           else scan_selection(old, new, kind, old_path, new_path))
        except (OSError, ValueError, SyntaxError, RecursionError, subprocess.TimeoutExpired):
            result["unscanned_files"].append(path)
            continue
        result["files_scanned"] += 1
        result["scanned_paths"].append(path)
        result["finding_count"] += len(signals)
        result["findings"].extend(signals[:max(0, LIMIT_FINDINGS - len(result["findings"]))])
    if result["reason"] or result["unscanned_files"] or result["unsupported_files"]:
        result["status"] = "partial"
    elif not result["files_scanned"]:
        result["status"] = "no-supported-changes"
    else:
        result["status"] = "complete-for-pilot-scope"
    result["findings_truncated"] = result["finding_count"] > len(result["findings"])
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
