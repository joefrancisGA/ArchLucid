> **Scope:** Canonical buyer-facing ↔ technical vocabulary for the architect workspace, product UI, and go-to-market collateral. This document does not rename HTTP contracts, CLI verbs, or audit journal identifiers.

# UI Glossary V1

**Single source of truth:** Linked from [`docs/library/operator-shell.md`](../library/operator-shell.md). Naming rules for writers: [`docs/library/CONCEPT_VOCABULARY.md`](../library/CONCEPT_VOCABULARY.md). Doc audience routing: [`docs/library/DOCUMENTATION_BY_AUDIENCE.md`](../library/DOCUMENTATION_BY_AUDIENCE.md).

## Glossary table (verbatim — owner Q&A 2026-05-15)

| Buyer-facing UI | Technical / unchanged |
|----------------|----------------------|
| **Review** | Run, run ID, `ArchitectureRun`, API `/v1/architecture/run/...` |
| **Architecture package** | Review package (legacy UI noun), golden manifest / committed manifest — findings, evidence trail, signed decision record, and exports for one architecture review |
| **Finalize review** / **Finalize** (when context clear) | Commit, `POST .../commit`, architecture package persistence |
| **Architecture snapshot** / **Snapshot** | Point-in-time manifest slice inside a package; API type `GoldenManifest` where persisted |
| **Evidence graph** | Knowledge graph internally; URL path `/graph` |

## Persona terms (role nouns in UI copy)

Use the **Use** column for any new user-facing string that names a **person** or **role** (nav labels, headings, tooltips, empty states, help, banners, GTM). The **Review / Finalize / Architecture package** rows above still govern **workflow artifacts** — persona terms govern **who** the reader is, not what the review object is called.

**Do not use Operator as a public persona noun** outside Admin/Diagnostics internal surfaces. Code identifiers (`(operator)` route group, `runId`, `NEXT_PUBLIC_OPERATOR_EXPERIENCE`, hook names) stay unchanged.

| Use (buyer-facing persona) | Avoid (rejected in public copy) | When to use |
|----------------------------|-----------------------------------|-------------|
| **Architect** | **Operator**, "operator path", "operator shell", "pilot operator", "canonical operator" | Primary signed-in workspace: review intake, findings, graph/compare, home, help aimed at day-to-day architecture work. Prefer **Architect workspace** over legacy "operator shell" in labels. |
| **Executive** | **Operator** | Executive route group, sponsor reading mode, ROI/value summaries, cross-shell handoff from review detail. |
| **Sponsor** | **Operator** | Procurement-safe exports, email-to-sponsor flows, executive briefs — when the reader is the budget holder, not the practitioner. |
| **Admin** / **platform administrator** | **Operator**, "tenant operator" | Settings, integrations, extract upload, tenant configuration, platform-admin sidebar — authority and setup, not review execution. |
| **Reviewer** | **Operator**, "operators pick/submit/approve/run" | Someone inspecting findings, evidence, or an architecture package before a gate passes. |
| **Approver** | **Operator** | Explicit approval/disposition actions (approve, reject, waive) on governance gates. |
| **Governance lead** | **Operator**, "operator follow-up" | Policy violations, drift alerts, escalation copy — coordination across reviewers and approvers. |
| **Operator** (retain) | — (do not promote to marketing/home/nav) | **Internal-only:** Admin/Diagnostics routes, runbooks, env flags, contributor docs audience label, and diagnostics health signals. Not for customer-visible home, help, nav, or empty states. |

**Legacy phrase bans** (use architect/task vocabulary instead): "canonical guide" → **first-review guide**; "lane runbook" → **first-review guide** or in-product help link; "operator shell" / "operator path" → **architect workspace** / **complete review workflow**.

**Decision rule (quick):** architect-facing surface → **Architect** + task language (**Review**, **Finalize**); setup/config → **Admin**; governance workflow → **Reviewer** / **Approver** / **Governance lead**; reporting → **Executive** / **Sponsor**; diagnostics-only → **Operator** retained.

**Enforcement:** `archlucid-ui/src/lib/review-terminology-surfaces.ts` and `review-terminology-guard.test.ts` scan high-traffic UI modules for banned operator-persona phrases.

## Workflow copy (target wizard, review detail, exports)

**Capture system → Add evidence → Review → Resolve findings → Record decisions → Generate report**

Use **Architecture review** in headings and tooltips where **Review** alone would be ambiguous.

## Constraints (do not change without ADR)

- HTTP paths (`/v1/...`), OpenAPI titles, `openapi-v1.contract.snapshot.json`, CLI command names, durable audit `AuditEventTypes` names, and correlation-id documentation.
- React route paths remain unchanged unless a redirect is required (prefer label-only changes in the UI).
