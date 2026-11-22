#!/usr/bin/env python3
"""Focused index and runner for existing cross-product Aspects regression tests.

No duplicated business logic or test fixtures: verifies exact test references and
runs narrow dotnet/Vitest commands. SQL integration cases are opt-in.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import shlex
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
CATALOG = Path("scripts/ci/aspects-regression-cases.json")
PATTERNS = frozenset({
    "persistence", "input-validation", "scope", "async-lifecycle", "pagination"
})
PRODUCTS = frozenset({"ArchLucid", "SecureNow"})
IDENTIFIER = re.compile(r"^[A-Za-z_][A-Za-z_0-9]*$")
VITEST_TITLE = re.compile(r"^[A-Za-z0-9_ ,.:;'\-]+$")


def load_catalog(root: Path = REPO_ROOT) -> list[dict]:
    document = json.loads((root / CATALOG).read_text(encoding="utf-8"))
    if document.get("schema_version") != 1 or not isinstance(document.get("cases"), list):
        raise ValueError("Expected schema_version=1 and cases array")
    return document["cases"]


def validate_catalog(cases: list[dict], root: Path = REPO_ROOT) -> None:
    """Reject stale registrations, unsafe paths, duplicate IDs, or coverage gaps."""
    errors: list[str] = []
    seen: set[str] = set()
    products: set[str] = set()
    patterns: set[str] = set()
    resolved_root = root.resolve()
    for index, case in enumerate(cases):
        label = f"case {index + 1} ({case.get('id', '?')})"
        case_id = case.get("id")
        if not isinstance(case_id, str) or not re.fullmatch(r"[a-z][a-z0-9-]*", case_id):
            errors.append(f"{label}: invalid id")
        elif case_id in seen:
            errors.append(f"{label}: duplicate id")
        seen.add(case_id)
        pattern, product, kind = case.get("pattern"), case.get("product"), case.get("kind")
        if pattern not in PATTERNS:
            errors.append(f"{label}: unknown pattern")
        else:
            patterns.add(pattern)
        if product not in PRODUCTS:
            errors.append(f"{label}: unknown product")
        else:
            products.add(product)
        if kind not in ("dotnet", "vitest"):
            errors.append(f"{label}: unknown test runner")
            continue
        if not isinstance(case.get("source_pr"), int) or case["source_pr"] < 1:
            errors.append(f"{label}: source_pr must be a positive PR number")
        if type(case.get("sql")) is not bool:
            errors.append(f"{label}: sql must be boolean")
        if kind == "vitest" and case.get("sql"):
            errors.append(f"{label}: Vitest cannot use sql integration fixture")
        test_name = case.get("test")
        valid_test = (isinstance(test_name, str)
                      and bool(IDENTIFIER.fullmatch(test_name) if kind == "dotnet"
                               else VITEST_TITLE.fullmatch(test_name)))
        if not valid_test:
            errors.append(f"{label}: invalid test name")
        paths = [("source", case.get("source"))]
        if kind == "dotnet":
            paths.append(("project", case.get("project")))
        elif not str(case.get("source", "")).startswith("archlucid-ui/"):
            errors.append(f"{label}: Vitest source must be under archlucid-ui")
        contents: str | None = None
        for field, raw in paths:
            if not isinstance(raw, str) or not raw or "\\" in raw:
                errors.append(f"{label}: invalid {field} path")
                continue
            resolved = (resolved_root / raw).resolve()
            if not resolved.is_relative_to(resolved_root) or not resolved.is_file():
                errors.append(f"{label}: missing or unsafe {field}: {raw}")
                continue
            if field == "source":
                contents = resolved.read_text(encoding="utf-8-sig")
            elif not raw.endswith(".csproj"):
                errors.append(f"{label}: project must be a .csproj")
        if contents is not None and valid_test:
            found = (bool(re.search(r"\b" + re.escape(test_name) + r"\s*\(", contents))
                     if kind == "dotnet" else test_name in contents)
            if not found:
                errors.append(f"{label}: registered test no longer exists: {test_name}")
    for missing in sorted(PATTERNS - patterns):
        errors.append(f"missing regression pattern: {missing}")
    for missing in sorted(PRODUCTS - products):
        errors.append(f"missing product coverage: {missing}")
    if errors:
        raise ValueError("\n".join(errors))


def build_commands(cases: list[dict], include_sql: bool = False) -> list[list[str]]:
    """Build safe argument arrays rather than shell commands."""
    selected = [case for case in cases if include_sql or not case["sql"]]
    grouped: dict[str, list[str]] = {}
    commands: list[list[str]] = []
    for case in selected:
        if case["kind"] == "dotnet":
            grouped.setdefault(case["project"], []).append(
                "FullyQualifiedName~" + case["test"])
        else:
            ui_relative = case["source"].removeprefix("archlucid-ui/")
            commands.append([
                "npm", "--prefix", "archlucid-ui", "run", "test:run", "--",
                ui_relative, "-t", case["test"],
            ])
    for project, filters in sorted(grouped.items()):
        commands.append([
            "dotnet", "test", project, "--configuration", "Release",
            "--filter", "|".join(sorted(set(filters))),
            "--no-restore",
        ])
    return commands


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--plan", action="store_true", help="Print test commands without executing")
    mode.add_argument("--run", action="store_true", help="Execute focused existing tests")
    parser.add_argument("--check", action="store_true", help="Validate the catalog")
    parser.add_argument("--report-json", type=Path, help="Write execution summary")
    parser.add_argument("--include-sql", action="store_true",
                        help="Include SQL integration tests (SQL Server fixture required)")
    parser.add_argument("--pattern", choices=sorted(PATTERNS), action="append",
                        help="Select one or more registered regression patterns")
    args = parser.parse_args(argv)

    try:
        cases = load_catalog()
        validate_catalog(cases)
    except (OSError, ValueError) as exc:
        print(f"Regression catalog invalid: {exc}", file=sys.stderr)
        return 2

    print(f"Validated {len(cases)} cases / {len(PATTERNS)} patterns / 2 products.")
    if not (args.plan or args.run):
        return 0
    chosen = [case for case in cases if not args.pattern or case["pattern"] in args.pattern]
    commands = build_commands(chosen, include_sql=args.include_sql)
    omitted = sum(bool(case["sql"]) for case in chosen) if not args.include_sql else 0
    if omitted:
        print(f"Excluded {omitted} SQL Server cases (use --include-sql).")
    if not commands:
        print("No runnable cases match selected options.", file=sys.stderr)
        return 2
    outcomes = []
    failure = 0
    for command in commands:
        print("+ " + shlex.join(command), flush=True)
        if not args.run:
            outcomes.append({"command": command, "status": "planned"})
            continue
        try:
            result = subprocess.run(command, cwd=REPO_ROOT, check=False,
                                    capture_output=True, text=True)
            print(result.stdout, end="")
            print(result.stderr, end="", file=sys.stderr)
            skipped = bool(re.search(r"\\bSkipped:\\s*[1-9]", result.stdout))
            missing = bool(re.search(r"No test matches|No tests found|No test is available",
                                     result.stdout + result.stderr, re.I))
            status = "failed" if result.returncode or missing else (
                "unverified-skips" if skipped else "passed")
            outcomes.append({"command": command, "status": status,
                             "exit_code": result.returncode,
                             "skipped_detected": skipped, "no_tests": missing})
            if status != "passed":
                failure = 1
        except FileNotFoundError:
            outcomes.append({"command": command, "status": "missing-tool"})
            failure = 2
    if args.report_json:
        report = {"generated_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
                  "mode": "run" if args.run else "plan",
                  "registered_cases": len(cases), "selected_cases": len(chosen),
                  "sql_excluded": omitted, "commands": outcomes,
                  "note": "Command-level results only; SQL skips require explicit audit."}
        args.report_json.parent.mkdir(parents=True, exist_ok=True)
        args.report_json.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return failure


if __name__ == "__main__":
    raise SystemExit(main())
