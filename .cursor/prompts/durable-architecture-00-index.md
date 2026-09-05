<!-- Durable-architecture Composer prompts — paste one prompt per session.
     Origin: 2026-09-05 owner follow-on. ArchLucid is a working-architect tool
     (all-day use; livelihoods may depend on the sealed record), not a casual
     evaluator. Wave 13 after livelihood-kernel-00-index.md (LK-01–15).
     Load-bearing bet: productize dbo.Architectures as the customer-visible
     durable identity.      Do not merge DraftRequests and Runs. Do not fork BFF.
     Wave 14 execution: customer-architecture-00-index.md (CA-01–50) — do not paste DA.
     Do not implement from this index. -->

# Durable-architecture mitigations — Composer prompt set (DA-01–DA-12)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

Waves 1–7 shipped **overlays**. Wave 8 changed three bets (one Working start, density as control, instrument-first chrome). Wave 12 (LK) owns document undo, canonical **review URL after spawn**, BFF session, trail-as-gate, wait-as-background, and stamp denominator.

**The remaining livelihood failure is the unit of work.** Persistence already has `dbo.Architectures` + `ArchitectureId` on reviews + `ArchitectureVersions`. The paying desk still treats **draft rows** as architectures (`architectureId` = `DraftId` in the SPA) and **reviews** as the Monday-morning object. Identity is created as a side effect of Created-origin runs, has no display name, and is not listed, opened, compared, or resumed as a system.

**Owner authorization (this wave):** make `dbo.Architectures` the **customer-visible durable identity**. Drafts stay `DraftRequests`. Reviews stay `Runs`/`Reviews`. Sealed records stay `GoldenManifests`. **Do not merge tables.** **Do not rewrite ADR 0068, 0069, or 0072 bodies** — supersede with **ADR 0074**. **Do not implement the BFF** (LK-05–07). **Do not add a 40th engine**.

**Do not implement from this index.** **Do not paste these DA files** after wave 14 exists — run [`.cursor/prompts/customer-architecture-00-index.md`](customer-architecture-00-index.md) (**CA-01–50**). Skip a CA row if its DA twin already shipped.

**Do not treat this set as a V1 assessment scorecard.** Do not add GTM cohort work (**M-90**, **M-44**, **M-91**, **M-92**) or closed assurance programs (**TB-135** / **TB-136**). **TB-645** vocabulary stays.

## What this set *does* change

| Bet | From | To | Prompts |
|-----|------|----|---------|
| **Durable identity** | Internal KM/recurrence pointer; UI calls draft ids `architectureId` | Named, listable, reopenable architecture the drafts and reviews hang off | DA-01–06, DA-12 |
| **Monday desk** | Reviews hub / draft editor as the system | Working architecture desk: children = drafts + reviews + latest seal | DA-04 |
| **Career inventory** | First 20; filters hide open work; ADR export caps findings | Showing N of M; hidden-count honesty; career export refuses silent truncation | DA-07, DA-08, DA-11 |
| **Eval leakage** | Demo compare / wizard launcher still on Working | Working hides evaluator start products; Guided keeps them | DA-09 |
| **Continuity** | In-flight tracker dies on scope switch | Architecture desk rehydrates ops for this identity from the server | DA-10 |

## What this set does *not* change

Keep: tenant isolation (ADR 0037); sealed-manifest immutability (ADR 0039); ADR 0068 two **kernels** and **separate SQL tables**; spawn lock (no localStorage “edit anyway”); ADR 0072 review-as-canonical-URL **after spawn**; desktop review tabs as a full strip; Guided / demo / trial as explicit eval sessions; `MUTATION_UNDO_WINDOW_SECONDS = 300` for the silent Undo toast; document undo (ADR 0071); density gate (ADR 0070); trail finalize gate (ADR 0073).

Do **not** collapse desktop review tabs behind **More**. Do **not** auto-switch stored Guided users to Working. Do **not** add a 40th coverage-shaped engine. Do **not** check in fake frontier transcripts. Do **not** restore system-wide breadcrumbs (**TB-2090**). Do **not** invent live presence avatars or finding-comment chat. Do **not** paste **LK-05–07** / **IS-15**. Do **not** invent a draft-diff merge engine (LK-12 owns conflict recovery). Do **not** lengthen 300s undo. Do **not** unseal sealed records.

## Relationship to prior sets

| Set | Role | Status |
|-----|------|--------|
| **DD / PT / WD / LI / LD / RS / WA / CD / AD / FD** | Overlays | Do not re-run / do not fork |
| **IS-01–15** | Wave 8 load-bearing bets | Do not fork. **IS-15 execution remains LK-05–07** |
| **LS / SD / CR** | Waves 9–11 leftovers | Do not fork |
| **LK-01–15** | Wave 12 kernel | **Do not fork.** BFF, undo, trail gate, wait chrome, stamp denominator stay there |
| **DA-01–12** | **This set** — wave 13 identity skeleton | Prompt files shipped `master` #1676. **Do not paste** after CA exists |
| **CA-01–50** | Wave 14 customer object | [`customer-architecture-00-index.md`](customer-architecture-00-index.md) — **run these** |

If a DA row lists an LK/IS/LS owner, **do not re-implement that file**. Implement only the leftover in *What to build*.

## Diagnosis classes (wave 13)

| Class | Livelihood failure | Prompts |
|-------|--------------------|---------|
| **One work object — identity** | No customer-visible architecture; drafts are the fake object | DA-01–06, DA-12 |
| **Throughput desk** | First-20 lists; hidden findings; two-review compare unscoped | DA-07, DA-08, DA-04 compare children |
| **Eval-first spine** | Demo/wizard still teach a casual start on Working | DA-09 |
| **Career defense — meeting** | ADR/print can omit finding 21 with no shout | DA-11 |
| **Continuity** | Scope switch clears the only in-flight tracker | DA-10 |

