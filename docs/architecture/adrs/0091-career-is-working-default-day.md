> **Scope:** ADR 0091 — On Working production seats, **Career is the default execute gravity**. Rehearsal is an explicit door. ADR 0086 doors stay. Host `AgentExecution:Mode` default may remain Simulator (no G-REAL-06).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0091: Career is the Working default day

- **Status:** Accepted
- **Date:** 2026-09-11
- **Accepted:** 2026-09-12 (owner)
- **Owner decision:** Working production gravity is **Career**. Unlabeled Simulator is not the day’s work. Host Mode default is unchanged.

## Context

ADR **0086** shipped Working **Career vs Rehearsal doors** without flipping host `AgentExecution:Mode`. AS-076–085 added chooser chrome, Rehearsal Ready suppression (AS-079), and the AS-085 Simulator-default ratchet. LP-06 (`simulator-career-honesty.ts`) already blocks career-complete Simulator paths when Working desk + structural Simulator/Fallback are known.

**Remaining livelihood failure is gravity, not the door widget.** A Working day can still *feel* like Career — Ready chips, pipeline “complete,” finalize-able CTAs — while structural execute is Simulator or Fallback. Chooser chrome does not help if the default story is unlabeled rehearsal. Architects will screenshot those surfaces into ARB packets and borrow authority the run did not earn.

**0086 is not rewritten.** Doors, Guided/demo/trial eval seats, `archlucid try --real` (ADR 0033), and the host Mode default stay as 0086 decided. This ADR answers a narrower question: **what is the Working default day?**

**AS-080** already defaults *new* Working tenants to Career intent and grandfathers Simulator clones as Rehearsal. This ADR makes Career gravity quoteable for every Working production surface, not only first-run storage.

**Related (not rewritten):** ADR 0086 (doors), ADR 0078 (career artifact honesty), ADR 0080 (Working seat), LP-06, AS-079, AS-080, AS-085 (`ArchitectureSpineAs085NoHostModeFlipRatchetArchitectureTests`).

## Decision

1. **Career is the Working default execute gravity.** On Working production seats, the day’s work is Career unless the operator explicitly opens the **Rehearsal** door.
2. **Rehearsal is opt-in.** Rehearsal remains the labeled incomplete / not-career-complete door (ADR 0086). It is not the unlabeled default screenshot.
3. **Unlabeled Simulator is never the Working day.** If structural `AgentExecution:Mode` (or run `structuralExecutionMode`) is Simulator or Fallback, Working must show Rehearsal labeling **or** block Career-complete chrome (Ready to finalize, career-complete exports). “Career door + Simulator Mode” is a mismatch that must not look like a sealed Career packet (CG-020 leftover).
4. **Host Mode default unchanged.** `AgentExecution:Mode` may remain **Simulator** in appsettings, compose, and hosted dev loops. Career vs Rehearsal stays product chrome plus run stamp. **No G-REAL-06.**
5. **0086 doors stay.** Do not delete the chooser. Do not merge Career and Rehearsal into one silent default. This ADR does not change chooser UI (CG-016+).
6. **Eval seats stay eval.** Guided, demo, static showcase, and frictionless trial keep Simulator teaching (ADR 0067 / 0080).
7. **Kernels stay two.** Do not merge `DraftRequests` and `Runs` (ADR 0068). Do not unseal sealed records (ADR 0039).

### Quoteable FAQ

| Question | Answer |
| --- | --- |
| **Is Simulator the unlabeled Working day?** | **No.** Working default gravity is Career. Simulator/Fallback without Rehearsal labeling is not Career-complete. |
| **Does this ADR flip host `AgentExecution:Mode` to Real?** | **No.** G-REAL-06 remains the owner program. AS-085 still forbids a product-default Real flip. |
| **May Working look like Career while Mode is Simulator?** | **No** — unless the operator is in the explicit Rehearsal door (or Guided/demo/trial) with rehearsal labeling. Career door + Simulator is blocked or labeled incomplete, not Ready. |
| **Does this rewrite ADR 0086?** | **No.** 0086 still owns the door model and the host Mode constraint. 0091 owns Working **gravity**. |

