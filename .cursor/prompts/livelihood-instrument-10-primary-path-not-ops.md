# LI-10 — Daily-driver path is Review → Evidence → Decision, not Azure ops

**WD-09 is unique — implement that residual here.** Do not hide Administration from roles that already have it; demote ops from **primary** Working chrome.

## Goal

Working-mode primary nav, start-review, and header do not teach **how ArchLucid is built**. Extractor ZIP, packager command, Service Bus, RAG freshness, Fleet LLM COGS, and AI-budget pills leave the architect’s first viewport. They remain on Administration / capability-gated ops surfaces. Intake may still accept Azure evidence; it must not be the default *story*.

## Why

A professional architect’s desk is Review → Evidence → Decision → Sealed record → Audit. Queues, indexes, and budgets belong behind admin capability. `operator-system-admin-nav-group-builder.ts` still labels **Fleet LLM COGS**. Azure-first intake copy (`cloudProvider: "Azure"` as the visible default story) falsely narrows the job. Health banners that name Redis/Service Bus on the golden path leak implementation.

## Context

- `archlucid-ui/src/lib/operator/operator-nav-labels.ts` / i18n pipeline and health strings
- `archlucid-ui/src/lib/operator/operator-system-admin-nav-group-builder.ts`
- Intake: `NewRunWizardClient.tsx`, `QuickReviewWizard.tsx`
- `archlucid-ui/src/components/llm/LlmBudgetStatusPill.tsx` / `shouldShowShellLlmBudgetStatusPill`
- Grep Service Bus, RAG health, Fleet LLM COGS, Integration DLQ, Packager
- `docs/library/UI_DESIGN_SYSTEM.md` language table; **TB-645**
- `docs/architecture/PRODUCT_UX_IMPLEMENTATION_LEAKAGE_AUDIT_2026_06_15.md`

## What to build

1. Working primary nav labels/tooltips: outcome nouns (Start review, Reviews, Evidence, Findings, Compare). Move Service Bus / RAG / COGS / DLQ / trial-funnel to Administration or drop from customer nav if they are vendor metrics.
2. LLM budget pill: only when monitoring is active **and** the user can act. Never as a header identity for every Execute+ user.
3. Intake evidence step: “Add evidence (optional)” — Azure extractor is one method, not the step title. Do not default the *visible* cloud story to Azure in Working (keep Azure as a selectable provider). Packager command only behind advanced disclosure.
4. Health/degraded banners: architect-facing copy (“Review processing is delayed”) with technical probe names behind disclosure. Keep SRE strings for `/administration` diagnostics.
5. Vitest / i18n snapshot guards so Service Bus / Packager / extractor ZIP / Fleet LLM COGS do not re-enter Working primary chrome.

## Acceptance criteria

- Working first-hour surfaces do not lead with extractor ZIP, packager, Service Bus, or AI budget.
- Admin/ops users who need those tools still reach them from Administration.
- Azure evidence upload still works; it is not the only labeled door.
- No TB-645 run/job/manifest regression.

## Constraints

- Do not change API authorization.
- Do not collapse review workspace tabs.
- Do not implement custom policy-pack professional-services GTM.
