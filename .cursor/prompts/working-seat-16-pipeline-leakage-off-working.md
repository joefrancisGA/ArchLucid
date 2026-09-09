# WS-16 — Pipeline / platform leakage off the Working desk

Do not hide admin system-health for operators who need it. Do not rename TB-645 illegally. Admin routes may keep Service Bus probes.

## Goal

Working architecture/review/desk surfaces must not hero **pipeline stages**, Service Bus, RAG/DLQ, or extractor ZIP as the job. Activity may show progress as **review progress**, not CI stages. Technical details stay behind existing disclosures.

## Why

June leakage audit plus `pipelineStagesAriaLabel` / getting-started “Authority pipeline stages”. Paying desk still reads as an Azure job console.

## Context

- `docs/architecture/PRODUCT_UX_IMPLEMENTATION_LEAKAGE_AUDIT_2026_06_15.md` (directionally; Working chrome has moved)
- `architecture-review-vocabulary.ts` pipeline stages
- `getting-started-help-guide-content.ts`
- Review activity tab

## What to build

1. Working review activity / overview: customer vocabulary for progress.
2. Help getting-started Working path: no pipeline-stage teaching.
3. Vitest or copy guard: Working review-detail does not render the buyer pipeline-stages aria label as a hero.

## Acceptance criteria

- Working overview does not lead with pipeline chrome.
- Admin health unchanged.

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

