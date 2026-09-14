> **Scope:** Fresh **working-architect / founding-contract** diagnosis against repo state **after** inhabit post-IR **IP-001–IP-015** close. This is **not** the V1 release-readiness scorecard (`.cursor/prompts/assessment.md`). **Not wave 35.** Do not reopen closed **IH** / **IR** / **IP** inventory rows as a class.
>
> **Origin:** ArchLucid is a **working-architect tool** — all-day use; livelihoods may depend on the sealed record (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13). ADR **0100** (Accepted): after spawn, Working inhabits the architecture; the afternoon document is architecture-nested findings.
>
> **Prior close:** [`INHABIT_POST_IR_ACCEPTANCE_2026-09-13.md`](INHABIT_POST_IR_ACCEPTANCE_2026-09-13.md) · Remain: [`INHABIT_REMAIN_ACCEPTANCE_2026-09-13.md`](INHABIT_REMAIN_ACCEPTANCE_2026-09-13.md) · Wave 34: [`INHABIT_ACCEPTANCE_2026-09-13.md`](INHABIT_ACCEPTANCE_2026-09-13.md) · Inventories: [`INHABIT_POST_IR_LEAK_INVENTORIES.md`](INHABIT_POST_IR_LEAK_INVENTORIES.md) / [`INHABIT_LEAK_INVENTORIES.md`](INHABIT_LEAK_INVENTORIES.md)

# Working-architect diagnosis — after post-IR close (2026-09-14)

## Executive summary

**Yes — the product is still a working-architect tool.** Wave 34, remain **IR-001–IR-018**, and post-IR **IP-001–IP-015** made Working an **inhabited findings afternoon** on the open architecture. The architect resumes Monday morning on nested findings, not a first-session evaluator.

A fresh trace (not inventory booleans alone) confirms the five livelihood clusters named in the pre-close diagnosis are **shipped**. One **auxiliary** cluster remains: nested-findings **queue resume strips** that still build peer review-inspector hrefs even when the architect is already on the inhabited document.

| Metric | Count |
|--------|------:|
| **Closed (do not re-run)** | Wave 34 + IR-001–IR-018 + IP-001–IP-015 product rows |
| **Post-IR inventory `leakOpen: true`** | **0** |
| **Named leftover clusters (this diagnosis)** | **1** (inhabited queue auxiliary CTAs) |
| **Intentional skips** | IP-012 inspector, IR-015 peer queue, first-review guide, explicit “View review job”, unlinked reviews |

**Headline:** Inhabit is the **default Working work surface** for resume, share, search, Room, finalize, and first-paint reasoned **no**. Remaining livelihood risk is **narrow** — auxiliary strips on the afternoon document that can still exile a click to the job inspector.

## Method

1. Re-read R4 (projector MUST loop + mandatory transparency trail) and R13 (seat for a repeat professional; reasoned **no** is the product).
2. Re-read ADR **0100**: nested review-detail stays a **job inspector**; afternoon document is `/architecture/architectures/{id}/findings?runId=`.
3. Trace live Working href builders and chrome **after** IP close — do not treat inventory `false` rows as proof without call-site verification.
4. Run post-IR guard Vitest (`inhabit-post-ir-*`, reviews-hub continue, global-search inhabited navigation, working share, completion href, first-paint guard).
5. Rank any new leftovers by livelihood: **false exile from the afternoon document** first; ceremony last.
6. Do **not** start wave 35. Do **not** paste an 80-prompt pack.

## What already shipped (do not reopen)

| Overlay | Evidence |
|---------|----------|
| Working default + inhabit ADR 0100 | `DEFAULT_WORKSPACE_MODE = "working"` · ADR 0100 Accepted |
| Primary inhabit loop (IR-001–IR-014) | Home continue-last, unfinished rail, pins, spawn handoff, Present, draft Room, inspect-from-inhabited-list, spawn-lock Compare |
| Post-IR dual-place landings (IP-002–IP-006) | Reviews hub Continue/row, global search run/finding, share, quick-decision cards, completion toast |
| Post-IR Room / projector (IP-007) | `ReviewRoomHeaderButton` + `RunDetailPresenterElicitationBridge` redirect to nested findings `roomElicitation=1` |
| Post-IR false confidence (IP-008–IP-009) | `structuralExecutionMode` on finding inspect; `WorkingExecuteStartHonestyNotices` on secondary re-run |
| Post-IR inspector finalize (IP-010) | `CommitRunButton` threads `parentArchitectureId` through Do-this-next strip |
| Post-IR inhabited chrome (IP-011) | Server-prefetched `initialTrailBundle`; run-scope banner gated on `suppressPipelineChrome` |
| Post-IR skip + ratchet (IP-012–IP-015) | Inspector skip documented; inventories and prompt ratchet green |

Canonical leak truth: `archlucid-ui/src/lib/inhabit-leak-inventories.ts` (remain) and `archlucid-ui/src/lib/inhabit-post-ir-leak-inventories.ts` (post-IR). **Do not flip closed booleans back.**

## Verified closed — post-IR clusters (live trace)

