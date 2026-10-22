> **Scope:** Contributor-reference — wave 31 (RP-001–RP-024) close-audit evidence for **Record / Practice** user-facing labels.

# Record-practice wave close audit (RP-024)

> **Date:** 2026-09-12 (wave 31 — RP-001–RP-024)  
> **Owner decision:** Working chrome uses **Record** and **Practice**; stored tokens stay `career` / `rehearsal`. ADR **0097** (**Accepted**).  
> **Spine:** [ADR 0097](adrs/0097-record-and-practice-user-facing-labels.md) · [`.cursor/prompts/record-practice-00-index.md`](../../.cursor/prompts/record-practice-00-index.md)

## Verdict

**Shipped** on this branch. Working top bar shows Record | Practice. User-visible **Career blocked** / **Career door blocked** removed from outbound and blocked dialogs. Host Mode default unchanged. Honesty gates unchanged.

## Done tests

| # | Done test | Shipped? | Evidence |
|---|-----------|----------|----------|
| 1 | Top bar Record \| Practice | **Yes** | `working-career-rehearsal-door-copy.ts`; `record-practice-adr-guard.test.ts` |
| 2 | No Career blocked on Working chrome | **Yes** | `working-career-door-gate-copy.ts`; outbound presenters |
| 3 | Help / CLI Record / Practice | **Yes** | `working-career-rehearsal-help-guide-content.ts`; `TryCommandHelp.cs` |
| 4 | Stored tokens unchanged | **Yes** | `record-practice-adr-guard.test.ts` |
| 5 | Simulator finalize still blocked | **Yes** | `run-status-badge-career-honesty.ts`; CG ratchets |

## Residuals

| Item | Notes |
|------|-------|
| G-REAL-06 | Host Mode default stays Simulator |
| ADR 0078 filename | `career-artifact` engineering family |
| Engineering test families | `CareerGravityCg*` class names (RP-023) |

## Verification

```bash
cd archlucid-ui
npm run test -- --run \
  src/lib/record-practice-prompt-inventory.test.ts \
  src/lib/record-practice-adr-guard.test.ts \
  src/lib/record-practice-close-audit.test.ts \
  src/lib/record-practice-user-copy-inventory.test.ts
```
