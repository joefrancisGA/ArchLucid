#!/usr/bin/env python3
"""TB-1562 / M-290: Anti-appsettings-SoT / anti-TF-state-config-SoT / anti-TB-881-open-pilot-gate honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "configuration-architecture-precedence-honesty: allow"

CONTRACT_REL = Path("docs/library/CONFIGURATION_ARCHITECTURE_PRECEDENCE_VALIDATION_DRIFT_CLAIM_MAP.md")
PA_ONE_PAGER_REL = Path(
    "docs/go-to-market/CONFIGURATION_ARCHITECTURE_PRECEDENCE_VALIDATION_DRIFT_PA_ONE_PAGER.md"
)
CONFIG_RULES_REL = Path("ArchLucid.Host.Core/Startup/Validation/ArchLucidConfigurationRules.cs")
PROGRAM_REL = Path("ArchLucid.Api/Program.cs")
DRIFT_PREFLIGHT_REL = Path("scripts/Assert-TerraformDeploymentDriftPreflight.ps1")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    Path("docs/go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1561**",
    "**TB-1562**",
    "M-290",
    "CI anchors for **TB-1562**",
    "ArchLucidConfigurationRules",
    "**TB-881**",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbid",
    "too strong",
    "tb-1561",
    "tb-1562",
    "tb-881",
    "tb-1371",
    "tb-1372",
    "tb-1317",
    "tb-1318",
    "m-290",
    "m-291",
    "honesty guard",
    "non-claim",
    "not automatic",
    "not wired",
    "deferred",
    "adr 0017",
    "fragmented",
    "selective",
    "env wins",
    "optional",
    "unless",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:open|reopen)\b[^.\n]{0,40}\b(?:RC|registration)\b[^.\n]{0,60}\b(?:env[-\s]?var|env[-\s]?pin)\b"
            r"[^.\n]{0,60}\b(?:blocks?|blocker|pilot\s+gate|ship\s+gate)\b",
            re.IGNORECASE,
        ),
        "RC registration env-var race is Done TB-881 CI/test class — not a pilot ship gate (TB-1561).",
    ),
    ClaimPattern(
        re.compile(
            r"\breopen\b[^.\n]{0,40}\b(?:Done\s+)?TB-881\b[^.\n]{0,60}\b(?:pilot|ship|gate|blocker)\b",
            re.IGNORECASE,
        ),
        "Do not reopen Done TB-881 as a pilot gate (TB-1561 / coordinate TB-1372).",
    ),
    ClaimPattern(
        re.compile(
            r"\bappsettings(?:\.json)?\b[^.\n]{0,60}\b(?:is|as)\b[^.\n]{0,40}\b"
            r"(?:the\s+)?(?:deployment|runtime|config(?:uration)?)\b[^.\n]{0,20}\b(?:SoT|source of truth)\b",
            re.IGNORECASE,
        ),
        "Env and CA-injected secrets win over appsettings overlays — not deployment SoT (TB-1561).",
    ),
    ClaimPattern(
        re.compile(
            r"\bterraform\s+state\b[^.\n]{0,60}\b(?:is|as)\b[^.\n]{0,40}\b"
            r"(?:CA|container apps?|runtime)\b[^.\n]{0,40}\b(?:config(?:uration)?\s+)?(?:SoT|source of truth)\b",
            re.IGNORECASE,
        ),
        "Terraform state is not CA runtime config SoT — ownership splits + ignore_changes (TB-1561).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:drift\s+preflight|stack\s+doctor|Assert-TerraformDeploymentDriftPreflight)\b[^.\n]{0,80}\b"
            r"(?:proves?|guarantees?|confirms?)\b[^.\n]{0,60}\b(?:live|runtime)\b[^.\n]{0,40}\b"
            r"(?:azure|tf|terraform)\b[^.\n]{0,40}\b(?:match(?:es)?|parity)\b",
            re.IGNORECASE,
        ),
        "Static TF preflight is wiring-only — not live Azure/runtime parity proof (TB-1561).",
    ),
    ClaimPattern(
        re.compile(
            r"\bstartup\s+validation\b[^.\n]{0,60}\b(?:covers?|validates?)\b[^.\n]{0,40}\ball\b[^.\n]{0,20}\bconfig\b",
            re.IGNORECASE,
        ),
        "Startup validation is selective fail-fast — not universal config coverage (TB-1561).",
    ),
    ClaimPattern(
        re.compile(
            r"\bIOptionsMonitor\b[^.\n]{0,80}\b(?:means?|implies?|enables?)\b[^.\n]{0,40}\b"
            r"(?:hot[-\s]?reload|live\s+reload)\b[^.\n]{0,40}\b(?:in\s+)?prod(?:uction)?\b",
            re.IGNORECASE,
        ),
        "IOptionsMonitor does not imply prod hot-reload without App Config sentinel (ADR 0017) (TB-1561).",
    ),
    ClaimPattern(
        re.compile(
            r"\bValidateOnStart\b[^.\n]{0,60}\b(?:covers?|validates?)\b[^.\n]{0,40}\ball\b[^.\n]{0,20}\bconfig\b",
            re.IGNORECASE,
        ),
        "ValidateOnStart is selective — not universal config validation (TB-1561).",
    ),
)


def _missing_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return [marker for marker in markers if marker.lower() not in lowered]


def _line_for_match(text: str, match: re.Match[str]) -> str:
    line_start = text.rfind("\n", 0, match.start()) + 1
    line_end = text.find("\n", match.start())
    return text[line_start:] if line_end == -1 else text[line_start:line_end]


def _line_has_caveat(line_lower: str) -> bool:
    return any(marker in line_lower for marker in _CAVEAT_MARKERS)


def _line_is_allowlisted(line: str) -> bool:
    return ALLOWLIST_MARKER in line.lower()


def _is_markdown_table_data_row(line: str) -> bool:
    stripped = line.lstrip()
    if not stripped.startswith("|"):
        return False
    if re.match(r"^\|[\s|:-]+$", stripped):
        return False
    return stripped.count("|") >= 3


def _match_is_quoted_forbidden_example(line: str, match_start: int, match_end: int) -> bool:
    for open_quote, close_quote in (('"', '"'), ("\u201c", "\u201d"), ("\u2018", "\u2019")):
        cursor = 0
        while cursor < len(line):
            open_index = line.find(open_quote, cursor)
            if open_index < 0:
                break
            close_index = line.find(close_quote, open_index + len(open_quote))
            if close_index < 0:
                break
            quoted_end = close_index + len(close_quote)
            if open_index <= match_start and match_end <= quoted_end:
                return True
            cursor = quoted_end
    return False


def _line_is_forbidden_example(line: str, match_start: int, match_end: int) -> bool:
    if _match_is_quoted_forbidden_example(line, match_start, match_end):
        return True
    stripped = line.lstrip().lower()
    if stripped.startswith(("-", "*")) and ('no "' in stripped or "no \u201c" in stripped):
        return True
    if _is_markdown_table_data_row(line):
        return True
    if stripped.startswith("|") and (
        "unsafe" in stripped or "forbid" in stripped or "too strong" in stripped or "ci anchors" in stripped
    ):
        return True
    return False


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL
    if not path.is_file():
        return [f"{CONTRACT_REL.as_posix()}: missing configuration architecture claim map (TB-1561)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1562)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (CONFIG_RULES_REL, ("ArchLucidConfigurationRules", "CollectErrors")),
        (PROGRAM_REL, ("CreateBuilder", "AddEnvironmentVariables")),
        (DRIFT_PREFLIGHT_REL, ("Assert-TerraformDeploymentDriftPreflight",)),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing configuration architecture code anchor (TB-1562).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1562).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing configuration architecture honesty scan target."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for claim in CLAIM_PATTERNS:
        for match in claim.pattern.finditer(text):
            line = _line_for_match(text, match)
            line_lower = line.lower()
            line_start = text.rfind("\n", 0, match.start()) + 1
            match_start_in_line = match.start() - line_start
            match_end_in_line = match.end() - line_start
            if (
                _line_is_allowlisted(line)
                or _line_is_forbidden_example(line, match_start_in_line, match_end_in_line)
                or _line_has_caveat(line_lower)
            ):
                continue
            violations.append(f"{rel.as_posix()}: {claim.message} Matched `{match.group(0)}`.")
    return violations


def configuration_architecture_precedence_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(code_anchor_violations(root))
    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))
    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)
    violations = configuration_architecture_precedence_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"configuration architecture precedence honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("configuration architecture precedence honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