## Trade-offs

**Gains:** PR review can quote one ADR for “is Simulator the unlabeled Working day?” — the answer is no. Architects stop treating Simulator Ready as Career proof. ARB packets cannot silently borrow Real authority from rehearsal chrome. Local/dev clones still boot without Azure OpenAI because host Mode stays Simulator. G-REAL-06 stays a GTM owner program instead of a hidden appsettings change.

**Sacrifices:** Career-default gravity plus Simulator host Mode is a mismatch that later prompts must label or block (CG-020–CG-030). Extra tests for Ready suppression when the door says Career but Mode is Simulator. Grandfathered Simulator clones (AS-080 Rehearsal) still need a banner so bookmarks do not look Career-complete. Operators who wanted “just run it” on Simulator lose unlabeled Ready screenshots — that is the point.

**Rejected:** Flipping `AgentExecution:Mode` host default to Real; implementing G-REAL-06 in this wave; rewriting ADR 0086; deleting Guided Simulator teaching; merging `DraftRequests`/`Runs`; making Rehearsal the unlabeled Working default on production seats; changing chooser UI in the ADR-only prompt.

## Constraints

- **Do not** flip `AgentExecution:Mode` default from Simulator to Real in appsettings, compose, host composition, or this ADR’s follow-up code. No **G-REAL-06**.
- **Do not** rewrite ADR 0086. Doors remain; this ADR adds gravity.
- **Do not** merge `DraftRequests` and `Runs` (ADR 0068). **Do not** unseal sealed records (ADR 0039).
- **Do not** collapse desktop review workspace tabs behind **More**.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** add a 40th coverage engine or change `DeterministicInsightDensityGate` `typed-engine-protected`.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- **TB-645** vocabulary on gravity copy. **TB-2005** if later chooser forms change (not this prompt).
- SQL stays in `ArchLucid.Persistence/Scripts/ArchLucid.sql` plus numbered migrations — this ADR adds no tables.
- Chooser UI is **out of this prompt** (CG-016+). Inventories and Ready suppression leftovers are CG-002+.

## Expected impact

**System:** Working production treats Career as the default day. Simulator/Fallback output cannot screenshot as unlabeled Ready-to-finalize or career-complete. Host Mode default stays Simulator; AS-085 continues to fail accidental Real defaults. Follow-on CG prompts inventory remaining Ready leaks, persist the door, stamp execute posture on the run, and gate exports.

**Security:** Authority-borrowing is the load-bearing risk. An ARB packet, sponsor PDF, or Slack screenshot that looks Career-complete while Mode is Simulator launders rehearsal as production proof. Gravity + rehearsal labeling reduces that impersonation. No new public exposure and no new tenant isolation surface — doors and stamps stay inside the existing workspace catalog (ADR 0037). RestrictToShares (ADR 0087) is unchanged.

**Operations:** Support can distinguish “Career blocked — Mode is Simulator” from “I chose Rehearsal.” On-call cites 0091 + 0086 + LP-06. Local reproduction still does not require Azure OpenAI.

**Cost:** No incremental Azure spend from a host Mode flip (explicitly avoided). Engineering cost is documentation now and CG-002+ inventories/gates later — not a new store or LLM path.

**Teams:** GTM keeps G-REAL-06 as live first-review proof. Principal architects get a quoteable default day. Guided owners keep teaching Simulator. Implementation agents must not “fix” gravity by editing appsettings Mode.

## Consequences

- **Positive:** 0091 is the merge-blocking answer to unlabeled Simulator as the Working day; 0086 remains the door contract; AS-085 remains the host Mode ratchet.
- **Negative:** Career gravity + Simulator host Mode needs honest mismatch chrome; grandfathered Rehearsal clones still leak if banners are missing; Ready copy leftovers remain until CG-021+.
- **Follow-ups:** CG-002 unlabeled Ready inventory; CG-011+ door persist/stamp; CG-016+ chooser leftover; CG-021+ Career gates; CG-080 confirm AS-085 still holds.
