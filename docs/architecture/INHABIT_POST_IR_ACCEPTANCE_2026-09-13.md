> **Scope:** Close audit — inhabit post-IR leftovers (**IP-001–IP-015**). Internal engineering only. **Not wave 35.**

# Inhabit post-IR acceptance — 2026-09-13

**Wave:** post-IR pack after remain **IR-001–IR-018** close. **ADR:** [0100](adrs/0100-working-inhabit-architecture-findings-document.md) (Accepted). **Index:** [`.cursor/prompts/inhabit-post-00-index.md`](../../.cursor/prompts/inhabit-post-00-index.md). **Leak truth:** [`INHABIT_POST_IR_LEAK_INVENTORIES.md`](INHABIT_POST_IR_LEAK_INVENTORIES.md) / `archlucid-ui/src/lib/inhabit-post-ir-leak-inventories.ts`. **Diagnosis:** [`WORKING_ARCHITECT_DIAGNOSIS_2026-09-13_POST_IR.md`](WORKING_ARCHITECT_DIAGNOSIS_2026-09-13_POST_IR.md).

## Executive summary

**IP-002–IP-011 product rows are shipped.** **IP-012** documents an intentional skip (nested review-detail stays inspector). **IP-013** inventories and markdown match TypeScript. **IP-014** prompt-file ratchet is green. **Wave 35 is not started.** **G-REAL-06 is not shipped.**

| Cluster | Prompts | Status |
| --- | --- | --- |
| Inventory | IP-001 | **Shipped** |
| Dual-place landings | IP-002–IP-006 | **Shipped** |
| Room / projector | IP-007 | **Shipped** |
| Inspect false confidence | IP-008–IP-009 | **Shipped** |
| Inspector finalize → desk | IP-010 | **Shipped** |
| Inhabited banner / first-paint | IP-011 | **Shipped** |
| Skip inspector stays inspector | IP-012 | **Skip** (documented) |
| Inventory ratchet | IP-013 | **Shipped** |
| Prompt inventory Vitest | IP-014 | **Shipped** |
| Close audit | IP-015 | **This document** |

## Product shipped (IP-002–IP-010)

| IP | Summary |
| --- | --- |
| **002** | Reviews hub Continue + row href land on inhabited findings when architecture known |
| **003** | Global search run/finding resume uses inhabited nested findings hrefs |
| **004** | Working share copies inhabited findings URL |
| **005** | Quick-decision cards use architecture-scoped inspect/disposition hrefs |
| **006** | Completion notification deep-links to inhabited findings |
| **007** | Room on review-detail redirects to inhabited findings room (matches Present) |
| **008** | Finding inspect support band threads `structuralExecutionMode` (Simulator honesty) |
| **009** | Secondary re-run mounts `WorkingExecuteStartHonestyNotices` |
| **010** | Inspector finalize passes `parentArchitectureId` through Do-this-next strip |

## Product shipped (IP-011)

| Surface | Summary |
| --- | --- |
| Run-scope banner | Gated on `suppressPipelineChrome` — no “Open review” escape hatch on inhabited nested findings |
| First-paint trail + infeasible | Nested findings page server-prefetches `critical-page-bundle` into `initialTrailBundle` |

## Intentional skip (IP-012)

| Surface | Why it stays |
| --- | --- |
| Nested `/architecture/architectures/{id}/reviews/{runId}` | **Job inspector** — full tab strip, not Monday-morning findings (ADR 0098 / 0100) |
| `/architecture/reviews/{runId}` | Same — entry leaks closed by IP-002–007; do not delete or collapse the inspector |
| In-flight `?reviewTab=activity` | Analysis still running — honest inspector surface |
| Spawn-handoff “View review job” | Explicit inspector link |

No product change. `INHABIT_POST_IR_INSPECTOR_SKIP_NOTE` in `inhabit-post-ir-leak-inventories.ts`. Ratchet: `inhabit-post-ir-inspector-skip-guard.test.ts`.

Peer `/governance/findings` remains peer (**IR-015** — `returnsToArchitecture: false`).

## Inventory ratchet (IP-013)

All shipped post-IR booleans flipped in `archlucid-ui/src/lib/inhabit-post-ir-leak-inventories.ts` and [`INHABIT_POST_IR_LEAK_INVENTORIES.md`](INHABIT_POST_IR_LEAK_INVENTORIES.md). `archlucid-ui/src/lib/inhabit-post-ir-leak-inventories.test.ts` tracks open rows.

Closed **IR/IH** remain rows in `inhabit-leak-inventories.ts` are **not** flipped back.

## Prompt ratchet (IP-014)

`archlucid-ui/src/lib/inhabit-post-prompt-inventory.test.ts` asserts:

- `inhabit-post-00-index.md` present
- Exactly one file per `inhabit-post-001`–`015`
- Post-IR files do not count toward IH-079’s 80 `inhabit-NNN` wave files or IR-017’s 18 remain files

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

Focused Vitest: `inhabit-post-ir-leak-inventories.test.ts`, `inhabit-post-prompt-inventory.test.ts`, `inhabit-post-ir-inspector-skip-guard.test.ts`, plus product-area tests from IP-002–IP-011 batches.

## Recommendation

1. Post-IR livelihood leaks named in IP-002–IP-011 are **closed**.
2. Do **not** paste a wave-35 inhabit pack to “finish inhabit.”
3. Fresh diagnosis should start from this acceptance, not reopen closed IR/IH inventory booleans.
