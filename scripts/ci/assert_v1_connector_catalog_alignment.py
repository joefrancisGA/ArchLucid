"""
Ensure high-risk ITSM connector wording in INTEGRATION_CATALOG.md stays aligned with V1_SCOPE.md.

This guard targets known historical contradictions (ServiceNow / Jira inbound status sync).
Doc-to-code disagreement is an owner decision — this script only enforces doc-to-doc invariants.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

# Phrases that contradict V1_SCOPE §2.13 as of the ITSM bidirectional sync decision.
FORBIDDEN_CATALOG_PHRASES: tuple[str, ...] = (
    "SNOW→ArchLucid status sync **not** committed",
    "ServiceNow → ArchLucid status sync is **not** in committed **V1** scope",
)


def _read(rel: Path) -> str:
    path = REPO_ROOT / rel
    if not path.is_file():
        raise FileNotFoundError(path)
    return path.read_text(encoding="utf-8")


def main() -> int:
    catalog = _read(Path("docs/go-to-market/INTEGRATION_CATALOG.md"))
    scope = _read(Path("docs/library/V1_SCOPE.md"))

    snow_committed = bool(
        re.search(
            r"ServiceNow.*two-way.*committed\s+for\s+V1\s+GA",
            scope,
            flags=re.IGNORECASE | re.DOTALL,
        )
    )
    jira_committed = bool(
        re.search(
            r"Jira.*bi-?directional.*committed\s+for\s+V1\s+GA",
            scope,
            flags=re.IGNORECASE | re.DOTALL,
        )
    )

    if not (snow_committed and jira_committed):
        print(
            "ERROR: V1_SCOPE.md no longer documents committed V1 GA ITSM inbound sync for ServiceNow/Jira — "
            "update assert_v1_connector_catalog_alignment.py baseline or restore scope text.",
            file=sys.stderr,
        )
        return 2

    violations: list[str] = []
    for phrase in FORBIDDEN_CATALOG_PHRASES:
        if phrase in catalog:
            violations.append(phrase)

    if violations:
        print("ERROR: INTEGRATION_CATALOG.md contains forbidden ITSM status-sync phrases:", file=sys.stderr)
        for v in violations:
            print(f"  - {v}", file=sys.stderr)
        print(
            "Fix: align the catalog with docs/library/V1_SCOPE.md §2.13 (committed V1 GA inbound status sync).",
            file=sys.stderr,
        )
        return 1

    print("assert_v1_connector_catalog_alignment: OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
