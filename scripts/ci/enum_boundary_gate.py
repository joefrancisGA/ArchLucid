#!/usr/bin/env python3
"""Gate enum diagnostics from the existing CI compiler run; never invoke a build."""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

import enum_boundary_audit as audit


def changed_files(base: str, root: Path) -> set[str]:
    # Only compare a real ancestor of the compiled merge result, never a guessed ref.
    resolved = subprocess.check_output(
        ["git", "rev-parse", "--verify", base + "^{commit}"], cwd=root, text=True
    ).strip()
    subprocess.run(["git", "merge-base", "--is-ancestor", resolved, "HEAD"],
                   cwd=root, check=True)
    raw = subprocess.check_output(
        ["git", "diff", "--no-renames", "--name-only", "-z", resolved, "HEAD", "--"],
        cwd=root
    )
    return {part.decode("utf-8") for part in raw.split(b"\0") if part}


def load_exceptions(path: Path) -> set[tuple]:
    rows = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(rows, list):
        raise ValueError("Enum exceptions must be a JSON array.")
    approved = set()
    for row in rows:
        if not isinstance(row, dict) or row.get("rule") != "ENUM001":
            raise ValueError("Only reviewed ENUM001 conversion sites may be excepted.")
        if not isinstance(row.get("rationale"), str) or not row["rationale"].strip():
            raise ValueError("Every enum exception requires a specific rationale.")
        if not isinstance(row.get("path"), str) or not row["path"].endswith(".cs"):
            raise ValueError("Each exception must name a C# source file.")
        for name in ("line", "column"):
            if type(row.get(name)) is not int or row[name] < 1:
                raise ValueError("Each exception needs a positive line and column.")
        digest = row.get("sha256")
        if not isinstance(digest, str) or len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
            raise ValueError("Each exception needs its exact compiler-source fingerprint.")
        identifier = audit.key(row)
        if identifier in approved:
            raise ValueError("Duplicate enum exception.")
        approved.add(identifier)
    return approved


def classify(findings: list[dict], approved: set[tuple], touched: set[str],
             mode: str) -> tuple[list[dict], list[dict], set[tuple]]:
    if mode not in {"changed-files", "all", "inventory"}:
        raise ValueError("Unknown enum gate mode.")
    blocked, legacy = [], []
    seen = set()
    for row in findings:
        identifier = audit.key(row)
        seen.add(identifier)
        # No exemption for raw parsing, even if an exception is fabricated.
        if row["rule"] == "ENUM002":
            blocked.append(row)
        elif identifier in approved:
            continue
        elif mode == "all" or (mode == "changed-files" and row["path"] in touched):
            blocked.append(row)
        else:
            legacy.append(row)
    return blocked, legacy, approved - seen


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reports", type=Path, required=True)
    parser.add_argument("--exceptions", type=Path, required=True)
    parser.add_argument("--build-exit-code", type=int, default=0,
                        help="Exit status of the existing compiler invocation; nonzero never passes.")
    parser.add_argument("--policy", type=Path,
                        default=audit.ROOT / "scripts/ci/data/enum_boundary_policy.json")
    scope = parser.add_mutually_exclusive_group(required=True)
    scope.add_argument("--base-ref")
    scope.add_argument("--inventory-only", action="store_true")
    args = parser.parse_args()

    configured = json.loads(args.policy.read_text(encoding="utf-8"))["mode"]
    if configured not in {"changed-files", "all"}:
        raise ValueError("Invalid checked-in enum enforcement mode.")
    mode = ("inventory" if args.inventory_only else configured)
    # Full enforcement cannot be weakened by a manual inventory-only invocation.
    if configured == "all":
        mode = "all"
    touched = changed_files(args.base_ref, audit.ROOT) if args.base_ref else set()
    directory = args.reports.resolve()
    evidence_errors = []
    findings, report_count, project_count = [], len(list(directory.glob("*.sarif"))), None
    try:
        findings, report_count = audit.findings_from_reports(directory)
    except (OSError, ValueError, KeyError, TypeError, AttributeError, SystemExit) as error:
        evidence_errors.append(f"Invalid compiler findings evidence: {error}")
    try:
        project_count = audit.check_report_coverage(directory)
    except (OSError, ValueError, KeyError, TypeError, AttributeError, SystemExit, subprocess.CalledProcessError) as error:
        evidence_errors.append(f"Incomplete compiler project coverage: {error}")
    approved = load_exceptions(args.exceptions)
    blocked, legacy, stale = classify(findings, approved, touched, mode)
    if evidence_errors or args.build_exit_code:
        # A partial compiler run cannot establish the absence of a previously approved source site.
        stale = set()
    evidence = {
        "commit": audit.git("rev-parse", "HEAD"),
        "mode": mode,
        "build_exit_code": args.build_exit_code,
        "evidence_errors": evidence_errors,
        "reports": report_count,
        "projects": project_count,
        "findings": findings,
        "blocking": blocked,
        "unreviewed_legacy": legacy,
        "reviewed_exceptions": [row for row in findings if audit.key(row) in approved],
        "stale_exceptions": sorted(stale),
    }
    (directory / "enum-gate-result.json").write_text(
        json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    print(f"Enum gate: {mode}; {project_count} projects, {len(blocked)} blocking, "
          f"{len(legacy)} unreviewed legacy conversions, {len(stale)} stale exceptions.")
    for row in blocked:
        print(f"::error file={row['path']},line={row['line']}::{row['rule']}: {row['message']}")
    if stale:
        print("::error::Remove stale enum exceptions; they no longer match the source.")
    for error in evidence_errors:
        print(f"::error::{error}")
    if args.build_exit_code:
        print(f"::error::Compiler exited with status {args.build_exit_code}; inventory is not a passing verification.")
    return 1 if blocked or stale or evidence_errors or args.build_exit_code else 0


if __name__ == "__main__":
    raise SystemExit(main())
