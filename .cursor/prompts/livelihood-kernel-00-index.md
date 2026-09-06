<!-- Livelihood-kernel Composer prompts — paste one prompt per session.
     Origin: 2026-09-05 owner follow-on. ArchLucid is a working-architect tool
     (all-day use; livelihoods may depend on the sealed record), not a casual
     evaluator. Wave 12 after career-record-00-index.md (CR-01–12).
     Owner authorized changing remaining load-bearing assumptions and ADRs
     that waves 8–11 named but forbade executing (BFF, document undo,
     canonical work URL, trail as a finalize gate).
     Do not implement from this index. -->

# Livelihood-kernel mitigations — Composer prompt set (LK-01–LK-15)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

Waves 1–7 shipped **overlays**. Wave 8 (IS) changed three bets: one Working work object (ADR 0069), density as a control (ADR 0070), instrument-first chrome. Waves 9–11 (LS/SD/CR) named leftovers and **explicitly refused** to implement the BFF, lengthen or replace 300s undo, rewrite ADR 0068, or make the transparency trail a finalize gate.

**Owner authorization (this wave):** those remaining load-bearing assumptions **are in scope**. Change ADRs by **superseding**, not rewriting Accepted bodies. Dedicated PRs for BFF (LK-05–07). Do **not** merge `DraftRequests` and `Runs` SQL tables. Do **not** drop typed-engine findings from the package. Do **not** unseal sealed records.

**Do not implement from this index.** Paste one numbered file per Composer session.

**Do not treat this set as a V1 assessment scorecard.** Do not add GTM cohort work (**M-90**, **M-44**, **M-91**, **M-92**) or closed assurance programs (**TB-135** / **TB-136**). **TB-645** vocabulary stays.

## What this set *does* change

| Bet | From | To | Prompts |
|-----|------|----|---------|
| **Document undo** | 300s toast then audit-only correction | Unsealed work has a document undo stack; sealed writes stay audit-shaped | LK-01, LK-02 |
| **One URL identity** | One chrome primary; draft URL still a second desk | After spawn, the review is the canonical Working URL; kernels stay two tables | LK-03, LK-04 |
| **Session survives the day** | `sessionStorage` Bearer + client idle (ADR 0059 Proposed; IS-15 unexecuted) | HttpOnly BFF for Working; CLI Bearer kept; ADR 0059 Accepted | LK-05, LK-06, LK-07 |
| **Trail earns R4** | Trail types exist; stamp can omit them | Finalize and career exports fail closed without a complete trail | LK-08, LK-09 |
| **Instrument, not pipeline** | Wait and keyboard still describe an evaluator | Wait is background; keyboard triages; infeasible is a receipt; stamp names the measured floor | LK-10–LK-15 |

## What this set does *not* change

Keep: tenant isolation (ADR 0037); sealed-manifest immutability (ADR 0039 — cannot unseal); ADR 0068 two **kernels** (synthesis ≠ review execute) and **separate SQL tables**; spawn lock (no localStorage “edit anyway”); desktop review tabs as a full strip; Guided / demo / trial as explicit eval sessions; `MUTATION_UNDO_WINDOW_SECONDS = 300` for the *silent Undo toast*.

Do **not** collapse desktop review tabs behind **More**. Do **not** auto-switch stored Guided users to Working. Do **not** add a 40th coverage-shaped engine. Do **not** check in fake frontier transcripts. Do **not** restore system-wide breadcrumbs (**TB-2090**). Do **not** invent live presence avatars. Do **not** rewrite ADR 0067, 0068, 0069, 0070, or 0050 **bodies** — supersede with 0071–0073 and Accept 0059.

## Relationship to prior sets