## Run order

**ADR first, then schema, then API, then desk.** Prefer **01 → 02 → 03 → 06 → 05 → 04**. Then **12** (backfill; after 02/03). Then **07 / 08 / 11** (inventory; independent of each other after 04 preferred). Then **09**. Then **10**.

**01** must not rewrite 0068 / 0069 / 0072 bodies. **02** must not merge tables or put sealed bytes on `dbo.Architectures`. **05** must not rename HTTP draft routes in place without redirects. **07 / 11** must not silently drop findings. **09** must not delete Guided eval chrome. **10** must not fork LK-10 wait copy. **12** must not invent a 40th engine or a fuzzy SystemName merge across tenants.

| # | Prompt file | Flaw it mitigates | Owner (do not fork) |
|---|----------------|-------------------|---------------------|
| 01 | `durable-architecture-01-adr-customer-architecture-identity.md` | Identity exists only as an internal pointer; July object-model assessment is stale | New ADR 0074; do not rewrite 0068 |
| 02 | `durable-architecture-02-schema-name-and-draft-fk.md` | Architectures have no display name; drafts have no `ArchitectureId` | Migration 323/339 leftovers |
| 03 | `durable-architecture-03-api-list-get-ensure.md` | No customer list/get for identities | `ArchitectureIdentityService` extend, not replace |
| 04 | `durable-architecture-04-working-architecture-desk.md` | Monday morning opens a review or a draft, not a system | ADR 0069 chrome leftover; do not fork IS-02 Home |
| 05 | `durable-architecture-05-stop-draftid-as-architectureid.md` | SPA `architectureId` is `DraftId` | Draft workspace hooks leftover |
| 06 | `durable-architecture-06-ensure-identity-on-first-save.md` | Identity created only on Created-origin runs | `EnsureCreatedRunIdentityAsync` too late |
| 07 | `durable-architecture-07-inventory-showing-n-of-m.md` | Reviews hub defaults to 20 | `load-runs-page-model.ts` |
| 08 | `durable-architecture-08-hidden-filter-honesty.md` | Density filter hides open work without a count | Findings visibility leftover |
| 09 | `durable-architecture-09-working-eval-leakage.md` | Demo compare + wizard launcher on Working | IS-08 / LK-15 leftovers; do not fork LK-15 CI |
| 10 | `durable-architecture-10-inflight-rehydrate-on-architecture.md` | Scope switch clears sessionStorage in-flight | Do not fork LK-10 wait chrome |
| 11 | `durable-architecture-11-career-export-complete-inventory.md` | ADR generator caps at 20 findings | `adr-from-run-slices.ts`; do not fork LK-09 trail |
| 12 | `durable-architecture-12-backfill-existing-rows.md` | Legacy runs/drafts have null identity | Conservative link, not SystemName fuzzy merge |

## Already shipped — do not re-open

| Item | Evidence |
|------|----------|
| Physical `dbo.Architectures` + `ArchitectureId` on reviews | `323_Architectures.sql`, `SqlArchitectureIdentityRepository` |
| Architecture versions lattice | `339_ArchitectureVersions.sql`, `ArchitectureVersionRecord` |
| Identity service for Created-origin + source-run link | `ArchitectureIdentityService.cs` |
| Working one-primary start | ADR 0069, `working-start-route.ts` |
| Spawn-locked draft handoff | ADR 0072, `ArchitectureDraftHandoffPanel` |
| BFF / session XSS | **LK-05–07** — do not implement here |
| Document undo | ADR 0071 / LK-02 |
| Draft save conflicts | LK-12 — keep local or reload, not merge |
| Density gate / trail gate | ADR 0070 / 0073 |
| Coverage engines | `HOLD_NO_COVERAGE_ENGINES.md` until G-REAL-06 |

## Global constraints (every prompt)

- Working-tree safety: `.\scripts\agent\check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** / overflow (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** rewrite ADR 0067, 0068, 0069, 0070, 0071, 0072, 0073, or 0050 in place. **Do not** merge draft and review tables.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate (IS-05).
- **Do not** add a 40th coverage engine or fake frontier transcripts.
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. **TB-645** vocabulary (architecture, review, finding, sealed review record). Do **not** call a draft a sealed record.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named in the prompt. `.\scripts\ci\agent-compile-check.ps1` when C# changes. No full-solution builds, no dev servers unless the prompt says so.
- UI: Carbon density, sentence case, no ghost/link `Button`, form validation **TB-2005**.
- C#: one class per file; no `ConfigureAwait(false)` in tests; blank line before `if` / `foreach` unless first in method; check nulls; prefer LINQ and concrete types.
- New ADRs must include **Trade-offs**, **Constraints**, and **Expected impact** per `docs/architecture/adrs/template.md`.
- All SQL DDL for a database stays in that database’s single DDL file **and** a numbered DbUp migration (repo pattern: `ArchLucid.sql` + `ArchLucid_Unified_Schema.sql` + `ArchLucid.Persistence/Migrations/NNN_*.sql`). Next NNN is one greater than the current max.
- Tenant isolation: every new query is scoped (ADR 0037). No per-architecture ACL invention in V1 — same workspace scope as drafts/reviews.

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided behavior, **whether `ArchitectureId` is now distinct from `DraftId`**, which ADR was added or Accepted, and whether Guided/demo/trial still work without that prompt. Do not mark LK, IS, LS, SD, CR, FD, AD, CD, WA, RS, LD, or LI as undone.
