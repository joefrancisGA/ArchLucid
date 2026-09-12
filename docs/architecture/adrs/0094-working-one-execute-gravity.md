> **Scope:** ADR 0094 — On Working production seats, **one execute gravity** (Career default per ADR 0091). Operator-experience is **density**, not Mode. Guided/demo/trial remain eval skins. Host `AgentExecution:Mode` default may remain Simulator (no G-REAL-06).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0094: Working has one execute gravity

- **Status:** Proposed
- **Date:** 2026-09-11
- **Owner decision:** Working production has **one execute gravity** — Career unless the operator explicitly opens **Rehearsal**. `NEXT_PUBLIC_OPERATOR_EXPERIENCE` is engineering chrome density, not a third gravity. Guided stays a second product. Host Mode default is unchanged.

## Context

ADR **0091** made Career the Working default day. ADR **0086** shipped Career vs Rehearsal **doors** without flipping host `AgentExecution:Mode`. ADR **0080** split Working (dense instrument) from Guided/demo/trial (eval chrome). Eight overlapping flags — workspace mode, Career/Rehearsal door, `NEXT_PUBLIC_OPERATOR_EXPERIENCE`, demo/static/trial builds, product line, presenter tour, pre-commit nav copy — trained architects to distrust the screen.

**Remaining livelihood failure is mode-matrix gravity, not missing doors.** A Working day can still *feel* like eight simultaneous modes when deploy docs, preferences, and help treat engineering density flags as execute posture. Instruments have one gravity; density knobs are separate.

**0086 / 0091 are not rewritten.** Doors, Guided/demo/trial eval seats, `archlucid try --real` (ADR 0033), and the host Mode default stay as prior ADRs decided. This ADR answers a narrower question: **what is Working execute gravity vs chrome density?**

**Related (not rewritten):** ADR 0080 (Working seat), ADR 0086 (doors), ADR 0091 (Career default day), MG-001–MG-024 mode-gravity wave, AS-085 (`ArchitectureSpineAs085NoHostModeFlipRatchetArchitectureTests`).

## Decision

1. **Working has one execute gravity.** On Working production seats, execute posture is **Career** unless the operator explicitly opens the **Rehearsal** door (ADR 0086 / 0091). No third Career door from UI flags.
2. **`NEXT_PUBLIC_OPERATOR_EXPERIENCE` is density, not gravity.** `operator` opts into engineering chrome (IDs, COGS, shortcut metadata). It does **not** change Career vs Rehearsal, host `AgentExecution:Mode`, or export stamp. Working production already has dense chrome without the flag (TB-643 history).
3. **Two customer controls, one story.** **Workspace mode** (Working vs Guided) chooses the product skin. **Career / Rehearsal** (Working only) chooses execute gravity. Do not merge the controls or auto-switch Guided→Working.
4. **Guided / demo / trial / static remain eval.** `resolveProductionEvalChrome()` stays **true** for Guided, demo, static showcase, and frictionless trial. Production **Working** stays **false** (ADR 0080 / WS-23). Do **not** delete Guided.
5. **Product line is packaging, not a door.** Architecture vs Security shells share doors or an honesty strip (CG-017). Product line does not mint a third execute posture.
6. **Host Mode default unchanged.** `AgentExecution:Mode` may remain **Simulator** in appsettings, compose, and hosted dev loops. Career vs Rehearsal stays product chrome plus run stamp. **No G-REAL-06.**
7. **API execute posture stays server-side.** UI flags must not be sent as `AgentExecution:Mode`. Run stamp + structural Mode are server fields (CG-019).

### Quoteable FAQ

