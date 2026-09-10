<!-- Customer-architecture Composer prompts — paste one prompt per session.
     Origin: 2026-09-05 owner follow-on. ArchLucid is a working-architect tool
     (all-day use; livelihoods may depend on the sealed record), not a casual
     evaluator. Wave 14 after durable-architecture-00-index.md (DA-01–12).
     Load-bearing bet: named, listable dbo.Architectures as the customer object.
     Do not merge DraftRequests and Runs. Do not fork BFF. Do not paste DA-01–12.
     Do not implement from this index. -->

# Customer-architecture mitigations — Composer prompt set (CA-01–CA-50)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

**The remaining livelihood failure is the unit of work.** Persistence already has `dbo.Architectures` + `ArchitectureId` on reviews + `ArchitectureVersions`. The paying desk still treats **draft rows** as architectures (`architectureId` = `DraftId` in the SPA) and **reviews** as the Monday-morning object. Identity is created as a side effect of Created-origin runs, has no display name, and is not listed, opened, compared, or resumed as a system.

Wave 13 (**DA-01–12**, `master` #1676) named that bet in twelve bundled sessions. **This set supersedes DA for execution.** Do **not** paste `durable-architecture-*.md` after this index exists. If a CA row’s DA twin already shipped on the branch, skip that CA file and record the skip in the PR.

**Owner authorization (this wave):** make `dbo.Architectures` the **customer-visible durable identity**. Drafts stay `DraftRequests`. Reviews stay `Runs`/`Reviews`. Sealed records stay `GoldenManifests`. **Do not merge tables.** **Do not rewrite ADR 0068, 0069, or 0072 bodies** — supersede with **ADR 0074**. **Do not implement the BFF** (LK-05–07). **Do not add a 40th engine**.

**Do not implement from this index.** Paste one numbered file per Composer session.

**Do not treat this set as a V1 assessment scorecard.** Do not add GTM cohort work (**M-90**, **M-44**, **M-91**, **M-92**) or closed assurance programs (**TB-135** / **TB-136**). **TB-645** vocabulary stays.

## What this set *does* change

| Bet | From | To | Prompts |
|-----|------|----|---------|
| **Contract** | Internal KM/recurrence pointer | ADR 0074: Architecture is the customer noun | CA-01 |
| **Schema** | GUID-only row; drafts have no parent FK | Display name + draft FK + mapped contracts | CA-02–06 |
| **HTTP** | No customer list/get | List / get / ensure / PATCH + OpenAPI | CA-07–13 |
| **Lifecycle** | Identity only on Created-origin runs | First draft save; spawn links; conservative backfill | CA-14–19 |
| **Routing honesty** | `/architecture/architectures/{draftId}` is the editor | Identity desk vs draft child; `architectureId` means ArchitectureId | CA-20–24 |
| **Monday desk** | Drafts hub + reviews hub as the system | Named portfolio + children + Working nav | CA-25–38 |
| **Career inventory** | First 20; silent ADR cap; hidden filters | Showing N of M; refuse silent truncation | CA-39–41 |
| **Instrument edges** | Draft vocabulary; sessionStorage in-flight; eval launchers | Search, CLI, help, recurrence, rehydrate, eval off Working | CA-42–48 |
| **Portfolio** | No archive | Soft-archive; residual audit | CA-49–50 |

## What this set does *not* change

Keep: tenant isolation (ADR 0037); sealed-manifest immutability (ADR 0039); ADR 0068 two **kernels** and **separate SQL tables**; spawn lock (no localStorage “edit anyway”); ADR 0072 review-as-canonical-URL **after spawn**; desktop review tabs as a full strip; Guided / demo / trial as explicit eval sessions; `MUTATION_UNDO_WINDOW_SECONDS = 300` for the silent Undo toast; document undo (ADR 0071); density gate (ADR 0070); trail finalize gate (ADR 0073).

Do **not** collapse desktop review tabs behind **More**. Do **not** auto-switch stored Guided users to Working. Do **not** add a 40th coverage-shaped engine. Do **not** check in fake frontier transcripts. Do **not** restore system-wide breadcrumbs (**TB-2090**). Do **not** invent live presence avatars or finding-comment chat. Do **not** paste **LK-05–07** / **IS-15**. Do **not** invent a draft-diff merge engine (LK-12 owns conflict recovery). Do **not** lengthen 300s undo. Do **not** unseal sealed records. Do **not** invent per-architecture ACL.

## Relationship to prior sets

| Set | Role | Status |
|-----|------|--------|
| **DD / PT / WD / LI / LD / RS / WA / CD / AD / FD** | Overlays | Do not re-run / do not fork |
| **IS / LS / SD / CR** | Waves 8–11 | Do not fork |
| **LK-01–15** | Wave 12 kernel | **Do not fork.** BFF, undo, trail gate stay there |
| **DA-01–12** | Wave 13 skeleton | **Do not paste.** This set owns execution |
| **CA-01–50** | **This set** — wave 14 customer object | Run these |
| **AO-01–50** | Wave 17 Working locator | [`architecture-object-00-index.md`](architecture-object-00-index.md) — **supersedes this set’s “keep ADR 0072 review-as-canonical-URL” for Working**. Do not paste CA to change the locator |

If a CA row lists a DA/LK/IS owner, **do not re-implement that file**. Implement only the leftover in *What to build*. If the DA twin already landed, skip and say so.

## Diagnosis classes (wave 14)

| Class | Livelihood failure | Prompts |
|-------|--------------------|---------|
| **One work object — contract** | No customer-visible architecture | CA-01 |
| **One work object — persistence** | Name and parent FK missing | CA-02–06 |
| **One work object — HTTP** | Cannot list or open identities | CA-07–13 |
| **One work object — lifecycle** | Identity too late; history unlinked | CA-14–19 |
| **One work object — URL** | DraftId masquerades as ArchitectureId | CA-20–24 |
| **Throughput desk** | Monday morning opens a draft or a review | CA-25–38 |
| **Career defense** | Silent first-20 / hidden filters / truncated ADR | CA-39–41 |
| **Instrument edges** | Search/CLI/help/in-flight still draft-shaped | CA-42–48 |
| **Portfolio** | No hide-from-desk; no residual audit | CA-49–50 |

## Run order

**ADR first, then schema, then API, then lifecycle, then routes, then desk.**

Prefer **01 → 02 → 03 → 04 → 05 → 06**. Then **07 → 08 → 09 → 10 → 11 → 12 → 13**. Then **14 → 15 → 16 → 17**. Then **18 → 19**. Then **20 → 21 → 22 → 23 → 24**. Then **25 → 26 → 27 → 28 → 29 → 30 → 31**. Then **32 → 33 → 34 → 35 → 36 → 37 → 38**. Then **39 / 40 / 41** (independent after 25/27). Then **42–48**. Then **49**. Then **50** last.

**01** must not rewrite 0068 / 0069 / 0072 bodies. **02–06** must not merge tables or put sealed bytes on `dbo.Architectures`. **11–13** must not make `GET /v1/architecture/drafts` the architecture list. **18** must not fuzzy-merge by SystemName. **20–21** must not 404 old draft bookmarks. **32** must not hide desktop review tabs. **41** must not silently drop findings. **46** must not fork LK-10 wait copy. **47** must not delete Guided eval chrome. **49** must not hard-delete children.

| # | Prompt file | Flaw it mitigates | Owner (do not fork) |
|---|----------------|-------------------|---------------------|
| 01 | `customer-architecture-01-adr-0074-customer-identity.md` | Identity is an internal pointer; July object-model assessment is stale | DA-01 |
| 02 | `customer-architecture-02-schema-display-name.md` | Architectures have no display name | DA-02 leftover columns |
| 03 | `customer-architecture-03-schema-draft-fk.md` | Drafts have no `ArchitectureId` | DA-02 leftover FK |
| 04 | `customer-architecture-04-persist-name-in-repositories.md` | Contracts/repos still GUID-only | DA-02 leftover mapping |
| 05 | `customer-architecture-05-list-pointers-are-computed.md` | Temptation to denormalize CurrentDraftId | DA-03 leftover |
| 06 | `customer-architecture-06-ddl-sync-and-physical-tests.md` | Dual DDL + migration drift | DA-02 leftover tests |
| 07 | `customer-architecture-07-list-query-and-total-count.md` | No identity list query | DA-03 leftover list |
| 08 | `customer-architecture-08-get-identity-with-children.md` | No get-by-id + child summaries | DA-03 leftover get |
| 09 | `customer-architecture-09-ensure-for-draft-method.md` | Ensure only exists for Created-origin runs | DA-03 / DA-06 leftover |
| 10 | `customer-architecture-10-patch-display-name.md` | Cannot rename the career object | unique |
| 11 | `customer-architecture-11-http-list-and-get.md` | No customer HTTP collection | DA-03 leftover HTTP |
| 12 | `customer-architecture-12-http-patch-and-rbac.md` | PATCH/RBAC not wired | unique |
| 13 | `customer-architecture-13-openapi-client-route-matrix.md` | Snapshot / client / nav matrix drift | Http-Surface leftover |
| 14 | `customer-architecture-14-ensure-on-first-draft-save.md` | Identity created too late | DA-06 |
| 15 | `customer-architecture-15-name-from-system-title.md` | Untitled forever / rename fights the draft | DA-06 leftover name |
| 16 | `customer-architecture-16-spawn-review-copies-architecture-id.md` | Start review drops the parent | DA-06 leftover spawn |
| 17 | `customer-architecture-17-created-origin-still-ensures.md` | Legacy Created-origin path must not regress | `EnsureCreatedRunIdentityAsync` |
| 18 | `customer-architecture-18-conservative-backfill.md` | History has null identity | DA-12 |
| 19 | `customer-architecture-19-unlinked-legacy-honesty.md` | Unlinked rows look like a complete desk | DA-12 leftover honesty |
| 20 | `customer-architecture-20-split-identity-and-draft-routes.md` | `{architectureId}` segment is a draft id | DA-04 / DA-05 leftover routes |
| 21 | `customer-architecture-21-draft-bookmark-redirect.md` | Old draft URLs 404 or stay a second desk | DA-05 leftover redirect |
| 22 | `customer-architecture-22-stop-draftid-as-architectureid.md` | SPA `architectureId` is `DraftId` | DA-05 |
| 23 | `customer-architecture-23-hook-naming-drift-guard.md` | Rename regresses without CI | DA-05 leftover guard |
| 24 | `customer-architecture-24-new-draft-creates-identity.md` | `/architectures/new` still only makes a draft | DA-06 leftover UX |
| 25 | `customer-architecture-25-working-identities-hub.md` | Hub lists drafts and calls them architectures | DA-04 leftover hub |
| 26 | `customer-architecture-26-architecture-desk-chrome.md` | No Monday desk for one identity | DA-04 leftover desk |
| 27 | `customer-architecture-27-child-reviews-table.md` | Reviews of a system are a second product | DA-04 leftover children |
| 28 | `customer-architecture-28-current-draft-and-new-version.md` | Open draft / clone not parented | WA-10 leftover |
| 29 | `customer-architecture-29-latest-seal-and-versions.md` | Version lattice is invisible | migration 339 leftover |
| 30 | `customer-architecture-30-compare-from-siblings.md` | Compare is unscoped / demo-shaped | DA-04 leftover compare |
| 31 | `customer-architecture-31-rename-form-on-desk.md` | Name is write-once | CA-10 leftover UI |
| 32 | `customer-architecture-32-working-nav-architectures-primary.md` | Nav still means drafts | i18n leftover |
| 33 | `customer-architecture-33-working-start-prefers-architecture.md` | Alt+N / continue-last ignore identity | IS-03 leftover |
| 34 | `customer-architecture-34-palette-open-architecture.md` | Palette opens draft ids | IS-08 leftover |
| 35 | `customer-architecture-35-empty-states-never-sample.md` | Empty hub heroes samples | CD-02 leftover |
| 36 | `customer-architecture-36-guided-keeps-draft-inventory.md` | Working change must not delete Guided teaching | ADR 0067 leftover |
| 37 | `customer-architecture-37-overview-last-open-architecture.md` | Overview restores a review, not a system | CD-11 leftover |
| 38 | `customer-architecture-38-recents-use-architecture-id.md` | Recents store draft ids as architectures | operator-recent-views leftover |
| 39 | `customer-architecture-39-showing-n-of-m.md` | First-20 looks complete | DA-07 |
| 40 | `customer-architecture-40-hidden-filter-honesty.md` | Filters hide open work with no count | DA-08 |
| 41 | `customer-architecture-41-career-export-no-silent-cap.md` | ADR export silent 20-finding cap | DA-11 |
| 42 | `customer-architecture-42-global-search-architectures.md` | Search finds drafts/reviews only | search leftover |
| 43 | `customer-architecture-43-cli-list-get-architectures.md` | CLI has no identity noun | CLI leftover |
| 44 | `customer-architecture-44-help-glossary-vocabulary.md` | Glossary says Architectures = drafts | GLOSSARY leftover |
| 45 | `customer-architecture-45-recurrence-scoped-to-architecture.md` | Recurrence is run-shaped | migration 324 leftover |
| 46 | `customer-architecture-46-inflight-rehydrate-by-architecture.md` | Scope switch clears in-flight | DA-10 |
| 47 | `customer-architecture-47-working-eval-leakage.md` | Demo/wizard still on Working hub | DA-09 |
| 48 | `customer-architecture-48-vocabulary-drift-guards.md` | Tests pin “architectures = drafts” | review-terminology leftover |
| 49 | `customer-architecture-49-soft-archive-architecture.md` | Portfolio cannot hide a retired system | unique |
| 50 | `customer-architecture-50-acceptance-audit.md` | Residual DraftId-as-architectureId | unique |

## Already shipped — do not re-open

| Item | Evidence |
|------|----------|
| Physical `dbo.Architectures` + `ArchitectureId` on reviews | `323_Architectures.sql`, `SqlArchitectureIdentityRepository` |
| Architecture versions lattice | `339_ArchitectureVersions.sql` |
| Identity service for Created-origin + source-run link | `ArchitectureIdentityService.cs` |
| DA-01–12 prompt files | `.cursor/prompts/durable-architecture-*.md` — **do not paste** |
| Working one-primary start | ADR 0069, `working-start-route.ts` |
| Spawn-locked draft handoff | ADR 0072, `ArchitectureDraftHandoffPanel` |
| BFF / session XSS | **LK-05–07** — do not implement here |
| Document undo | ADR 0071 / LK-02 |
| Draft save conflicts | LK-12 |
| Density gate / trail gate | ADR 0070 / 0073 |

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
- All SQL DDL for a database stays in that database’s single DDL file **and** a numbered DbUp migration (`ArchLucid.sql` + `ArchLucid_Unified_Schema.sql` + `ArchLucid.Persistence/Migrations/NNN_*.sql`). Next NNN is one greater than the current max (today **365** → start at **366** unless a later migration landed).
- Tenant isolation: every new query is scoped (ADR 0037). No per-architecture ACL invention in V1.

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided behavior, **whether `ArchitectureId` is now distinct from `DraftId`**, which ADR was added or Accepted, and whether Guided/demo/trial still work without that prompt. Do not mark DA, LK, IS, LS, SD, CR, FD, AD, CD, WA, RS, LD, or LI as undone — except **DA-01–12 execution**, which this set supersedes.