| Set | Role | Status |
|-----|------|--------|
| **DD / PT / WD / LI / LD / RS / WA / CD / AD / FD** | Overlays | Do not re-run / do not fork |
| **IS-01–15** | Wave 8 load-bearing bets | Do not fork chrome/gate. **IS-15 execution is superseded by LK-05–07** — do not paste `instrument-spine-15-session-survives-the-day.md` after this set exists |
| **LS-01–12** | Wave 9 leftovers | Do not fork dual-pane / R12 execute. LK-13 names LS-02 leftover only |
| **SD-01–12** | Wave 10 residuals | Do not fork docs honesty / ADR 0069–0070 status. **SD-09 honesty is obsolete after LK-05–07.** |
| **CR-01–12** | Wave 11 chrome/test leftovers | Do not fork. **CR-05 / CR-10** stay honesty and harness *guard*; LK implements BFF and does not re-pin the catalog test |
| **LK-01–15** | **This set** — wave 12 kernel | Run these |
| **DA-01–12** | Wave 13 durable identity skeleton | [`durable-architecture-00-index.md`](durable-architecture-00-index.md) — do **not** paste after CA |
| **CA-01–50** | Wave 14 customer object | [`customer-architecture-00-index.md`](customer-architecture-00-index.md) — do **not** merge tables; do not paste LK-05–07 |

If an LK row lists an IS/LS/SD/CR owner, **do not re-implement that file**. Implement only the leftover in *What to build*, unless this file **supersedes execution** (IS-15, SD-09, CR-05 honesty after BFF).

## Diagnosis classes (wave 12)

| Class | Livelihood failure | Prompts |
|-------|--------------------|---------|
| **Career defense — undo** | Confirm-then-forever on the working document | LK-01, LK-02 |
| **One work object — URL** | Spawn-locked draft URL is still a second instrument | LK-03, LK-04 |
| **Career defense — session** | XSS-readable Bearer; meetings dump on TTL | LK-05, LK-06, LK-07 |
| **False confidence — trail** | R4 liability stance without a mandatory trail on the stamp | LK-08, LK-09 |
| **Eval-first spine** | Wait-on-pipeline and nav-only keyboard are still the job | LK-10, LK-11, LK-15 |
| **Career defense — conflicts** | Autosave last-write-wins is a casual SPA | LK-12 |
| **False confidence — floor** | Stamp does not name the measured engine floor | LK-14 |
| **Career defense — no** | Infeasible still reads as unfinished yes | LK-13 |

## Run order

**ADR first, then product.** Prefer **01 → 02** (undo). Then **03 → 04** (canonical URL). Then **05 → 06 → 07** (BFF; dedicated PRs; do not mix with copy). Then **08 → 09** (trail gate). Then **10 / 11** (instrument). Then **12** (save conflicts). Then **14** (denominator on stamp). Then **13**. Then **15**.

**01** must not rewrite ADR 0039 or lengthen `MUTATION_UNDO_WINDOW_SECONDS`. **03** must not merge SQL tables or rewrite ADR 0068. **05** must preserve CLI Bearer. **08** must not rewrite ADR 0050. **12** must not invent a draft-diff engine. **14** must not add a 40th engine. Do not fork **CR-10**.

