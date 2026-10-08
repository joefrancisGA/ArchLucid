#!/usr/bin/env python3
"""Push-corset unittest discover targets must be unittest.TestCase modules.

The beta-readiness job runs ``python3 -m unittest discover -p <file>``. Bare
pytest ``def test_*`` functions are invisible to that runner, which exits 5
with ``NO TESTS RAN`` and reds the trunk gate.
"""

from __future__ import annotations

import argparse
import ast
import re
import sys
from pathlib import Path

_PUSH_REL = ".github/workflows/ui-typecheck-on-push.yml"
_CHECK_REL = "scripts/ci/check_beta_readiness_unittest_discover.py"
_TEST_REL = "scripts/ci/tests/test_check_beta_readiness_unittest_discover.py"
_TESTS_DIR_REL = "scripts/ci/tests"
_DISCOVER_RE = re.compile(
    r'python3 -m unittest discover -s scripts/ci/tests -p "([^"]+)"',
)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def parse_discover_patterns(workflow_text: str) -> list[str]:
    patterns: list[str] = []

    for raw in workflow_text.splitlines():
        stripped = raw.lstrip()

        if stripped.startswith("#"):
            continue

        match = _DISCOVER_RE.search(raw)

        if match is None:
            continue

        patterns.append(match.group(1))

    return patterns


def _base_is_testcase(base: ast.expr) -> bool:
    if isinstance(base, ast.Name):
        return base.id == "TestCase"

    if isinstance(base, ast.Attribute):
        return base.attr == "TestCase"

    return False


def _class_has_test_method(node: ast.ClassDef) -> bool:
    for child in node.body:
        if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)) and child.name.startswith(
            "test_"
        ):
            return True

    return False


def collect_module_errors(patterns: list[str], tests_dir: Path) -> list[str]:
    """Return human-readable errors for discover targets that unittest would skip."""
    errors: list[str] = []

    if len(patterns) == 0:
        errors.append(
            f"{_PUSH_REL}: Beta-readiness guard unit tests must run unittest discover "
            "against at least one scripts/ci/tests module",
        )
        return errors

    for pattern in patterns:
        if "/" in pattern or "\\" in pattern or any(char in pattern for char in "*?["):
            errors.append(
                f"{_PUSH_REL}: unittest discover pattern {pattern!r} must be an explicit "
                f"filename under {_TESTS_DIR_REL} (no globs or paths)",
            )
            continue

        path = tests_dir / pattern

        if not path.is_file():
            errors.append(f"{_TESTS_DIR_REL}/{pattern}: missing (unittest discover would exit 5)")
            continue

        try:
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        except SyntaxError as exc:
            errors.append(f"{_TESTS_DIR_REL}/{pattern}: cannot parse ({exc.msg})")
            continue

        has_case = False
        has_test_method = False

        for node in tree.body:
            if not isinstance(node, ast.ClassDef):
                continue

            if not any(_base_is_testcase(base) for base in node.bases):
                continue

            has_case = True

            if _class_has_test_method(node):
                has_test_method = True
                break

        if not has_case:
            errors.append(
                f"{_TESTS_DIR_REL}/{pattern}: unittest discover collects 0 tests "
                "(wrap pytest-style functions in a unittest.TestCase subclass)",
            )
            continue

        if not has_test_method:
            errors.append(
                f"{_TESTS_DIR_REL}/{pattern}: TestCase subclass has no test_* methods "
                "(unittest discover would exit 5)",
            )

    return errors


def collect_wiring_errors(workflow_text: str) -> list[str]:
    errors: list[str] = []

    if _CHECK_REL not in workflow_text:
        errors.append(
            f"{_PUSH_REL}: CI: beta-readiness wiring guards must run {_CHECK_REL}",
        )

    if f'-p "{Path(_TEST_REL).name}"' not in workflow_text:
        errors.append(
            f"{_PUSH_REL}: Beta-readiness guard unit tests must discover {Path(_TEST_REL).name}",
        )

    return errors


def scan(root: Path) -> list[str]:
    push_path = root / _PUSH_REL
    errors: list[str] = []

    if not push_path.is_file():
        return [f"missing {_PUSH_REL}"]

    workflow_text = push_path.read_text(encoding="utf-8")
    errors.extend(collect_wiring_errors(workflow_text))
    errors.extend(
        collect_module_errors(
            parse_discover_patterns(workflow_text),
            root / _TESTS_DIR_REL,
        ),
    )
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args(argv)

    errors = scan(repo_root())

    if errors:
        print("check_beta_readiness_unittest_discover: FAIL", file=sys.stderr)

        for error in errors:
            print(error, file=sys.stderr)

        return 1

    print("check_beta_readiness_unittest_discover: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
