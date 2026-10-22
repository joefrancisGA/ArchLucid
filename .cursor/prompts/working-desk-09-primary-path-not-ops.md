# WD-09 — Daily-driver path is Review → Evidence → Decision, not Azure ops

## Goal

Working-mode primary nav, start-review, and header do not teach **how ArchLucid is built**. Extractor ZIP, packager command, Service Bus, RAG freshness, Fleet LLM COGS, and AI-budget pills leave the architect’s first viewport. They remain on Administration / capability-gated ops surfaces. Intake may still accept Azure evidence; it must not be the default *story*.

## Why

`docs/architecture/PRODUCT_UX_IMPLEMENTATION_LEAKAGE_AUDIT_2026_06_15.md`: polish was gated on selling; the daily-driver path leaked platform mechanics. A professional architect’s desk is Review → Evidence → Decision → Sealed record → Audit. Queues, indexes, and budgets belong behind admin capability. Azure-first copy also falsely narrows the job.

## Context

- `archlucid-ui/src/lib/operator/operator-nav-labels.ts` / i18n pipeline and health strings
- Intake: `NewRunWizardClient.tsx`, `QuickReviewWizard.tsx` (`cloudProvider: "Azure"`), evidence-step copy
- `archlucid-ui/src/components/llm/LlmBudgetStatusPill.tsx` / `shouldShowShellLlmBudgetStatusPill`
- `SERVICE_BUS_HEALTH_LABELS` and Analysis-group tooltips (grep Service Bus, RAG health, Fleet LLM COGS, Integration DLQ)
- `docs/library/UI_DESIGN_SYSTEM.md` language table; **TB-645** vocabulary
- Nav group builders under `archlucid-ui/src/lib/*-nav-group-builder.ts`

## What to build

1. Working primary nav labels/tooltips: outcome nouns (Start review, Reviews, Evidence, Findings, Compare). Move Service Bus / RAG / COGS / DLQ / trial-funnel to Administration or drop from customer nav if they are vendor metrics.
2. LLM budget pill: only when monitoring is active **and** the user can act (existing `shouldShowShellLlmBudgetStatusPill` intent). Never as a header identity for every Execute+ user. Add glossary/help target if it remains visible.
3. Intake evidence step: “Add evidence (optional)” — Azure extractor is one method, not the step title. Do not default the *visible* cloud story to Azure in Working (keep Azure as a selectable provider). Do not mention Packager command on the happy path; disclosure for advanced.
4. Health/degraded banners: architect-facing copy (“Review processing is delayed”) with technical probe names behind disclosure. Keep SRE strings for `/administration` diagnostics.
5. Vitest / i18n snapshot guards so Service Bus / Packager / extractor ZIP do not re-enter Working primary chrome. Vocabulary pass stays TB-645 (no run/job/manifest regression).

## Acceptance criteria

- Working first-hour surfaces do not lead with extractor ZIP, packager, Service Bus, or AI budget.
- Admin/ops users who need those tools still reach them from Administration.
- Azure evidence upload still works; it is not the only labeled door.
- Guided/demo may keep simpler eval copy; they must not re-introduce jargon TB-645 banned.

## Constraints

- Do not change API authorization or hide ops routes from roles that already have them — demote from **primary** chrome.
- Do not collapse review workspace tabs.
- Do not implement custom policy-pack professional-services GTM.