| # | Prompt file | Flaw it mitigates | Owner (do not fork) |
|---|----------------|-------------------|---------------------|
| 01 | `livelihood-kernel-01-adr-working-document-undo.md` | 300s toast is the only reversibility on unsealed work | IS-12 leftover; new ADR 0071 |
| 02 | `livelihood-kernel-02-draft-document-undo-stack.md` | Draft editor has no document undo/redo | LK-01 product |
| 03 | `livelihood-kernel-03-adr-working-canonical-work.md` | Two persist kernels still mean two live URLs | ADR 0068 immutability; new ADR 0072 |
| 04 | `livelihood-kernel-04-canonical-work-url-handoff.md` | Spawn-locked draft route still feels like an editor | SD-10 leftover route |
| 05 | `livelihood-kernel-05-adr-0059-bff-p1.md` | ADR 0059 still Proposed; proxy still forwards JS Bearer | **Supersedes IS-15 P1** |
| 06 | `livelihood-kernel-06-bff-p2-no-js-bearer.md` | Working GA still `persistTokenResponse` | **Supersedes IS-15 P2** |
| 07 | `livelihood-kernel-07-bff-idle-csrf-meeting.md` | Idle is client-only; mutating proxy has no CSRF | **Supersedes IS-15 remainder** |
| 08 | `livelihood-kernel-08-adr-trail-is-finalize-gate.md` | ADR 0050 trail is types, not a seal gate | New ADR 0073 |
| 09 | `livelihood-kernel-09-finalize-export-require-trail.md` | Stamp/PDF/JSON can omit asserted/inferred/skipped | FD-05 leftover exports |
| 10 | `livelihood-kernel-10-wait-is-not-the-desk.md` | In-progress still makes wait the job | IS-09 leftover; do not fork CR-06 Home heroes |
| 11 | `livelihood-kernel-11-keyboard-triage-is-the-job.md` | Shortcuts still navigate more than they mutate | IS-10 leftover |
| 12 | `livelihood-kernel-12-draft-save-conflicts-are-recoverable.md` | Autosave last-write-wins loses the other tab’s work | AD leftover; do not fork CR-10 harness CI |
| 13 | `livelihood-kernel-13-infeasible-receipt-is-the-product.md` | Reasoned no is still pending-success IA | LS-02 leftover; do not fork CR-09 empty presets |
| 14 | `livelihood-kernel-14-stamp-shows-measurement-denominator.md` | Stamp does not say how much of the engine catalog was measured | SD-03 leftover stamp |
| 15 | `livelihood-kernel-15-working-ci-identity-is-the-desk.md` | Default mock still trains buyer-polish as the operator | SD-05 leftover CI |

## Already shipped — do not re-open

| Item | Evidence |
|------|----------|
| ADR 0069 / 0070 + density gate | `0069-working-desk-one-work-object.md`, `DeterministicInsightDensityGate` `typed-engine-scored` |
| Working start resolver | `working-start-route.ts` / `use-working-start-href.ts` |
| Desk continuity prefs | `DeskContinuityValues.cs`, `desk-continuity-preference.ts` — LK does not fork IS-13 |
| Draft autosave last-saved | `use-architecture-draft-autosave.ts` — LK-02 is undo, not last-saved |
| Dual-pane workbench selection | `ArchitectureFindingsDualPane.tsx` uses `useReviewWorkbenchSelection` — LS-01 |
| Spawn lock rule | `architecture-draft-handoff-gate.ts` — LK-04 is the route, not the lock |
| 300s Undo toast + Record correction | mutation registry — LK-01 adds a *document* stack, does not replace the toast |
| Insight-density measurement | ID-01–10; CR-10 pins harness/catalog CI — do not fork; LK-14 is stamp copy |

## Global constraints (every prompt)

- Working-tree safety: `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** / overflow (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** rewrite ADR 0067, 0068, 0069, 0070, or 0050 in place. **Do not** merge draft and review tables.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate (IS-05).
- **Do not** add a 40th coverage engine or fake frontier transcripts.
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. **TB-645** vocabulary (package, finding, sealed review record).
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named in the prompt. `.\scripts\ci\agent-compile-check.ps1` when C# changes. No full-solution builds, no dev servers unless the prompt says so.
- UI: Carbon density, sentence case, no ghost/link `Button`, form validation **TB-2005**.
- C#: one class per file; no `ConfigureAwait(false)` in tests; blank line before `if` / `foreach` unless first in method; check nulls; prefer LINQ and concrete types.
- New ADRs must include **Trade-offs**, **Constraints**, and **Expected impact** per `docs/architecture/adrs/template.md`.
- All SQL DDL for a database stays in that database’s single DDL file.
- Infrastructure (session keys, BFF) must be representable in Terraform.

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided behavior, **which load-bearing bet moved**, which ADR was added or Accepted, and whether Guided/demo/trial still work without that prompt. Do not mark IS, LS, SD, FD, AD, CD, WA, RS, LD, or LI as undone — except **IS-15 / SD-09** which this set supersedes for execution.
