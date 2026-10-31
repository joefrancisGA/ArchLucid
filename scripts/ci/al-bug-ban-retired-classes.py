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

week-uom-synonym: bans new HasCompactWeekk+Suffix / ContainsSpacedSlashWeekk+Token
methods and per-length AzureRetailPricesSkuMatchers*Weekkk*Tests.cs files.
HasCompactWeekSuffix and topology matchers are not banned.

inventory-host-ladder: bans new per-integer inventory-host cheap-disproof test
method names (cosmos .eN, U+1ECx storage, U+XXFFFE Key Vault, percent-decode depth,
firewall [N,"a"]) unless listed in al-bug-inventory-host-ladder-test-allowlist.txt.
Extend AzureInventoryAppSettingHostPinnedMechanismTheoryTests instead.

configuration-summary-ladder: bans new per-integer Configuration cheap-disproof test
method names (ClientSecret percent-decode depth, supplementary-char truncation boundary)
unless listed in al-bug-configuration-summary-ladder-test-allowlist.txt.
See docs/library/AL_BUG_CONFIGURATION_SUMMARY_LADDER_SATURATION.md.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ALLOWLIST = Path(__file__).resolve().parent / "al-bug-retired-class-allowlist.txt"
INVENTORY_HOST_LADDER_ALLOWLIST = (
    Path(__file__).resolve().parent / "al-bug-inventory-host-ladder-test-allowlist.txt"
)
CONFIG_SUMMARY_LADDER_ALLOWLIST = (
    Path(__file__).resolve().parent / "al-bug-configuration-summary-ladder-test-allowlist.txt"
)

TRY_PARSE_BOOL_DEF = re.compile(
    r"^\s*(?:public|private|internal|protected|static|\s)+\s*bool\s+TryParseBooleanString\s*\(",
    re.MULTILINE,
)
EMBEDDED_FRAGMENT = re.compile(r"\bIsEmbeddedSensitiveFragment\b")
PESTER3_SHOULD_BE = re.compile(r"\bShould Be\b")
WEEK_K_METHOD = re.compile(
    r"^\s*private static bool (?:HasCompactWeekk+Suffix|ContainsSpacedSlashWeekk+Token)\s*\(",
    re.MULTILINE,
)
WEEK_K_TEST_FILE = re.compile(
    r"^ArchLucid\.Core\.Tests/Costing/AzureRetailPricesSkuMatchers"
    r"(?!WeekMeterTests\.cs$)"
    r".*Weekk.*Tests\.cs$",
)
WEEK_K_TEST_ALLOWLIST = {
    "ArchLucid.Core.Tests/Costing/AzureRetailPricesSkuMatchersWeekMeterTests.cs",
}

INVENTORY_HOST_LADDER_METHOD_PATTERNS = (
    re.compile(r"ParseSettingValues_e\d+_regional_cosmos"),
    re.compile(r"ParseSettingValues_u1E[0-9A-Fa-f]{2}_in_account_name"),
    re.compile(r"noncharacter_u[0-9A-Fa-f]+FFFE"),
    re.compile(r"at_layer_one_hundred_\w+_percent_encoded"),
    re.compile(r"json_array_of_number_one_hundred_\w+_and_string"),
)
INVENTORY_HOST_LADDER_TEST_ROOTS = (
    "ArchLucid.Core.Tests/AzureExtractor",
    "ArchLucid.Core.Tests/InfraEvidence",
)
CONFIG_SUMMARY_LADDER_METHOD_PATTERNS = (
    re.compile(r"three_thousand_.*_layer_percent_encoded_in_query"),
    re.compile(r"five_hundred_twenty_.*_supplementary_characters_at_boundary"),
)
CONFIG_SUMMARY_LADDER_TEST_ROOTS = ("ArchLucid.Core.Tests/Configuration",)
TEST_METHOD_DEF = re.compile(r"^\s*public void (\w+)\(", re.MULTILINE)

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


def find_week_uom_synonym_violations(root: Path) -> list[str]:
    errors: list[str] = []
    for path in iter_cs_files(root):
        text = path.read_text(encoding="utf-8")
        if not WEEK_K_METHOD.search(text):
            continue
        errors.append(
            f"week-uom-synonym: per-k week matcher methods in {rel(root, path)}",
        )

    tests_dir = root / "ArchLucid.Core.Tests/Costing"
    if tests_dir.is_dir():
        for path in tests_dir.glob("AzureRetailPricesSkuMatchers*Tests.cs"):
            relative = rel(root, path)
            if relative in WEEK_K_TEST_ALLOWLIST:
                continue
            if WEEK_K_TEST_FILE.match(relative):
                errors.append(
                    f"week-uom-synonym: per-variant week test file {relative}",
                )
    return errors


def load_inventory_host_ladder_allowlist(path: Path) -> set[str]:
    return load_allowlist(path)


def find_inventory_host_ladder_test_violations(root: Path, allowlist: set[str]) -> list[str]:
    errors: list[str] = []
    for folder in INVENTORY_HOST_LADDER_TEST_ROOTS:
        base = root / folder
        if not base.is_dir():
            continue
        for path in base.rglob("*Tests.cs"):
            relative = rel(root, path)
            text = path.read_text(encoding="utf-8")
            for match in TEST_METHOD_DEF.finditer(text):
                method = match.group(1)
                if not any(p.search(method) for p in INVENTORY_HOST_LADDER_METHOD_PATTERNS):
                    continue
                key = f"{relative}::{method}"
                if key in allowlist:
                    continue
                errors.append(
                    f"inventory-host-ladder: new per-integer test method {key} — "
                    "extend AzureInventoryAppSettingHostPinnedMechanismTheoryTests or "
                    "docs/library/AL_BUG_INVENTORY_HOST_LADDER_SATURATION.md",
                )
    return errors


def find_config_summary_ladder_test_violations(root: Path, allowlist: set[str]) -> list[str]:
    errors: list[str] = []
    for folder in CONFIG_SUMMARY_LADDER_TEST_ROOTS:
        base = root / folder
        if not base.is_dir():
            continue
        for path in base.rglob("*Tests.cs"):
            relative = rel(root, path)
            text = path.read_text(encoding="utf-8")
            for match in TEST_METHOD_DEF.finditer(text):
                method = match.group(1)
                if not any(p.search(method) for p in CONFIG_SUMMARY_LADDER_METHOD_PATTERNS):
                    continue
                key = f"{relative}::{method}"
                if key in allowlist:
                    continue
                errors.append(
                    f"configuration-summary-ladder: new per-integer test method {key} — "
                    "see docs/library/AL_BUG_CONFIGURATION_SUMMARY_LADDER_SATURATION.md",
                )
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
    errors.extend(find_week_uom_synonym_violations(root))
    ladder_allowlist = load_inventory_host_ladder_allowlist(INVENTORY_HOST_LADDER_ALLOWLIST)
    errors.extend(find_inventory_host_ladder_test_violations(root, ladder_allowlist))
    config_ladder_allowlist = load_allowlist(CONFIG_SUMMARY_LADDER_ALLOWLIST)
    errors.extend(find_config_summary_ladder_test_violations(root, config_ladder_allowlist))
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
