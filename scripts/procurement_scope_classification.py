#!/usr/bin/env python3
"""
Explicit deferred-scope classification for procurement pack deal-ready output.

Classifications (buyer-safe vocabulary):
  V1_READY, BLOCKING, DEFERRED_SCOPE, OWNER_REQUIRED, INFORMATIONAL_B_ONLY
"""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

SCOPE_V1_READY = "V1_READY"
SCOPE_BLOCKING = "BLOCKING"
SCOPE_DEFERRED_SCOPE = "DEFERRED_SCOPE"
SCOPE_OWNER_REQUIRED = "OWNER_REQUIRED"
SCOPE_INFORMATIONAL_B_ONLY = "INFORMATIONAL_B_ONLY"

SCOPE_CLASSIFICATIONS: tuple[str, ...] = (
    SCOPE_V1_READY,
    SCOPE_BLOCKING,
    SCOPE_DEFERRED_SCOPE,
    SCOPE_OWNER_REQUIRED,
    SCOPE_INFORMATIONAL_B_ONLY,
)

# Catalog rows are always emitted in deal-ready mode so reviewers see deferred vs blocking explicitly.
PROCUREMENT_SCOPE_CATALOG: tuple[dict[str, str], ...] = (
    {
        "id": "soc2-cpa-report",
        "label": "SOC 2 Type II CPA examination report",
        "classification": SCOPE_DEFERRED_SCOPE,
        "buyer_safe_explanation": (
            "Not issued for V1; self-assessment and roadmap documents describe honest posture "
            "without implying an independent CPA opinion is available."
        ),
        "source_doc": "docs/go-to-market/SOC2_STATUS_PROCUREMENT.md",
    },
    {
        "id": "third-party-pen-test-publication",
        "label": "Third-party penetration test publication",
        "classification": SCOPE_DEFERRED_SCOPE,
        "buyer_safe_explanation": (
            "External assessor deliverables and Trust Center publication are V2; V1 relies on "
            "owner-conducted testing documented in assurance materials."
        ),
        "source_doc": "docs/go-to-market/CURRENT_ASSURANCE_POSTURE.md",
    },
    {
        "id": "public-reference-customer",
        "label": "Public reference customer and published case study",
        "classification": SCOPE_INFORMATIONAL_B_ONLY,
        "buyer_safe_explanation": (
            "Not required for V1 GA; reference-customer tables may show Placeholder status. "
            "Treat as market-motion realism under (B), not a V1 product blocker."
        ),
        "source_doc": "docs/library/V1_DEFERRED.md",
    },
    {
        "id": "live-marketplace-checkout",
        "label": "Live marketplace checkout and self-serve commerce",
        "classification": SCOPE_OWNER_REQUIRED,
        "buyer_safe_explanation": (
            "Sales-led conversion and test-mode evidence may ship in V1; live checkout remains "
            "an owner-controlled commercial action outside default V1 pilot proof."
        ),
        "source_doc": "docs/library/V1_DEFERRED.md",
    },
    {
        "id": "mcp-membrane",
        "label": "Inbound MCP tool membrane",
        "classification": SCOPE_DEFERRED_SCOPE,
        "buyer_safe_explanation": (
            "MCP is a V1.1 integration surface; V1 pilots use REST, CLI, and the operator UI."
        ),
        "source_doc": "docs/library/V1_DEFERRED.md",
    },
    {
        "id": "v1-1-connectors",
        "label": "First-party V1.1 connectors (Jira, ServiceNow, Confluence, Slack, Teams, CloudEvents)",
        "classification": SCOPE_DEFERRED_SCOPE,
        "buyer_safe_explanation": (
            "V1.1 connector catalog items are not required on the first-pilot path; workflow handoff "
            "uses GitHub or Azure DevOps attachments without ITSM/chat connectors."
        ),
        "source_doc": "docs/library/V1_SCOPE.md",
    },
)

_DEAL_READY_REQUIRED_DOCS: tuple[str, ...] = (
    "docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md",
    "docs/go-to-market/TRUST_CENTER.md",
    "docs/go-to-market/SOC2_STATUS_PROCUREMENT.md",
    "docs/go-to-market/CURRENT_ASSURANCE_POSTURE.md",
    "docs/go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md",
)


def catalog_row_to_classification_row(entry: dict[str, str]) -> dict[str, object]:
    return {
        "id": entry["id"],
        "label": entry["label"],
        "classification": entry["classification"],
        "buyer_safe_explanation": entry["buyer_safe_explanation"],
        "source_doc": entry["source_doc"],
        "detail": "",
    }


