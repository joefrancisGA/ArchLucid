#!/usr/bin/env python3
"""TB-1245 / M-215: Anti-least-privilege-while-colocated / PE-equals-private / AOAI-Contributor honesty CI."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

ALLOWLIST_MARKER = "azure-workload-privilege-escalation-seam-honesty: allow"

CONTRACT_REL = Path("docs/library/AZURE_WORKLOAD_PRIVILEGE_ESCALATION_SEAM_CONTRACT.md")
PA_ONE_PAGER_REL = Path(
    "docs/go-to-market/AZURE_WORKLOAD_PRIVILEGE_ESCALATION_SEAM_PA_ONE_PAGER.md"
)
TF_VARIABLES_REL = Path("infra/terraform-container-apps/variables.tf")
TF_OPENAI_REL = Path("infra/terraform-container-apps/azure_openai.tf")

DOCS_TO_SCAN: tuple[Path, ...] = (
    Path("docs/go-to-market/WHAT_NOT_TO_PROMISE.md"),
    Path("docs/go-to-market/POSITIONING.md"),
    Path("docs/go-to-market/EXECUTIVE_SPONSOR_BRIEF.md"),
    Path("docs/go-to-market/trust-center.md"),
    Path("docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md"),
    PA_ONE_PAGER_REL,
)

REQUIRED_CONTRACT_MARKERS: tuple[str, ...] = (
    "**TB-1244**",
    "**TB-1245**",
    "M-215",
    "Explicit non-claims",
    "CI anchors for **TB-1245**",
    "enable_api_sql_runtime_identity",
)

_CAVEAT_MARKERS: tuple[str, ...] = (
    "do not",
    "don't",
    "must not",
    "not promise",
    "not claim",
    "forbidden",
    "too strong",
    "bootstrap",
    "runtime",
    "default false",
    "tb-1244",
    "tb-1245",
    "tb-903",
    "m-215",
    "honesty guard",
    "non-claim",
    "openai user",
    "≠",
)


@dataclass(frozen=True)
class ClaimPattern:
    pattern: re.Pattern[str]
    message: str


CLAIM_PATTERNS: tuple[ClaimPattern, ...] = (
    ClaimPattern(
        re.compile(
            r"\bproduction\b[^.\n]{0,60}\bapi\b[^.\n]{0,60}\b(?:sql|database)\b[^.\n]{0,60}\b"
            r"(?:is|uses?|runs?\s+with)\b[^.\n]{0,40}\b(?:least[-\s]privilege|non[-\s]db_owner)\b",
            re.IGNORECASE,
        ),
        "API request-path SQL may still use bootstrap MI until runtime split is wired (TB-1244).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:api|request[-\s]path)\b[^.\n]{0,60}\b(?:sql|database)\b[^.\n]{0,60}\b"
            r"(?:is|are)\b[^.\n]{0,40}\b(?:least[-\s]privilege|non[-\s]db_owner)\b"
            r"[^.\n]{0,40}\b(?:by\s+default|in\s+production)\b",
            re.IGNORECASE,
        ),
        "Do not claim least-privilege API SQL by default while runtime UAMI is off (TB-1244).",
    ),
    ClaimPattern(
        re.compile(
            r"\bprivate\s+endpoints?\b[^.\n]{0,80}\b(?:alone|by\s+themselves)\b[^.\n]{0,60}\b"
            r"(?:mean|means?|equal|equals?|guarantee)\b[^.\n]{0,40}\bprivate\s+data\s+plane\b",
            re.IGNORECASE,
        ),
        "Private endpoints alone do not equal private data plane — see TB-903 (TB-1244).",
    ),
    ClaimPattern(
        re.compile(
            r"\bprivate\s+endpoints?\b[^.\n]{0,80}\b(?:mean|means?|equal|equals?)\b[^.\n]{0,40}\b"
            r"(?:fully\s+)?private\b",
            re.IGNORECASE,
        ),
        "PE resources require public-network closure + VNet-integrated CA — not PE alone (TB-903).",
    ),
    ClaimPattern(
        re.compile(
            r"\b(?:azure\s+openai|aoai)\b[^.\n]{0,80}\b(?:contributor|owner)\b[^.\n]{0,60}\b"
            r"(?:is|are|as)\b[^.\n]{0,40}\b(?:intended|workload|production)\b[^.\n]{0,20}\brole\b",
            re.IGNORECASE,
        ),
        "Intended AOAI workload RBAC is Cognitive Services OpenAI User — not Contributor (TB-1244).",
    ),
    ClaimPattern(
        re.compile(
            r"\bcompromised\s+api\b[^.\n]{0,80}\bcannot\b[^.\n]{0,40}\b(?:ddl|schema)\b",
            re.IGNORECASE,
        ),
        "Compromised API may DDL while bootstrap privilege stays on request path (TB-1244).",
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
        "unsafe" in stripped
        or "forbid" in stripped
        or "too strong" in stripped
        or "intended fail" in stripped
        or "ci anchors" in stripped
    ):
        return True

    return False


def contract_violations(root: Path) -> list[str]:
    path = root / CONTRACT_REL

    if not path.is_file():
        return [
            f"{CONTRACT_REL.as_posix()}: missing Azure workload PE seam contract (TB-1244)."
        ]

    text = path.read_text(encoding="utf-8", errors="replace")
    violations: list[str] = []

    for marker in _missing_markers(text, REQUIRED_CONTRACT_MARKERS):
        violations.append(
            f"{CONTRACT_REL.as_posix()}: missing required honesty anchor {marker!r} (TB-1245)."
        )

    return violations


def terraform_anchor_violations(root: Path) -> list[str]:
    violations: list[str] = []
    variables_path = root / TF_VARIABLES_REL
    openai_path = root / TF_OPENAI_REL

    if not variables_path.is_file():
        violations.append(
            f"{TF_VARIABLES_REL.as_posix()}: missing enable_api_sql_runtime_identity anchor (TB-1245)."
        )
    else:
        variables_text = variables_path.read_text(encoding="utf-8", errors="replace")

        if "enable_api_sql_runtime_identity" not in variables_text:
            violations.append(
                f"{TF_VARIABLES_REL.as_posix()}: expected enable_api_sql_runtime_identity (TB-1245)."
            )

    if not openai_path.is_file():
        violations.append(
            f"{TF_OPENAI_REL.as_posix()}: missing AOAI role assignment anchor (TB-1245)."
        )
    else:
        openai_text = openai_path.read_text(encoding="utf-8", errors="replace")

        if "Cognitive Services OpenAI User" not in openai_text:
            violations.append(
                f"{TF_OPENAI_REL.as_posix()}: expected Cognitive Services OpenAI User assignment (TB-1245)."
            )

    return violations


def scan_doc_claims(root: Path, rel: Path) -> list[str]:
    path = root / rel

    if not path.is_file():
        return [f"{rel.as_posix()}: missing Azure workload PE seam honesty scan target."]

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


def azure_workload_privilege_escalation_seam_honesty_violations(root: Path) -> list[str]:
    violations: list[str] = []
    violations.extend(contract_violations(root))
    violations.extend(terraform_anchor_violations(root))

    for rel in DOCS_TO_SCAN:
        violations.extend(scan_doc_claims(root, rel))

    return violations


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--advisory", action="store_true")
    args = parser.parse_args(argv)

    violations = azure_workload_privilege_escalation_seam_honesty_violations(REPO_ROOT)

    if violations:
        label = "warnings" if args.advisory else "errors"
        print(
            "Azure workload privilege escalation seam honesty guard: FAIL "
            f"({label})",
            file=sys.stderr,
        )

        for violation in violations:
            print(f"  - {violation}", file=sys.stderr)

        return 0 if args.advisory else 1

    print("Azure workload privilege escalation seam honesty guard: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
