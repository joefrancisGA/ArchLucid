# LD-10 — Remaining ops leakage: health and intake are not Azure internals

**Do not fork LI-10 or WD-09** for primary-nav COGS/Service Bus/extractor ZIP moves already shipped. This file is **golden-path health banners and intake evidence copy that still teach how ArchLucid is built**.

## Goal

Working-mode start-review and degraded-health banners use architect-facing nouns (Review → Evidence → Decision). Redis, Service Bus, packager, extractor ZIP, and Fleet LLM COGS stay on Administration / diagnostics disclosures. Intake may still accept Azure evidence; it must not be the default *story*. LLM budget pill only when monitoring is active **and** the user can act.

## Why

LI-10 demoted vendor metrics from primary nav. Health/degraded banners can still name Redis/Service Bus on the daily path. Intake evidence step can still title itself as Azure extractor. Azure-first default (`cloudProvider: "Azure"` as the visible story) falsely narrows the job. A professional architect’s desk is not a vendor ops console.

## Context

- `docs/architecture/PRODUCT_UX_IMPLEMENTATION_LEAKAGE_AUDIT_2026_06_15.md`
- `docs/library/UI_DESIGN_SYSTEM.md` language table; **TB-645**
- Grep operator health banner copy: Redis, Service Bus, RAG, Packager, extractor
- Intake: `NewRunWizardClient.tsx`, `QuickReviewWizard.tsx`, evidence-step titles
- `archlucid-ui/src/components/llm/LlmBudgetStatusPill.tsx` / `shouldShowShellLlmBudgetStatusPill`
- `archlucid-ui/src/lib/operator/operator-system-admin-nav-group-builder.ts` — Fleet LLM COGS may stay under Administration
- System health `/administration` diagnostics — keep SRE strings there

## What to build

1. Golden-path health/degraded banners: “Review processing is delayed” (or equivalent) with technical probe names behind disclosure. Do not put Redis/Service Bus in the first line on Home or review-detail.
2. Intake evidence step: “Add evidence (optional)” — Azure extractor is one method, not the step title. Do not default the *visible* cloud story to Azure in Working (keep Azure as a selectable provider). Packager command only behind advanced disclosure.
3. LLM budget pill: only when monitoring is active **and** the user can act. Never as a header identity for every Execute+ user.
4. Vitest / i18n snapshot guards so Redis / Service Bus / Packager / extractor ZIP do not re-enter Working Home, review-detail chrome, or intake step titles.

## Acceptance criteria

- Working first-hour surfaces do not lead with extractor ZIP, packager, Service Bus, Redis, or AI budget.
- Admin/ops users who need those tools still reach them from Administration / Technical details.
- Azure evidence upload still works; it is not the only labeled door.
- No TB-645 run/job/manifest regression.

## Constraints

- Do not change API authorization.
- Do not collapse review workspace tabs.
- Do not implement custom policy-pack professional-services GTM.
- Do not hide Administration from roles that already have it.