| Cluster | Key modules | Status |
|---------|-------------|--------|
| Dual-place landings | `reviews-hub-continue-review.ts`, `reviews-hub-package-display.ts`, `global-search-inhabited-navigation.ts`, `working-share-href.ts`, `resolve-review-completion-href.ts`, `resolveQuickDecisionFindingInspectHref` | **Closed** |
| Room on review-detail | `ReviewRoomHeaderButton.tsx`, `RunDetailPresenterElicitationBridge.tsx` | **Closed** (unlinked reviews fall back in-place — honest) |
| Inspect false confidence | `FindingDetailHeader.tsx`, `FindingDetailInspectBody.tsx`, `FindingSemanticSupportBandInspectSection.tsx` | **Closed** |
| Secondary re-run honesty | `RunProgressTracker.tsx`, `RunAgentQualityWarningsPanel.tsx` | **Closed** |
| Inspector finalize → desk | `ReviewPackageDoThisNextStrip.tsx` | **Closed** |
| First-paint trail + banner | `findings/page.tsx`, `InhabitedFindingsDocumentChrome.tsx`, `GovernanceFindingsQueueScopeSection.tsx` | **Closed** |

## Remaining livelihood failure

### 1. Inhabited queue auxiliary CTAs — peer inspector hrefs on the afternoon document

**Livelihood class:** ADR 0100 / R13. The architect is already on nested findings; auxiliary resume strips should deepen **this system's findings**, not open the **job inspector** in a new route.

| Surface | Evidence | Why livelihood |
|---------|----------|----------------|
| Continue last viewed | `resolve-continue-last-governance-finding.ts` → `toTarget` calls `getFindingDetailHref` | CTA on inhabited queue opens `/architecture/reviews/{runId}/findings/{id}` |
| First finding triage strip | `governance-findings-queue-presentation.ts` → `resolveFirstFindingTriageTarget` | Same `getFindingDetailHref` pattern |
| Assigned-to-me oldest finding | `resolveAssignedToMeOldestFindingTarget` | `governanceFindingInspectHref` without `architectureId` / `isWorkingMode` → evidence-trace peer route |
| Canonical secondary strip (register synopsis) | `canonical-object-home-registry.ts` → `canonicalObjectHomeHref("finding")` | Always `getFindingDetailHref`; used by `secondaryViewFromGovernanceQueueRow` on queue synopsis |

**Not leaking (same surfaces):** Primary finding row navigation in `GovernanceFindingsList` already uses `governanceFindingInspectHref` with architecture context when wired. List click is closed; **auxiliary strips** are not.

**Fix shape (when picked up):** Thread `architectureId` + `isWorkingMode: true` into triage target resolvers (same helper as IP-005 / IR-004: `governanceFindingInspectHref` with `focusedFinding`). Add inventory rows only if shipped — do not reopen IP-002–IP-011 booleans.

**Rank:** Lower than the shipped IP-002–IP-006 cluster. The architect is not exiled on **entry**; only optional in-page resume strips can mis-route a click.

## Intentional skips (do not “fix”)

| Skip | Why |
|------|-----|
| **IP-012** nested review-detail inspector | ADR 0098 / 0100 — full tab strip; entry leaks closed by IP-002–007 |
| Explicit “View review job” / spawn handoff | `ArchitectureDraftHandoffPanel.tsx` — labeled inspector link |
| Peer `/governance/findings` | **IR-015** — run-scoped peer queue, not architecture Home |
| First-review guide step CTAs | **SG-045** — first-week onboarding; nested review inspector by design |
| Pinned review “Make primary” | DR-11 — explicit switch to primary **review workspace** |
| Working back / governance return locators | AO-27 / AO-44 — child → review job → architecture desk breadcrumb chain |
| Unlinked reviews (no `architectureId`) | Honest peer `/architecture/reviews/{runId}` fallback |
| G-REAL-06 / host Mode Real | Honesty, not a default-day lie. Host `AgentExecution:Mode` stays **Simulator** |
| Draft-diff Compare | ADR 0092 / IH-077 |
| Presence / finding chat / unseal / merge kernels | ADR 0090 / 0039 / 0068 / 0070 |
| Lengthen `MUTATION_UNDO_WINDOW_SECONDS = 300` | Amend on the row after five minutes |
| Desktop review-tab **More** | Product direction |

## Constraints audit

| Constraint | Status |
|-----------|--------|
| No desktop review-tab **More** | **Pass** |
| No `typed-engine-protected` change | **Pass** (this diagnosis does not propose one) |
| No 300s undo lengthening | **Pass** |
| No GTM M-90 / M-44 / M-91 / M-92 | **Pass** |
| No TB-135 / TB-136 reopen | **Pass** |
| No G-REAL-06 | **Pass** |
| No wave 35 pack | **Pass** |

## Verification

Post-IR guard Vitest (sample): `inhabit-post-ir-leak-inventories.test.ts`, `reviews-hub-continue-review.test.ts`, `global-search-inhabited-navigation.test.ts`, `working-share-href.test.ts`, `resolve-review-completion-href.test.ts`, `inhabit-post-ir-first-paint-guard.test.ts`, `inhabit-post-ir-inspector-skip-guard.test.ts` — **20 tests passed** on 2026-09-14 trace.

## Recommendation

1. Treat post-IR livelihood leaks **IP-002–IP-011** as **closed**. Do **not** re-run IH-001–080, IR-001–018, or IP-001–015 product bodies.
2. **Optional follow-up** (one cluster): wire inhabited queue auxiliary strips through `governanceFindingInspectHref` with `architectureId` + `isWorkingMode: true`. Add new inventory rows only when shipping (e.g. a numbered post-post-IR prompt), not by flipping closed IP booleans.
3. **Do not** paste wave 35 or claim inhabit is incomplete because the job inspector still exists — ADR 0100 requires it for in-flight analysis and explicit job inspection.
4. Next fresh diagnosis should start from this file and [`INHABIT_POST_IR_ACCEPTANCE_2026-09-13.md`](INHABIT_POST_IR_ACCEPTANCE_2026-09-13.md), not reopen closed inventory classes.
