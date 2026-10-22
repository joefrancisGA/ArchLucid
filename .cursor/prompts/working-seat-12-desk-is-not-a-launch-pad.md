# WS-12 — Architecture desk is inhabited, not a launch pad

Do not collapse review-detail tabs into the desk. Do not merge kernels. Nested tool routes from SY stay.

## Goal

The Working architecture identity page shows **current working document** (draft fields or last seal delta) and **in-flight jobs** as the primary work, not a summary card whose only CTA is Start review. Start review remains available.

## Why

SY nested URLs; `ArchitectureIdentityDesk` is still header + rename + reviews table + Start review (`ArchitectureIdentityDesk.tsx`). Monday morning is still “go somewhere else.”

## Context

- `archlucid-ui/src/components/architecture/ArchitectureIdentityDesk.tsx`
- `ArchitectureIdentityDeskCurrentDraft.tsx`
- `ArchitectureIdentityDeskInFlightSection.tsx`
- ADR 0079

## What to build

1. Promote current draft / open questions / in-flight above the reviews table.
2. Primary action is **continue this architecture** (open draft or nested findings), not always Start review.
3. Vitest: desk still has Start review as secondary when a draft exists.

## Acceptance criteria

- Desk with a current draft does not look like an empty portfolio card.
- Review workspace tabs remain on the nested review route.

## Constraints

- Working-tree safety: run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** merge `DraftRequests` and `Runs`. **Do not** unseal sealed records.
- **Do not** rewrite ADR 0067, 0068, 0069, 0070, 0072, 0074, or 0077 bodies — Related pointers only. This wave **adds ADR 0080** and **Accepts 0078 / 0079**.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate. **Do not** add a 40th coverage engine or fake frontier transcripts.
- **Do not** invent per-architecture ACL, live presence avatars, or finding-comment chat (ADR 0037 workspace scope).
- **Do not** re-run SY-01–100, AO-01–50, CA-01–50, FC-01–80, PC-01–13, DR-01–16, DX, or PT overlay waves except as a named leftover. Implement only *What to build*.
- **Do not** ship `/al-ui-rate` buyer-walkthrough remediations onto Working production modules (WS-07). Guided / demo / trial remain eval seats.
- No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**.
- TB-645 vocabulary (architecture, review, finding, sealed review record). Sentence case. **TB-2005** form validation.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named here. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution build, no dev server unless this file says so.
- New ADRs need **Trade-offs**, **Constraints**, and **Expected impact** (include security). SQL stays in the single DDL file per database plus a numbered migration if schema changes.

