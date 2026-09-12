> **Scope:** ADR 0092 — Working may run a **labeled what-if envelope** without treating it as a Career seal. Persistence stays two kernels (ADR 0068). Career what-if remains a capped full pipeline run (R12). Cheap envelope is Rehearsal-stamped or explicitly labeled incomplete.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0092: Working cheap what-if envelope (no kernel merge)

- **Status:** Accepted
- **Date:** 2026-09-11
- **Accepted:** 2026-09-12 (owner)
- **Owner decision:** All-day architects need cheap sketches. R12 made every branch a billable full run. The envelope must not launder Career. Two kernels stay separate.

## Context

**R12** (founding contract) converged: what-if branching reuses the Compare engine unchanged; a branch is a ceteris-paribus run from a parent-draft snapshot, must clear the MUST-gate, and is an **explicit, capped, billable full-pipeline run**. That is correct for **Career** what-if — sealed comparison needs two committed manifests.

**Livelihood failure:** architects sit in Working all day thinking in systems, not jobs. Every sketch cannot be a full authority pipeline bill. Without a cheap path, operators either abandon what-if or screenshot in-flight drafts as Career proof — both violate the seal.

**ADR 0068** keeps synthesis (`DraftRequests`) and review (`Runs`/`Reviews`) as **two kernels and two SQL tables**. Merging tables would destroy spawn lock, sealed immutability (ADR 0039), and Compare’s committed-manifest gate.

**ADR 0091** (Career gravity) and **ADR 0086** (Career vs Rehearsal doors) are not rewritten. A cheap envelope is **not** an unlabeled Career run. It is Rehearsal-stamped or explicitly labeled **incomplete** — same authority-borrowing bar as rehearsal output.

**Rejected alternative (R12):** draft-to-draft Compare — comparing two unsealed drafts as Career proof. SN-038 records that residual; this ADR does not implement it.

**Related (not rewritten):** ADR 0068 (dual kernel), ADR 0039 (sealed immutability), ADR 0072 (canonical review URL after spawn), ADR 0079 (Working desk), ADR 0086 (doors), ADR 0091 (Career gravity), R12, WA-10 (impact preview), CG stamp (wave 24). **Runner implementation** is **CE** wave (SN-008+ mounts desk path; do not implement runner in SN-001).

## Decision

1. **Working may sketch a labeled what-if envelope** without submitting a Career-sealed review. The envelope is a bounded exploration surface — impact preview entry, clone-from-snapshot, or equivalent desk path — stamped **Rehearsal** or **incomplete** and never Ready-to-finalize as Career.
2. **Career what-if stays R12.** When the operator intends a **Career** ceteris-paribus branch, they still spawn a capped full pipeline run, clear the MUST-gate, and compare **two committed manifests**. No shortcut through draft diff.
3. **Compare unsealed drafts is forbidden.** `AuthorityCompareService` and Working Compare UI require **two sealed golden manifests**. In-flight drafts, spawn-locked handoffs, and labeled envelopes **do not** satisfy Compare as Career proof.
4. **Kernels stay two.** Do not merge `DraftRequests` and `Runs` (ADR 0068). Do not unseal sealed records (ADR 0039). Cheap envelope data may reference draft snapshots; it does not collapse synthesis and review persistence.
5. **No kernel merge, no draft-diff Compare.** The cheap path is **not** “merge tables so draft edits compare like runs.” SN-006 inventories journeys that die at the Compare gate; CE wave owns runner wiring.
6. **Host Mode default unchanged.** `AgentExecution:Mode` may remain **Simulator**. Envelope labeling is product chrome + stamp, not G-REAL-06.
7. **Runner deferred.** SN-001 authors policy only. SN-008+ and **CE** wave mount clone-from-snapshot and cost-cap chrome without rewriting this ADR.

### Quoteable FAQ

| Question | Answer |
| --- | --- |
| **May we Compare two unsealed drafts as Career?** | **No.** Compare requires two committed manifests (R12). Draft-to-draft Compare is rejected. |
| **May Working sketch a labeled envelope?** | **Yes.** Rehearsal-stamped or explicitly labeled incomplete — not Career-complete, not Compare-ready as proof. |
| **Does cheap envelope merge `DraftRequests` and `Runs`?** | **No.** ADR 0068 two kernels and two tables stay. |
| **Is labeled envelope a Career seal?** | **No.** Career what-if remains a capped full pipeline run (R12). |
| **Does this ADR flip host `AgentExecution:Mode` to Real?** | **No.** G-REAL-06 remains the owner program. |

