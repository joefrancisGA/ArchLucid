> **Scope:** Wave 30 (DW-001–DW-024) close-audit evidence for Career Real async execute honesty.

# Daytime-wait wave close audit (DW-024)

> **Date:** 2026-09-12 (wave 30 — DW-001–DW-024)  
> **Owner decision:** ADR **0096 Accepted** — Career Real execute never owns the tab; operations poll only; no fake percentComplete; Working never **stay on this page**.  
> **Spine:** [ADR 0096](adrs/0096-career-real-never-owns-the-tab.md) · [`.cursor/prompts/daytime-wait-00-index.md`](../../.cursor/prompts/daytime-wait-00-index.md)

## Verdict

**Shipped** on this branch for Working production seats. Ratchets guard against run-progress URLs and percentComplete in client trees. Help documents background wait and proxy timeout honesty.

This audit does **not** claim G-REAL-06 fleet-wide Real execute, CPA SOC 2, or live GTM cohorts.

## Done tests

| # | Done test | Shipped? | Evidence |
|---|-----------|----------|----------|
| 1 | ADR 0096 Accepted | **Yes** | `0096-career-real-never-owns-the-tab.md` |
| 2 | Operations poll inventory | **Yes** | `daytime-wait-operations-poll-inventory.ts` |
| 3 | Working not stay-on-page | **Yes** | `daytime-wait-never-stay-on-page-working.test.ts` |
| 4 | No run progress URL | **Yes** | `daytime-wait-no-run-progress-url-ratchet.test.ts` |
| 5 | No fake percentComplete | **Yes** | `daytime-wait-no-fake-percent-complete-ratchet.test.ts` |

## Verification

```bash
cd archlucid-ui
npm run test -- --run \
  src/lib/daytime-wait-prompt-inventory.test.ts \
  src/lib/daytime-wait-adr-guard.test.ts \
  src/lib/daytime-wait-close-audit.test.ts
```
