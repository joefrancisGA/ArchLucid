> **Scope:** Canonical buyer-facing ↔ technical vocabulary for the operator shell, product UI, and go-to-market collateral. This document does not rename HTTP contracts, CLI verbs, or audit journal identifiers.

# UI Glossary V1

**Single source of truth:** Linked from [`docs/library/operator-shell.md`](../library/operator-shell.md). Naming rules for writers: [`docs/library/CONCEPT_VOCABULARY.md`](../library/CONCEPT_VOCABULARY.md).

## Glossary table (verbatim — owner Q&A 2026-05-15)

| Buyer-facing UI | Technical / unchanged |
|----------------|----------------------|
| **Review** | Run, run ID, `ArchitectureRun`, API `/v1/architecture/run/...` |
| **Finalize review** / **Finalize** (when context clear) | Commit, `POST .../commit`, golden manifest persistence |
| **Architecture snapshot** / **Snapshot** | Manifest, golden manifest, `GoldenManifest` |
| **Evidence graph** | Knowledge graph internally; URL path `/graph` |

## Workflow copy (target wizard, review detail, exports)

**Capture system → Add evidence → Review → Resolve findings → Record decisions → Generate report**

Use **Architecture review** in headings and tooltips where **Review** alone would be ambiguous.

## Constraints (do not change without ADR)

- HTTP paths (`/v1/...`), OpenAPI titles, `openapi-v1.contract.snapshot.json`, CLI command names, durable audit `AuditEventTypes` names, and correlation-id documentation.
- React route paths remain unchanged unless a redirect is required (prefer label-only changes in the UI).
