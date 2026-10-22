#!/usr/bin/env python3
"""TB-1560 / M-288: Anti-CI-guarantees-compat / anti-Sunset-always-on / anti-v2-shipped honesty CI.

Fails dishonest stubs that:
- Claim OpenAPI snapshot CI proves `/v1` backward compatibility or semver.
- Claim breaking changes always require `/v2` and are machine-enforced.
- Claim Sunset/Deprecation headers are always published or multiple REST majors coexist.
- Claim buyer OpenAPI equals the full pilot surface, CLI is independently version-frozen,
  or `API_V2_ROUTES` means v2 ships.

Contract: docs/library/REST_CLI_BREAKING_CHANGE_COMPATIBILITY_CLAIM_MAP.md (TB-1559 / TB-1560).
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "rest-cli-breaking-change-compat-honesty: allow"

CONTRACT_REL = Path("docs/library/REST_CLI_BREAKING_CHANGE_COMPATIBILITY_CLAIM_MAP.md")
PA_ONE_PAGER_REL = Path("docs/go-to-market/REST_CLI_BREAKING_CHANGE_COMPATIBILITY_PA_ONE_PAGER.md")
API_CONTRACTS_REL = Path("docs/library/API_CONTRACTS.md")
OPENAPI_DRIFT_REL = Path("docs/library/OPENAPI_CONTRACT_DRIFT.md")
SNAPSHOT_TEST_REL = Path("ArchLucid.Api.Tests/OpenApiContractSnapshotTests.cs")
DEPRECATION_MIDDLEWARE_REL = Path("ArchLucid.Api/Middleware/ApiDeprecationHeadersMiddleware.cs")

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
    "**TB-1559**",
    "**TB-1560**",
    "M-288",
    "CI anchors for **TB-1560**",
    "OpenApiContractSnapshotTests",
    "ADR 0006",
    "check_rest_cli_breaking_change_compat_honesty.py",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbid",
    "too strong",
    "tb-1559",
    "tb-1560",
    "m-288",
    "m-289",
    "honesty guard",
    "non-claim",
    "accidental-drift",
    "accidental drift",
    "default off",
    "feature-flag",
    "feature flag",
    "optional",
    "unless",
    "not structural",
    "not semantic",
    "human review",
    "intentional regen",
    "policy text only",
    "doc is v1",
    "not authoritative",
    "filtered",
    "does not claim",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\b(?:CI|contract\s+tests?|OpenAPI\s+snapshot)\b[^.\n]{0,80}\b"
            r"(?:proves?|guarantees?|ensures?|enforces?)\b[^.\n]{0,60}\b"
            r"(?:backward\s+compat(?:ibility)?|semver|semantic\s+compat)\b",
            re.IGNORECASE,
        ),
        "OpenAPI snapshot CI proves accidental-drift equality — not semantic backward compat (TB-1559).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:backward\s+compat(?:ibility)?|semver)\b[^.\n]{0,60}\b"
            r"(?:for\s+)?(?:`/v1`|/v1)\b[^.\n]{0,40}\b(?:proven|guaranteed|enforced)\b",
            re.IGNORECASE,
        ),
        "Do not sell `/v1` semver or backward-compat proof from snapshot CI (TB-1559).",
    ),
    ClaimPattern(
        re.compile(
            r"\bbreaking\s+changes?\b[^.\n]{0,80}\b(?:always|automatically|machine[-\s]?enforced)\b"
            r"[^.\n]{0,60}\b(?:require|forces?|mandates?)\b[^.\n]{0,20}\b(?:`/v2`|/v2)\b",
            re.IGNORECASE,
        ),
        "Breaking changes should per policy move majors — regen can still break `/v1` (TB-1559).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:Sunset|Deprecation)\b[^.\n]{0,60}\bheaders?\b[^.\n]{0,40}\b"
            r"(?:always|automatically|by default)\b[^.\n]{0,40}\b(?:published|on|enabled|sent)\b",
            re.IGNORECASE,
        ),
        "Sunset/Deprecation headers are feature-flagged and default off (TB-1559).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:multiple|dual|coexisting)\b[^.\n]{0,40}\bREST\b[^.\n]{0,40}\bmajors?\b"
            r"[^.\n]{0,60}\b(?:in\s+)?prod(?:uction)?\b",
            re.IGNORECASE,
        ),
        "Only `/v1` ships — multiple REST majors are not in production (TB-1559).",
    ),
    ClaimPattern(
        re.compile(
            r"\bbuyer\s+OpenAPI\b[^.\n]{0,60}\b(?:equals?|is)\b[^.\n]{0,40}\b"
            r"(?:the\s+)?(?:full|complete|entire)\b[^.\n]{0,20}\bpilot\s+surface\b",
            re.IGNORECASE,
        ),
        "Buyer OpenAPI is an audience-filtered slice — not the full pilot surface (TB-1559).",
    ),
    ClaimPattern(
        re.compile(
            r"\bCLI\b[^.\n]{0,60}\b(?:independently|separately)\b[^.\n]{0,40}\b"
            r"(?:version[-\s]?stable|semver|frozen|freeze)\b",
            re.IGNORECASE,
        ),
        "CLI tracks `/v1` HTTP — no independent CLI semver freeze (TB-1559).",
    ),
    ClaimPattern(
        re.compile(
            r"\bAPI_V2_ROUTES(?:\.md)?\b[^.\n]{0,60}\b(?:means?|implies?|proves?)\b[^.\n]{0,40}\bv2\b[^.\n]{0,20}\bships?\b",
            re.IGNORECASE,
        ),
        "`API_V2_ROUTES.md` is v1 canonical route taxonomy — not shipped `/v2` (TB-1559).",
    ),
    ClaimPattern(
        re.compile(
            r"\bSwagger\b[^.\n]{0,60}\b(?:is|as)\b[^.\n]{0,40}\b(?:the\s+)?contract\s+of\s+record\b",
            re.IGNORECASE,
        ),
        "Contract of record is `GET /openapi/v1.json` — not Swashbuckle Swagger (TB-1559).",
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
        return [f"{CONTRACT_REL.as_posix()}: missing REST+CLI compatibility claim map (TB-1559)."]
    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []
    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1560)."
        )
    return violations


def code_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    for rel, needles in (
        (SNAPSHOT_TEST_REL, ("OpenApiContractSnapshotTests",)),
        (API_CONTRACTS_REL, ("/openapi/v1.json", "OpenApiContractSnapshotTests")),
        (OPENAPI_DRIFT_REL, ("OpenApiContractSnapshotTests",)),
        (DEPRECATION_MIDDLEWARE_REL, ("ApiDeprecationHeadersMiddleware", "Sunset")),
    ):
        path = root / rel
        if not path.is_file():
            violations.append(f"{rel.as_posix()}: missing REST+CLI compatibility code anchor (TB-1560).")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for needle in needles:
            if needle not in text:
                violations.append(f"{rel.as_posix()}: expected {needle!r} anchor (TB-1560).")
    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel
    if not path.is_file():
        return [f"{rel.as_posix()}: missing REST+CLI compatibility honesty scan target."]
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


def rest_cli_breaking_change_compat_honesty_violations(root: Path) -> list[str]:
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
    violations = rest_cli_breaking_change_compat_honesty_violations(REPO_ROOT)
    if violations:
        label = "warnings" if args.advisory else "errors"
        print(f"rest+cli breaking-change compatibility honesty guard: FAIL ({label})", file=sys.stderr)
        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)
        return 0 if args.advisory else 1
    print("rest+cli breaking-change compatibility honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