| Question | Answer |
| --- | --- |
| **Is operator-experience a Career door?** | **No.** It is engineering chrome density. Career vs Rehearsal is the Working door only. |
| **How many execute gravities on Working?** | **One** — Career default; Rehearsal is explicit. |
| **Does this ADR flip host `AgentExecution:Mode` to Real?** | **No.** G-REAL-06 remains the owner program. AS-085 still forbids a product-default Real flip. |
| **May Working use eval chrome?** | **No** on production Working — `resolveProductionEvalChrome` is false. Guided/demo/trial keep eval. |
| **Does this rewrite ADR 0086 or 0091?** | **No.** This ADR names gravity vs density; prior ADRs own doors and Career default day. |

## Trade-offs

**Gains:** PR review can quote one ADR for “is operator-experience a Career door?” — the answer is no. Support can read workspace mode, door stamp, and host Mode from the bundle without inferring Career from density flags. Architects stop needing a matrix to know if work is real. Local/dev clones still boot without Azure OpenAI because host Mode stays Simulator.

**Sacrifices:** Engineering flags remain for local dev and power users — they must stay documented as density, not gravity. Preferences and help must explain two controls without listing eight env vars. Extra Vitest ratchets for eval chrome and palette IA.

**Rejected:** Deleting Guided; collapsing workspace mode and Career door; treating `NEXT_PUBLIC_OPERATOR_EXPERIENCE` as execute Mode; flipping `AgentExecution:Mode` host default to Real; implementing G-REAL-06 in this wave; merging `DraftRequests`/`Runs`; making demo/trial Working-dense.

## Constraints

- **Do not** flip `AgentExecution:Mode` default from Simulator to Real in appsettings, compose, host composition, or follow-up code. No **G-REAL-06**.
- **Do not** delete Guided or auto-switch Guided→Working.
- **Do not** rewrite ADR 0086 or ADR 0091. Doors and Career default day remain.
- **Do not** merge `DraftRequests` and `Runs` (ADR 0068). **Do not** unseal sealed records (ADR 0039).
- **Do not** collapse desktop review workspace tabs behind **More**.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** add a 40th coverage engine or change `DeterministicInsightDensityGate` `typed-engine-protected`.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- **TB-645** vocabulary on gravity copy. **TB-2005** if preferences forms change.
- SQL stays in `ArchLucid.Persistence/Scripts/ArchLucid.sql` plus numbered migrations — this ADR adds no tables.

## Expected impact

**System:** Working production treats Career/Rehearsal as the only execute gravity control. `NEXT_PUBLIC_OPERATOR_EXPERIENCE` and product line stay density/packaging. Guided/demo/trial keep eval chrome. Host Mode default stays Simulator; AS-085 continues to fail accidental Real defaults. MG wave inventories flags and ratchets leftovers.

**Security:** Authority-borrowing risk when UI flags are mistaken for execute Mode — a client or screenshot that treats buyer-polished/demo flags as Career proof. Separating gravity from density reduces impersonation. No new public exposure; run stamp stays server-side (ADR 0037 catalog boundary unchanged).

**Operations:** Support bundle lists workspace mode, door stamp, host Mode, and demo flags without implying Career (MG-023). On-call cites 0094 + 0086 + 0091. `/al-ui-rate` on Working rates the instrument, not buyer-confidence polish (WS-07 / MG-009).

**Cost:** No incremental Azure spend from a host Mode flip (explicitly avoided). Engineering cost is documentation, inventories, and Vitest ratchets — not a new store or LLM path.

**Teams:** GTM keeps G-REAL-06 as live first-review proof. Guided owners keep teaching Simulator. Implementation agents must not “fix” gravity by editing appsettings Mode or deleting Guided.

## Consequences

- **Positive:** 0094 is the merge-blocking answer to operator-experience as Mode; 0091 remains Career default day; 0086 remains the door contract; AS-085 remains the host Mode ratchet.
- **Negative:** Flag inventory must stay shrink-only as new env vars appear; help must stay in-app (no GitHub blob links).
- **Follow-ups:** MG-002+ inventories; MG-012 help flowchart; MG-024 close audit; successor **DI** / **CE** waves for desk IA and cheap what-if.
