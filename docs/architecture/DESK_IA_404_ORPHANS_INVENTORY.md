> **Scope:** DI-002 — legacy URL and orphan list inventory for desk-IA wave. Shrink-only.

# Desk-IA 404 and orphan inventory

**Last reviewed:** 2026-09-12 · **ADR:** [0095](adrs/0095-sealed-record-governance-home.md)

| URL / surface | Prior behavior | Current behavior | Working nav |
| --- | --- | --- | --- |
| `/signed-records` | 404 parent | Permanent redirect → `/governance/sealed-records` | Governance + pilot |
| `/governance/signed-records` | N/A (canonical) | List index (200) | Governance + pilot |
| `/manifests/{id}` (legacy) | Mixed | Redirect to sealed-records detail | Via list |
| Decision register without package link | Orphan disposition | Cross-link to sealed list in Sources | Governance |
| Approval request `[id]` without parent | Lineage only | Lineage breadcrumb; parent detail residual (DI-017) | Governance |

**Do not claim:** six sponsor routes merged (DI-021); system breadcrumbs restored (DI-022).