def classify_violation_scope(violation: str) -> str:
    """Map a deal-ready violation string to an explicit scope classification."""
    lowered = violation.lower()

    if "missing required deal-ready doc" in lowered or "missing canonical source" in lowered:
        return SCOPE_BLOCKING

    if "implies" in lowered or "placeholder" in lowered:
        return SCOPE_BLOCKING

    if "missing **last reviewed:**" in lowered or "missing artifact_status" in lowered:
        return SCOPE_BLOCKING

    if "security@archlucid.net" in lowered:
        return SCOPE_BLOCKING

    if "last reviewed is" in lowered and "days old" in lowered:
        return SCOPE_DEFERRED_SCOPE

    return SCOPE_BLOCKING


def violation_to_classification_row(violation: str) -> dict[str, object]:
    classification = classify_violation_scope(violation)
    source_doc = ""

    if "docs/" in violation:
        fragment = violation.split(":", 1)[0].strip()
        if fragment.startswith("docs/"):
            source_doc = fragment

    return {
        "id": f"violation-{hash(violation) & 0xFFFFFF:06x}",
        "label": violation[:120] + ("..." if len(violation) > 120 else ""),
        "classification": classification,
        "buyer_safe_explanation": (
            "Stale assurance review cadence is documented separately; does not imply V1 product failure."
            if classification == SCOPE_DEFERRED_SCOPE
            else "Repair before buyer distribution or sponsor handoff."
        ),
        "source_doc": source_doc,
        "detail": violation,
    }


def build_v1_ready_rows(root: Path, violations: list[str]) -> list[dict[str, object]]:
    """Emit V1_READY rows for required deal-ready docs that are present and not blocking."""
    blocking_paths = {
        part
        for violation in violations
        if classify_violation_scope(violation) == SCOPE_BLOCKING
        for part in (violation.split(":", 1)[0].strip(),)
        if part.startswith("docs/")
    }

    rows: list[dict[str, object]] = []

    for rel in _DEAL_READY_REQUIRED_DOCS:
        path = root / rel

        if not path.is_file():
            continue

        if rel in blocking_paths:
            continue

        rows.append(
            {
                "id": f"v1-ready-{rel.replace('/', '-').replace('.', '-')}",
                "label": f"Required V1 assurance doc present: {rel}",
                "classification": SCOPE_V1_READY,
                "buyer_safe_explanation": "Source file exists and is not listed as a blocking deal-ready defect.",
                "source_doc": rel,
                "detail": "",
            },
        )

    return rows


def build_scope_classification_rows(
    root: Path,
    violations: list[str],
    *,
    include_catalog: bool = True,
) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []

    if include_catalog:
        rows.extend(catalog_row_to_classification_row(entry) for entry in PROCUREMENT_SCOPE_CATALOG)

    rows.extend(violation_to_classification_row(v) for v in violations)
    rows.extend(build_v1_ready_rows(root, violations))

    return rows


def summarize_scope_classifications(rows: list[dict[str, object]]) -> dict[str, int]:
    counts = {key: 0 for key in SCOPE_CLASSIFICATIONS}

    for row in rows:
        classification = str(row.get("classification", ""))

        if classification in counts:
            counts[classification] += 1

    return counts


def format_scope_classification_markdown(rows: list[dict[str, object]]) -> str:
    counts = summarize_scope_classifications(rows)
    lines = [
        "# Procurement deal-ready scope classification",
        "",
        "Explicit **V1_READY**, **BLOCKING**, **DEFERRED_SCOPE**, **OWNER_REQUIRED**, and "
        "**INFORMATIONAL_B_ONLY** rows for procurement reviewers. Deferred and (B)-only items "
        "**do not** fail deal-ready PASS by themselves.",
        "",
        "| Classification | Count |",
        "| --- | --- |",
    ]

    for key in SCOPE_CLASSIFICATIONS:
        lines.append(f"| **{key}** | {counts.get(key, 0)} |")

    lines.extend(
        [
            "",
            "| Classification | Item | Buyer-safe explanation | Source doc | Detail |",
            "| --- | --- | --- | --- | --- |",
        ],
    )

    for row in rows:
        label = str(row.get("label", "")).replace("|", "\\|")
        explanation = str(row.get("buyer_safe_explanation", "")).replace("|", "\\|")
        source = str(row.get("source_doc", "")).replace("|", "\\|")
        detail = str(row.get("detail", "")).replace("|", "\\|")
        classification = str(row.get("classification", ""))
        source_cell = f"`{source}`" if source else "—"
        detail_cell = detail if detail else "—"
        lines.append(
            f"| **{classification}** | {label} | {explanation} | {source_cell} | {detail_cell} |",
        )

    lines.append("")
    return "\n".join(lines)


def write_scope_classification_markdown(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(format_scope_classification_markdown(rows), encoding="utf-8")
