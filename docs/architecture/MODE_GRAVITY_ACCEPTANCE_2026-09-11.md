> **Scope:** Contributor-reference — wave 27 (MG-001–MG-024) close-audit evidence for **one Working execute gravity** vs chrome density. Not buyer-facing copy.

# Mode-gravity wave close audit (MG-024)

> **Date:** 2026-09-11 (wave 27 — MG-001–MG-024)  
> **Owner decision:** Working production has **one execute gravity** (Career default per 0091); `NEXT_PUBLIC_OPERATOR_EXPERIENCE` is **density not Mode**; Guided/demo/trial remain eval; host `AgentExecution:Mode` default stays **Simulator** (no G-REAL-06).  
> **Spine:** [ADR 0094](adrs/0094-working-one-execute-gravity.md) · [ADR 0091](adrs/0091-career-is-working-default-day.md) · [`.cursor/prompts/mode-gravity-00-index.md`](../../.cursor/prompts/mode-gravity-00-index.md) · [MODE_GRAVITY_COMPOSER_PROMPTS.md](MODE_GRAVITY_COMPOSER_PROMPTS.md)

## Verdict

**Shipped** on this branch for Working production seats, subject to the residuals below. Working **eval chrome remains false**. Two customer controls: workspace mode vs Career/Rehearsal door. Operator-experience is not treated as execute Mode. Guided/demo/trial still use eval chrome. Host `AgentExecution:Mode` default is unchanged. ADR **0094** (**Accepted** 2026-09-12) authors policy; MG wave wiring implements the decision.

This audit does **not** claim G-REAL-06 Real-mode default, flag deletion, CPA SOC 2 (**G-REAL-05**), third-party pen-test publication (**G-ASSURANCE-02**), or live GTM cohorts (**M-90 / M-44 / M-91 / M-92**).

## Done tests (owner checklist)

| # | Done test | Shipped? | Evidence |
|---|-----------|----------|----------|
| 1 | Working `resolveProductionEvalChrome` false on production | **Yes** | `production-desk-chrome.test.ts`; `mode-gravity-working-eval-chrome-ratchet.test.ts` |
| 2 | Door ≠ workspace mode (two controls) | **Yes** | `mode-gravity-chooser-vs-workspace-mode-copy.ts`; `mode-gravity-preferences-two-controls-copy.ts` |
| 3 | Operator-experience not execute Mode | **Yes** | `mode-gravity-operator-experience-not-gravity.test.ts`; `OPERATOR_UI_EXPERIENCE_MODES.md` cites 0094 |
| 4 | Guided/demo/trial still eval | **Yes** | `mode-gravity-demo-trial-eval-ratchet.test.ts`; `working-career-rehearsal-guided-split.test.ts` |
| 5 | Host `AgentExecution:Mode` default unchanged | **Yes** | `mode-gravity-adr-guard.test.ts`; `mode-gravity-out-of-wave-residuals.test.ts` (MG-014) |

## Cluster evidence

| Cluster | Prompts | Shipped? | Primary evidence | Residual |
|---------|---------|----------|------------------|----------|
| Kernel ADR + inventory + story | MG-001–012 | **Yes** | ADR 0094 (**Accepted**); `mode-gravity-adr-guard.test.ts`; `MODE_GRAVITY_EXPERIENCE_FLAGS_INVENTORY.md` | — |
| Skips / ratchets / close | MG-013–024 | **Yes** | `mode-gravity-prompt-inventory.test.ts`; this file | Flags still exist for engineers |

## Prompt inventory

All **24** paste-ready files under `.cursor/prompts/mode-gravity-*.md` plus `mode-gravity-00-index.md` are present. Vitest ratchet: `archlucid-ui/src/lib/mode-gravity-prompt-inventory.test.ts`.

## Residuals (out of wave / successor waves)

| Item | Tracking | Notes |
|------|----------|-------|
| Delete Guided | **MG-013** | Explicit skip — Guided stays |
| G-REAL-06 Real-mode default host config | GTM | **MG-014** explicit skip |
| Collapse env flags to one knob | Product backlog | Inventory shrink-only |
| Desk IA / sealed-record home | **DI** wave | Successor prompts |
| Cheap what-if / draft-diff Compare | **CE** / **SN** waves | Successor prompts |
| CPA SOC 2 / third-party pen test | G-REAL-05 / G-ASSURANCE-02 | TB-135/TB-136 tech Done; GTM owner work open |
| Insight density / `DeterministicInsightDensityGate` | DX backlog | No 40th engine |

## Do not claim

- **Guided** was deleted or merged into Working.
- **G-REAL-06** executed or host `AgentExecution:Mode` default moved to Real.
- **Operator-experience** flag was removed from engineer local dev.
- **Insight density** engines closed or a 40th coverage engine added.
- **CPA SOC 2** attestation or published third-party pen test.
- **Live first review** cohort (**M-90**) or procurement rehearsal (**M-91**) ran.

## Verification commands (focused)

```bash
cd archlucid-ui
npm run test -- --run \
  src/lib/mode-gravity-prompt-inventory.test.ts \
  src/lib/mode-gravity-close-audit.test.ts \
  src/lib/mode-gravity-adr-guard.test.ts \
  src/lib/mode-gravity-experience-flags-inventory.test.ts \
  src/lib/mode-gravity-out-of-wave-residuals.test.ts \
  src/lib/mode-gravity-demo-trial-eval-ratchet.test.ts \
  src/lib/mode-gravity-working-eval-chrome-ratchet.test.ts \
  src/lib/mode-gravity-help-route.test.ts
```
