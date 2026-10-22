> **Scope:** Close audit — inhabit remain leftovers (**IR-001–IR-018**). Internal engineering only. **Not wave 35.**

# Inhabit remain acceptance — 2026-09-13

**Wave:** remain pack after inhabit wave 34 (**IH-001–IH-080**). **ADR:** [0100](adrs/0100-working-inhabit-architecture-findings-document.md) (Accepted). **Index:** [`.cursor/prompts/inhabit-remain-00-index.md`](../../.cursor/prompts/inhabit-remain-00-index.md). **Leak truth:** [`INHABIT_LEAK_INVENTORIES.md`](INHABIT_LEAK_INVENTORIES.md) / `archlucid-ui/src/lib/inhabit-leak-inventories.ts`.

## Executive summary

**IR-001–IR-014 product rows are shipped.** **IR-015** documents an intentional skip (peer `/governance/findings` stays peer). **IR-016** inventories and markdown match TypeScript. **IR-017** prompt-file ratchet is green. **Wave 35 is not started.** **G-REAL-06 is not shipped.**

| Cluster | Prompts | Status |
| --- | --- | --- |
| Ready / completeness honesty | IR-001 | **Shipped** |
| Dual-spine / first-week teaching | IR-002, IR-003 | **Shipped** |
| Document / dual-place | IR-004, IR-005 | **Shipped** |
| Reversibility | IR-006, IR-007 | **Shipped** |
| Keyboard | IR-008, IR-009 | **Shipped** |
| Continuity | IR-010, IR-011 | **Shipped** |
| Room / projector | IR-012, IR-013 | **Shipped** |
| Exploration ceremony | IR-014 | **Shipped** |
| Skip peer queue | IR-015 | **Skip** (documented) |
| Inventory ratchet | IR-016 | **Shipped** |
| Prompt inventory Vitest | IR-017 | **Shipped** |
| Close audit | IR-018 | **This document** |

## Product shipped (IR-001–IR-014)

| IR | Summary |
| --- | --- |
| **001** | Run-progress Ready chrome names quiet engines |
| **002** | Core-pilot steps inhabit-first (architecture desk, not pipeline hero) |
| **003** | First-review guide inhabit-first |
| **004** | Working inspect carries `architectureId` into nested findings focus |
| **005** | Quick-decision workspace cards architecture-known |
| **006** | Disposition history on governance finding row |
| **007** | Disposition history on queue triage panel |
| **008** | Finding card shortcuts default-focus first finding |
| **009** | Palette host default-focus first finding |
| **010** | Continue-last review package architecture-shaped |
| **011** | Favorite review pins architecture-shaped |
| **012** | Presenter elicitation deep-links to inhabited findings room |
| **013** | Draft room header uses inhabited findings room; L0 pre-spawn only |
| **014** | Spawn-lock handoff offers committed Compare (no draft-diff) |

## Intentional skip (IR-015)

| Surface | Why it stays |
| --- | --- |
| `/governance/findings?runId=` | Run-scoped **peer** queue — `architectureIdKnown: false` is intentional (ADR 0098 / 0100) |
| Peer queue Back href | `returnsToArchitecture: false` — do not collapse peer review into inhabited architecture Home |

No product change. Inventory rows carry `ownerPrompt: IR-015` and inline skip comments in `inhabit-leak-inventories.ts`.

## Inventory ratchet (IR-016)

All remain booleans flipped in `archlucid-ui/src/lib/inhabit-leak-inventories.ts` and [`INHABIT_LEAK_INVENTORIES.md`](INHABIT_LEAK_INVENTORIES.md). `archlucid-ui/src/lib/inhabit-leak-inventories.test.ts` no longer requires open remain leaks.

`INHABIT_COMPAT_MATRIX.md` is **not** a second source of truth for remain closes.

## Prompt ratchet (IR-017)

`archlucid-ui/src/lib/inhabit-remain-prompt-inventory.test.ts` asserts:

- `inhabit-remain-00-index.md` present
- Exactly one file per `inhabit-remain-001`–`018`
- Remain files do not count toward IH-079’s 80 `inhabit-NNN` wave files

## Constraints audit (unchanged)

| Constraint | Status |
| --- | --- |
| No desktop review-tab **More** menu | **Pass** |
| No G-REAL-06 / host Mode Real default | **Pass** |
| No draft-diff Compare | **Pass** |
| No presence / finding chat / unseal | **Pass** |
| `MUTATION_UNDO_WINDOW_SECONDS = 300` | **Pass** |
| No wave 35 pack | **Pass** |
| No GTM M-90 / M-44 / M-91 / M-92 | **Pass** |
| No TB-135 / TB-136 reopen | **Pass** |

## Verification

Focused Vitest suites for remain product areas, inventory ratchet, and prompt inventory (`inhabit-leak-inventories.test.ts`, `inhabit-remain-prompt-inventory.test.ts`, room URL helpers, handoff panel, presenter/header buttons).

## Recommendation

1. Remain livelihood leaks named in this pack are **closed**.
2. Do **not** paste a wave-35 inhabit pack to “finish inhabit.”
3. Fresh diagnosis after this close: [`WORKING_ARCHITECT_DIAGNOSIS_2026-09-13_POST_IR.md`](WORKING_ARCHITECT_DIAGNOSIS_2026-09-13_POST_IR.md) — secondary inspector landings, not reopened IR rows.
