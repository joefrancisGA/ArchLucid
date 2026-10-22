> **Scope:** ADR 0098 — After spawn, Working primary chrome stays the architecture identity; nested review-detail is a job inspector.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0098: Working instrument after spawn is the architecture desk

- **Status:** Proposed
- **Date:** 2026-09-12
- **Evidence:** `archlucid-ui/src/lib/system-gravity-instrument-after-spawn-guard.test.ts` (SG-106) — proposed 2026-09-12.

## Context

ADR **0077** (Accepted) made the architecture identity the Working **locator**: Start, last-open, and nested job URLs train the named system as the address bar. ADR **0079** (Accepted) nested Ask, Compare, Graph, Search, and Findings as **tools on that identity**. ADR **0092** (Accepted) spawn-locked the draft and kept two kernels. CE mounted **Sketch a change**; DW backgrounded Real wait.

Those waves fixed **where bookmarks land** and **where tools live**, but the paying day still **lives inside nested review-detail** (findings, disposition, finalize, wait chrome) as if that inspector were Monday morning. Locator ≠ instrument. Repeat professionals reopen the **architecture they own**; reviews are **jobs of** that system.

**Rejected alternatives:**

- **Merge `DraftRequests` and `Runs`** — violates ADR 0068 and sealed-record immutability (ADR 0039).
- **Collapse review workspace tabs behind More** — rejected by product direction; inspector keeps the full strip.
- **Make review-detail the permanent Working Home after spawn** — preserves pipeline muscle memory; fails the livelihood instrument test.
- **Remount CE Sketch runner or draft-diff Compare here** — out of scope; CE/DW/SN bodies stay shipped.

**Related (not rewritten):** ADR 0068, 0069, 0072, 0074, 0077, 0079, 0092, 0096, 0097. This ADR **supersedes for Working only** the *instrument* implication that nested `/reviews/{reviewId}` chrome (H1, eyebrow, exile CTAs) is the all-day shell after spawn.

## Decision

1. **After spawn on Working**, when `ArchitectureId` is known, **primary chrome** (H1, eyebrow, last-open, restore, `document.title` identity) stays the **architecture display name**. The review title is a **job subtitle**, not the shell identity.
2. **Nested review-detail** is a **job inspector** with a **full workspace tab strip** — not Monday morning, not a second product, not exile from the desk.
3. **Findings, disposition, and finalize** are **verbs on a child job** of the open architecture. Working defaults to nested `/architectures/{id}/findings` (and in-job Findings tab) instead of `/governance/findings` exile when the parent architecture is known.
4. **Finalize success** on Working returns to the architecture desk with the sealed child highlighted (`highlightReviewId`), not to the cross-review governance register as Home.
5. **Guided / demo / trial** may keep peer review URLs and eval phrasing (ADR 0067). **Kernels stay two.** Host `AgentExecution:Mode` default stays **Simulator** (no G-REAL-06).

### FAQ (quote in reviews)

| Question | Answer |
|----------|--------|
| After Start review, is review-detail Monday morning? | **No.** The architecture desk is the instrument; review-detail is a nested job inspector. |
| May we merge kernels so the job is the document? | **No.** `DraftRequests` and `Runs` stay separate (ADR 0068). |

## Trade-offs

**Gains:** All-day seat matches architect mental model after spawn; screenshots cannot treat review H1 as the owned system; findings/finalize read as verbs on the desk; finalize success reinforces the parent architecture.

**Sacrifices:** Dual presentation paths (Working instrument vs buyer/Guided review-centric headers); engineers must pass `architectureId` into findings/finalize navigation; short-term grep churn on governance exile links.

**Rejected:** Deleting review-detail; merging kernels; hiding review tabs; remounting CE runner; flipping host Mode to Real.

## Constraints

- Do not rewrite ADR 0077, 0079, 0092, 0096, or 0097 bodies — Related pointers only.
- `DraftRequests` and `Runs`/`Reviews` remain separate tables.
- Tenant isolation on every query (ADR 0037); route `architectureId` mismatch → 404.
- Desktop review workspace tabs stay a full strip (no **More** overflow).
- TB-645 vocabulary: architecture, review, finding, sealed review record.
- User-facing execute labels are **Record** / **Practice** (ADR **0097**); stored tokens stay `"career"` / `"rehearsal"`.
- No 40th coverage engine. No live presence or finding-comment chat.
- No GTM cohort programs (M-90, M-44, M-91, M-92). No reopen TB-135 / TB-136.

## Expected impact

**System:** Working nested review header uses architecture display name as H1; findings queue links prefer `architectureNestedFindingsPath`; finalize success uses `resolveFinalizeSuccessDeskHref`; inventories SG-004–014 track remaining exile leaks.

**Security:** Unchanged trust boundary — workspace-scoped RBAC; nested paths remain tenant-scoped; no cross-architecture render on id mismatch.

**Operations:** No SQL migration; Vitest guards (SG-093–110) ratchet instrument-after-spawn; wave close audit SG-120.

**Cost:** Negligible — presentation and href helpers only.

**Teams:** Engineering runs SG-016–040 after inventories; do not remount CE or re-run DW.

## Consequences

- **Positive:** Working seat reads as an all-day architecture desk even while a job inspector is open; sealed records stay honest children.
- **Negative:** Engineers must refuse “review-detail is Home because the URL is nested” shortcuts; governance register remains for cross-review disposition when architecture is unknown.
