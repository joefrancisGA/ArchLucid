# Working-seat wave close audit (WS-24)

> **Date:** 2026-09-07 (wave 19 — WS-01–WS-24)  
> **Owner decision:** Stop buyer polish on the **Working** seat. Guided / demo / trial keep eval chrome.  
> **Spine:** [ADR 0080](adrs/0080-working-seat-never-buyer-polished.md) · [WORKING_SEAT_COMPOSER_PROMPTS.md](WORKING_SEAT_COMPOSER_PROMPTS.md)

## Verdict

**Shipped** for Working production seats on this branch, subject to the residuals below. WS-05 (`resolveWorkingForbidsBuyerPolish`) and WS-08 (shrink-only eval grandfather ratchet) are green in Vitest without skipping architecture/review grandfather shrink.

Working **does not** mount BuyerChrome teaching strips on the architectures hub (`ArchitecturesHubBuyerChrome` returns null when `useProductionEvalChrome()` is false — guarded by `ArchitecturesHubBuyerChrome.working-eval-leakage.test.tsx`).

This audit does **not** claim DX density engines, FC validator rewrites, or insight-density gate closure.

## Evidence table

| Area | Prompts | Evidence | Status |
|------|---------|----------|--------|
| ADR contract | WS-01–03 | `docs/architecture/adrs/0080-working-seat-never-buyer-polished.md`; ADR 0078/0079 Accepted in index | Shipped |
| Eval leak inventory | WS-04 | `docs/architecture/WORKING_SEAT_EVAL_LEAK_INVENTORY.md` | Shipped |
| Working forbids eval chrome | WS-05 | `resolveWorkingForbidsBuyerPolish` in `production-desk-chrome.ts`; `production-desk-chrome.test.ts` | Shipped |
| Call-site sweep | WS-06 | Resolver-first mounts across architecture/review surfaces | Shipped |
| `/al-ui-rate` instrument brief | WS-07 | Command doc refuses buyer-walkthrough fixes on Working | Shipped |
| Eval grandfather shrink | WS-08 | `production-desk-chrome-eval-guard.test.ts`; architecture/review baseline frozen | Shipped |
| BuyerChrome hub gate | WS-09 | `ArchitecturesHubBuyerChrome` + working-eval-leakage test | Shipped |
| Expert hub loop | WS-10–12 | Desk continue CTA; no Working babysit; expert start | Shipped |
| Career defaults | WS-13–14 | Low-confidence default on Working; degraded coverage blocks finalize | Shipped |
| Continuity | WS-15–18 | Server-first draft persist; review-progress copy; background wait; idle form restore | Shipped |
| Open questions | WS-19 | Draft `openQuestions` field + desk preview; no finding-comment chat | Shipped |
| Help teaches Working | WS-20 | Working getting-started resolvers; sample recovery removed from live-tenant path | Shipped |
| Shortcut chips | WS-21 | `sidebar-nav-buyer-demo-collapse` skips Working architect chrome | Shipped |
| Working test fixtures | WS-22 | Default architecture/review tests mock eval chrome **false** | Shipped |
| Guided split ratchet | WS-23 | `resolveProductionEvalChrome` Guided true / Working false; `OPERATOR_UI_EXPERIENCE_MODES.md` | Shipped |

## Residuals (out of wave)

| Item | Tracking | Notes |
|------|----------|-------|
| Admin eval grandfather rows | WS-08 inventory | Shrink-only; new Working mounts need ADR exemption |
| DX density engines | DX backlog | Not closed by this wave |
| G-REAL-06 | GTM | Owner execution; not an engineering batch |
| CPA SOC 2 / third-party pen test | G-REAL-05 / G-ASSURANCE-02 | GTM owner programs (TB-135/TB-136 tech Done) |
| Cited analysis / promote same-tx / human-record leftovers | Wave 20 **LP-01–LP-20** | Chrome shipped; persist gates are [`LIVELIHOOD_PROOF_COMPOSER_PROMPTS.md`](LIVELIHOOD_PROOF_COMPOSER_PROMPTS.md) |

## Verification commands (focused)

```bash
cd archlucid-ui
npm run test -- --run \
  src/lib/production-desk-chrome.test.ts \
  src/lib/production-desk-chrome-eval-guard.test.ts \
  src/app/\(operator\)/architecture/architectures/_sections/ArchitecturesHubBuyerChrome.working-eval-leakage.test.tsx \
  src/lib/architecture/architecture-open-questions.test.ts \
  src/lib/getting-started-help-working-examples.test.ts \
  src/lib/sidebar-nav-buyer-demo-collapse.test.ts
```

```bash
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj \
  --filter 'FullyQualifiedName~DraftDocumentMutatorTests'
```

## Related

- [OPERATOR_UI_EXPERIENCE_MODES.md](../library/OPERATOR_UI_EXPERIENCE_MODES.md) — Working = product instrument; Guided = eval teaching
- [WORKING_SEAT_EVAL_LEAK_INVENTORY.md](WORKING_SEAT_EVAL_LEAK_INVENTORY.md) — leak priority list
- [LIVELIHOOD_PROOF_COMPOSER_PROMPTS.md](LIVELIHOOD_PROOF_COMPOSER_PROMPTS.md) — wave 20 persist gates (do not re-run WS)
