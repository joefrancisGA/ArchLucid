# RS-06 — The paying shell is not the ops console; demo is not the clean product

**Do not fork LI-10, WD-09, or LD-10** for remaining Redis/Service Bus *copy* on health/intake. This file is the leftover **inversion**: banners are **suppressed in demo/buyer-polish and shown in the real shell**.

## Goal

Working-mode golden path uses architect-facing degradation copy (“Review processing is delayed”) **without** teaching Azure probe names in the first viewport. Demo/buyer-polish must not be the only place those banners are hidden. Technical probe names stay behind disclosure. Administration / capability-gated ops keep COGS, RAG, DLQ. Intake may still accept Azure evidence; it is not the default *story*.

## Why

The June leakage audit: the product looks most enterprise-grade when a prospect is watching. `ServiceBusHealthBanner` `isServiceBusBannerSuppressed()` returns true for demo, static demo, **or** `isBuyerPolishedOperatorShellEnv()`. Production Working is none of those, so the paying architect gets the banner (copy is already “Review processing is delayed” — good) plus `technicalProbeDisclosure`: “Technical detail: azure_service_bus readiness probe” and a link to `/internal/health`. Prospects never see it. That inversion is the livelihood/identity bug.

## Context

- `archlucid-ui/src/components/governance/ServiceBusHealthBanner.tsx`
- `archlucid-ui/src/components/shell/AppShellStatusBanners.tsx`
- `archlucid-ui/src/lib/operator/operator-health-labels.ts` — `SERVICE_BUS_HEALTH_LABELS`
- `shouldShowShellLlmBudgetStatusPill` — already warn/critical only; keep
- `operator-system-admin-nav-group-builder.ts` — Fleet LLM COGS on admin
- `docs/architecture/PRODUCT_UX_IMPLEMENTATION_LEAKAGE_AUDIT_2026_06_15.md`
- LI-10 *What to build* item 4 — this is that residual

## What to build

1. Do **not** suppress the delayed-processing banner only in demo. Show it on live Working when processing is actually delayed. Keep architect copy. Probe name + `/internal/health` stay behind disclosure; SRE-facing `/internal/*` is not a primary recovery CTA for Execute+ architects who cannot act — prefer `/administration/system-health` if they have it, else “contact your administrator.”
2. Invert the old mental model in comments/tests: demo may **also** show delayed processing if the demo health payload is degraded; do not hide real delay from customers to make the demo prettier. If demo static health is always green, that is fine — do not special-case hide.
3. LLM budget pill: keep warn/critical + can-act. Never a header identity for every Execute+ user.
4. Vitest / i18n: Working primary chrome does not lead with extractor ZIP, packager, Service Bus product name, or Fleet LLM COGS. Probe string only in disclosure. Guard so buyer-polish is not the suppress flag for this banner.

## Acceptance criteria

- Paying Working users see delayed-processing when it is true; they do not see `azure_service_bus` until they open disclosure.
- Demo is not the only “clean” shell by hiding real degradation.
- Admin/ops users still reach COGS/RAG/DLQ from Administration.
- Azure evidence upload still works; it is not the only labeled intake door.
- No TB-645 run/job/manifest regression.

## Constraints

- Do not change API authorization.
- Do not collapse review workspace tabs.
- Do not implement custom policy-pack professional-services GTM.
