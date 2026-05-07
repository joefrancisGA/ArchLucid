"""
Ensure high-risk ITSM connector wording stays aligned across canonical docs.

- Doc-to-doc: `docs/library/V1_SCOPE.md` §2.13 commitments must appear consistently in
  every Integration Catalog copy (source + procurement pack), and forbidden denial phrases
  must not appear in tracked operational docs.
- Doc-to-code: emits stderr notices only (never fails CI) when expected inbound-sync markers
  are missing — owner decides scope vs implementation; see `docs/PENDING_QUESTIONS.md`.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

V1_SCOPE_REL = Path("docs/library/V1_SCOPE.md")

PRIMARY_INTEGRATION_CATALOG_REL = Path("docs/go-to-market/INTEGRATION_CATALOG.md")

PROCUREMENT_PACK_INTEGRATION_CATALOG_REL = Path("dist/procurement-pack/INTEGRATION_CATALOG.md")

# Phrases that contradict committed V1 GA inbound status sync (historical drift).
FORBIDDEN_SCOPE_DENIAL_PHRASES: tuple[str, ...] = (
    "SNOW→ArchLucid status sync **not** committed",
    "ServiceNow → ArchLucid status sync is **not** in committed **V1** scope",
    "**Two-way** SNOW→ArchLucid status sync **not** committed unless owner promotes",
    "**Two-way** SNOW→ArchLucid status sync is **not** in committed V1 scope **unless**",
    "**Two-way** SNOW→ArchLucid status sync is **not** in committed **V1** scope",
    "**bi-directional** status sync **in V1** (may fast-follow)",
)

HIGH_RISK_DOC_RELS: tuple[Path, ...] = (
    Path("docs/PENDING_QUESTIONS.md"),
    Path("docs/go-to-market/INTEGRATION_CATALOG.md"),
    Path("dist/procurement-pack/INTEGRATION_CATALOG.md"),
    Path("docs/library/V1_SCOPE.md"),
    Path("docs/integrations/recipes/SERVICENOW_INCIDENT_VIA_POWER_AUTOMATE.md"),
    Path("docs/integrations/recipes/JIRA_ISSUE_VIA_POWER_AUTOMATE.md"),
    Path("templates/integrations/jira/jira-webhook-bridge-recipe.md"),
)

ITSM_INBOUND_SERVICE_REL = Path("ArchLucid.Application/Integrations/Itsm/ItsmInboundWebhookSyncService.cs")

# Catalog table rows must echo scope wording when scope commits both connectors.
_RE_SERVICENOW_ROW_COMMITTED = re.compile(
    r"\*\*Two-way\*\*\s+ServiceNow\s+→\s+ArchLucid\s+\*\*status-only\*\*\s+sync\s+is\s+\*\*committed\s+for\s+V1\s+GA\*\*",
    flags=re.IGNORECASE,
)
_RE_JIRA_ROW_COMMITTED = re.compile(
    r"\*\*bi-directional\*\*\s+Jira\s+→\s+ArchLucid\s+status\s+sync\s+is\s+\*\*committed\s+for\s+V1\s+GA\*\*",
    flags=re.IGNORECASE,
)

_RE_SCOPE_SERVICENOW_COMMITTED = re.compile(
    r"ServiceNow.*two-way\s+status\s+sync.*committed\s+for\s+V1\s+GA",
    flags=re.IGNORECASE | re.DOTALL,
)
_RE_SCOPE_JIRA_COMMITTED = re.compile(
    r"Jira.*bi-?directional\s+status\s+sync.*committed\s+for\s+V1\s+GA",
    flags=re.IGNORECASE | re.DOTALL,
)


class MissingRepoFileError(Exception):
    def __init__(self, rel_posix: str) -> None:
        super().__init__(rel_posix)
        self.rel_posix = rel_posix


def read_repo_text(repo_root: Path, rel: Path) -> str:
    path = repo_root / rel

    if not path.is_file():
        raise MissingRepoFileError(rel.as_posix())

    return path.read_text(encoding="utf-8")


def scope_commits_inbound_itsm_sync(scope_text: str) -> tuple[bool, bool]:
    snow = bool(_RE_SCOPE_SERVICENOW_COMMITTED.search(scope_text))
    jira = bool(_RE_SCOPE_JIRA_COMMITTED.search(scope_text))

    return snow, jira


def forbidden_denials_in_text(text: str) -> list[str]:
    hits: list[str] = []

    for phrase in FORBIDDEN_SCOPE_DENIAL_PHRASES:

        if phrase in text:
            hits.append(phrase)

    return hits


def catalog_committed_row_patterns_present(catalog_text: str) -> tuple[bool, bool]:
    return (
        bool(_RE_SERVICENOW_ROW_COMMITTED.search(catalog_text)),
        bool(_RE_JIRA_ROW_COMMITTED.search(catalog_text)),
    )


def validate_catalog_against_scope(scope_text: str, catalog_text: str, catalog_label: str) -> list[str]:
    errors: list[str] = []
    snow_scope, jira_scope = scope_commits_inbound_itsm_sync(scope_text)

    if not (snow_scope and jira_scope):
        errors.append(
            "V1_SCOPE.md no longer documents committed V1 GA ITSM inbound sync for ServiceNow/Jira — "
            "update this guard's expectations or restore §2.13 wording.",
        )

        return errors

    snow_cat, jira_cat = catalog_committed_row_patterns_present(catalog_text)

    if not snow_cat:
        errors.append(
            f"{catalog_label}: missing required ServiceNow row wording "
            "(**Two-way** ServiceNow → ArchLucid **status-only** sync is **committed for V1 GA**).",
        )

    if not jira_cat:
        errors.append(
            f"{catalog_label}: missing required Jira row wording "
            "(**bi-directional** Jira → ArchLucid status sync is **committed for V1 GA**).",
        )

    return errors


def scan_high_risk_docs_for_denials(repo_root: Path) -> list[tuple[str, str]]:
    violations: list[tuple[str, str]] = []

    for rel in HIGH_RISK_DOC_RELS:
        path = repo_root / rel

        if not path.is_file():
            continue

        text = path.read_text(encoding="utf-8")

        for phrase in forbidden_denials_in_text(text):
            violations.append((rel.as_posix(), phrase))

    return violations


def emit_doc_code_notice(repo_root: Path) -> None:
    """Warn-only: mismatches do not fail CI (owner decision via PENDING_QUESTIONS)."""
    svc = repo_root / ITSM_INBOUND_SERVICE_REL

    if not svc.is_file():
        print(
            "DOC_CODE_NOTICE: inbound ITSM sync service file missing — "
            f"expected `{ITSM_INBOUND_SERVICE_REL.as_posix()}`. "
            "If scope still commits inbound sync, record an owner decision in docs/PENDING_QUESTIONS.md.",
            file=sys.stderr,
        )

        return

    body = svc.read_text(encoding="utf-8")

    if "TryProcessServiceNowIncidentUpdateAsync" not in body or "TryProcessJiraIssueUpdateAsync" not in body:
        print(
            "DOC_CODE_NOTICE: ItsmInboundWebhookSyncService missing expected ServiceNow/Jira inbound handlers — "
            "verify implementation vs docs/library/V1_SCOPE.md §2.13; owner decision if scope or code must change.",
            file=sys.stderr,
        )


def run_alignment_checks(repo_root: Path, emit_doc_code: bool) -> tuple[int, list[str]]:
    messages: list[str] = []

    try:
        scope_text = read_repo_text(repo_root, V1_SCOPE_REL)
    except MissingRepoFileError as e:
        return 2, [f"Missing required file: {e.rel_posix}"]

    snow_scope, jira_scope = scope_commits_inbound_itsm_sync(scope_text)

    if not (snow_scope and jira_scope):
        return (
            2,
            [
                "ERROR: V1_SCOPE.md no longer documents committed V1 GA ITSM inbound sync for "
                "ServiceNow/Jira — update guard expectations or restore §2.13 text.",
            ],
        )

    exit_code = 0

    mandatory_catalog = repo_root / PRIMARY_INTEGRATION_CATALOG_REL

    if not mandatory_catalog.is_file():
        return 2, [f"Missing required file: {PRIMARY_INTEGRATION_CATALOG_REL.as_posix()}"]

    catalog_pairs: list[tuple[Path, str]] = [
        (PRIMARY_INTEGRATION_CATALOG_REL, mandatory_catalog.read_text(encoding="utf-8")),
    ]

    procurement_catalog = repo_root / PROCUREMENT_PACK_INTEGRATION_CATALOG_REL

    if procurement_catalog.is_file():
        catalog_pairs.append(
            (PROCUREMENT_PACK_INTEGRATION_CATALOG_REL, procurement_catalog.read_text(encoding="utf-8")),
        )

    for rel, catalog_text in catalog_pairs:
        errs = validate_catalog_against_scope(scope_text, catalog_text, rel.as_posix())

        if errs:
            exit_code = 1

            for e in errs:
                messages.append(e)

    violations = scan_high_risk_docs_for_denials(repo_root)

    if violations:
        exit_code = 1
        messages.append("ERROR: forbidden ITSM scope-denial phrases found:")
        for path_posix, phrase in violations:
            messages.append(f"  - {path_posix}: {phrase}")
        messages.append(
            "Fix: align with docs/library/V1_SCOPE.md §2.13 and *Resolved 2026-05-06 (ITSM bidirectional sync "
            "— both connectors)* in docs/PENDING_QUESTIONS.md.",
        )

    if emit_doc_code and exit_code == 0:
        emit_doc_code_notice(repo_root)

    return exit_code, messages


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--no-doc-code-notice",
        action="store_true",
        help="Skip stderr notices when implementation markers look missing (tests default).",
    )
    ns = parser.parse_args(argv)
    emit_doc_code = not ns.no_doc_code_notice

    code, msgs = run_alignment_checks(REPO_ROOT, emit_doc_code=emit_doc_code)

    for line in msgs:
        target = (
            sys.stderr
            if line.startswith("ERROR:")
            or line.startswith("  - ")
            or line.startswith("Fix:")
            else sys.stdout
        )

        print(line, file=target)

    if code == 0:
        print("assert_v1_connector_catalog_alignment: OK")

    return code


if __name__ == "__main__":
    raise SystemExit(main())
