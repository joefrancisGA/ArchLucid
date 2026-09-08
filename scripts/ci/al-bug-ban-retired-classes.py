#!/usr/bin/env python3
"""CI bans for retired /al-bug defect-class treadmills (ABQ-32).

Boolean-coercion: new ``TryParseBooleanString`` *method bodies* must live in
the allowlist (canonical reader + known delegates). Call sites of
``JsonBooleanStringReader.TryParseBooleanString`` are allowed everywhere.

Fail-open redaction: new ``IsEmbeddedSensitiveFragment`` copies are banned
outside the allowlist (canonical token redactors). Zero production copies
today — the identifier itself is the ban.

strictmode-script: Pester 3 ``Should Be`` (not ``Should -Be``) under scripts/tests.

Do not add English-phrase signals to al-bug-audit-proven-rows.py.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ALLOWLIST = Path(__file__).resolve().parent / "al-bug-retired-class-allowlist.txt"

TRY_PARSE_BOOL_DEF = re.compile(
    r"^\s*(?:public|private|internal|protected|static|\s)+\s*bool\s+TryParseBooleanString\s*\(",
    re.MULTILINE,
)
EMBEDDED_FRAGMENT = re.compile(r"\bIsEmbeddedSensitiveFragment\b")
PESTER3_SHOULD_BE = re.compile(r"\bShould Be\b")

PRODUCTION_CS_ROOTS = (
    "ArchLucid.Core",
    "ArchLucid.Application",
    "ArchLucid.Api",
    "ArchLucid.Persistence",
    "ArchLucid.Decisioning",
    "ArchLucid.AgentRuntime",
    "ArchLucid.Host.Core",
    "ArchLucid.Cli",
    "ArchLucid.Retrieval",
)


def load_allowlist(path: Path) -> set[str]:
    if not path.is_file():
        return set()
    allowed: set[str] = set()
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        allowed.add(line.replace("\\", "/"))
    return allowed


def iter_cs_files(root: Path) -> list[Path]:
    files: list[Path] = []
    for folder in PRODUCTION_CS_ROOTS:
        base = root / folder
        if not base.is_dir():
            continue
        for path in base.rglob("*.cs"):
            normalized = path.as_posix()
            if "/Tests/" in normalized or normalized.endswith("Tests.cs"):
                continue
            files.append(path)
    return files


def rel(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def find_boolean_coercion_violations(root: Path, allowlist: set[str]) -> list[str]:
    errors: list[str] = []
    for path in iter_cs_files(root):
        relative = rel(root, path)
        text = path.read_text(encoding="utf-8")
        if not TRY_PARSE_BOOL_DEF.search(text):
            continue
        if relative in allowlist:
            continue
        errors.append(f"boolean-coercion: new TryParseBooleanString body in {relative}")
    return errors


def find_fail_open_redaction_violations(root: Path, allowlist: set[str]) -> list[str]:
    errors: list[str] = []
    for path in iter_cs_files(root):
        relative = rel(root, path)
        text = path.read_text(encoding="utf-8")
        if not EMBEDDED_FRAGMENT.search(text):
            continue
        if relative in allowlist:
            continue
        errors.append(f"fail-open-validation: IsEmbeddedSensitiveFragment in {relative}")
    return errors


def find_pester3_violations(root: Path) -> list[str]:
    errors: list[str] = []
    tests_dir = root / "scripts" / "tests"
    if not tests_dir.is_dir():
        return errors
    for path in tests_dir.rglob("*.ps1"):
        text = path.read_text(encoding="utf-8")
        if PESTER3_SHOULD_BE.search(text):
            errors.append(f"strictmode-script: Pester 3 'Should Be' in {rel(root, path)}")
    return errors


def check_text_boolean_definition(text: str) -> bool:
    return TRY_PARSE_BOOL_DEF.search(text) is not None


def scan(root: Path, allowlist: set[str]) -> list[str]:
    errors: list[str] = []
    errors.extend(find_boolean_coercion_violations(root, allowlist))
    errors.extend(find_fail_open_redaction_violations(root, allowlist))
    errors.extend(find_pester3_violations(root))
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=REPO_ROOT)
    parser.add_argument("--allowlist", type=Path, default=DEFAULT_ALLOWLIST)
    args = parser.parse_args(argv)
    allowlist = load_allowlist(args.allowlist)
    errors = scan(args.root, allowlist)
    if errors:
        for err in errors:
            print(err, file=sys.stderr)
        return 1
    print("OK: retired-class bans clean")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