## Trade-offs

**Gains:** Architects can think all day without every sketch becoming a billable full run. PR review can quote one ADR for “draft diff as Career?” — the answer is no. Compare’s committed-manifest gate stays honest. Two kernels preserve spawn lock and sealed immutability. Rehearsal labeling blocks authority-borrowing from cheap sketches.

**Sacrifices:** Two exploration speeds (cheap envelope vs Career what-if) need clear copy and stamps — SN-007–SN-009+ and CE runner. Compare still blocks draft-vs-draft journeys until both sides are sealed. Engineering cost for envelope runner is deferred to CE, not free in this ADR.

**Rejected:** Merging `DraftRequests`/`Runs`; draft-to-draft Compare; unlabeled Career envelopes; implementing the runner in SN-001; flipping host Mode to Real; rewriting ADR 0068 or R12 bodies.

## Constraints

- **Do not** merge `DraftRequests` and `Runs` (ADR 0068). **Do not** unseal sealed records (ADR 0039).
- **Do not** implement draft-diff Compare (R12 rejected alternative; SN-038 residual).
- **Do not** treat a labeled envelope as Career-complete, Ready-to-finalize, or sponsor-export proof without a sealed run stamp.
- **Do not** flip `AgentExecution:Mode` default from Simulator to Real. No **G-REAL-06**.
- **Do not** rewrite ADR 0068, R12, ADR 0086, or ADR 0091 bodies — Related pointers only.
- **Do not** collapse desktop review workspace tabs behind **More**.
- **Do not** invent live presence avatars, cursors, occupancy heartbeats, or finding-comment chat.
- **Do not** add a 40th coverage engine or change `DeterministicInsightDensityGate` `typed-engine-protected`.
- **Do not** reopen **TB-135 / TB-136**. No GTM **M-90 / M-44 / M-91 / M-92**.
- **Do not** lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300`.
- **TB-645** vocabulary on envelope copy. **TB-2005** when later desk forms change (not SN-001).
- SQL stays in `ArchLucid.Persistence/Scripts/ArchLucid.sql` plus numbered migrations — this ADR adds no tables.
- Runner mounts in **CE** wave; SN-008+ desk paths reference this ADR without re-implementing R12.

## Expected impact

**System:** Working gains a quoteable cheap-sketch policy without collapsing kernels. Career what-if and Compare stay on committed manifests. Spawn-locked drafts remain handoffs, not writable Career editors (SN-002+). Clone-from-snapshot becomes the desk sketch path (SN-008).

**Security:** Authority-borrowing is the load-bearing risk. Compare two unsealed drafts as Career would launder rehearsal edits into ARB packets. Forbidden. Labeled envelopes must carry Rehearsal/incomplete stamps so exports and screenshots cannot borrow Career seal. No new public exposure; tenant catalog boundary (ADR 0037) unchanged. RestrictToShares (ADR 0087) unchanged.

**Operations:** Support distinguishes “envelope sketch” from “Career what-if run” from “Compare blocked — need two seals.” On-call cites 0092 + 0068 + R12. Local dev still does not require host Mode flip.

**Cost:** Cheap envelopes reduce accidental full-pipeline bills for all-day thinking. Career what-if remains metered per R12 when explicitly chosen. No incremental Azure spend from G-REAL-06 (avoided).

**Teams:** CE wave implements runner; SN wave owns inventories and desk honesty. GTM keeps G-REAL-06 as live first-review proof. Implementation agents must not “fix” sketches by merging tables or enabling draft Compare.

## Consequences

- **Positive:** 0092 is the merge-blocking answer for cheap sketch vs Career seal; 0068 remains the kernel contract; R12 remains the Career what-if contract.
- **Negative:** Until CE runner ships, envelope is policy-only — desk must not imply Compare-ready Career proof; SN-006 journey table names the gap.
- **Follow-ups:** SN-002+ dual-editor inventories; SN-006 Compare journey table; SN-008 clone-from-snapshot; SN-009 cost-cap chrome; CE-001+ runner; SN-038 draft-compare residual.
