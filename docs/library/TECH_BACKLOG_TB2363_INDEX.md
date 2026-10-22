> **Scope:** Contributor-reference — structural refactor cluster **TB-2363**–**TB-2372**. Merge into `TECH_BACKLOG.md` summary table + detail sections when that file is stable. Not a buyer or operator document.

# Structural refactor follow-on (UI + graph orchestration) — TB-2363–TB-2372

**Opened:** 2026-08-19. Owner ask: if you had to refactor 10 things, what would they be — file backlog items.

**Thesis:** Done **TB-2353**–**TB-2362** fixed IA chrome and introduced mapping layers (`unified-review-workspace-tabs`, `review-lifecycle-verb-map`, `operator-attention-taxonomy`) without finishing structural consolidation. Refactor debt remains: dual tab query params in deep links, parallel find-a-page indexes, scattered next-action builders, twin review workspace shells, vocabulary-rail duplication, home layout forks, attention data partitioned ad hoc, graph materialization without an explicit pipeline, deferred-chunk sprawl, and lifecycle display leaking API field names. This cluster refactors code structure and contracts — not new buyer-facing jobs.

**Do not reopen (closed loops):** **TB-2353**–**TB-2362** (IA chrome — do not re-litigate copy; extend contracts only). **TB-2343**–**TB-2352** (engines/graph inputs). **TB-2333**–**TB-2342** (composition-root strangler — **TB-2334**–**TB-2342** remain open there; do not duplicate Api→Host moves). **TB-2232** canonical next-action *widget* (refactor registry, do not redesign home guidance). **TB-1831** create-intent `archTab` traffic honesty (update paths when migrating hrefs, do not delete REA/REC rows without replacement).

**Ship order:** **TB-2363** (archTab href elimination) → **TB-2364** / **TB-2365** (find-a-page index + vocabulary rail factory) → **TB-2366** (next-action registry) → **TB-2367** (review workspace shell) → **TB-2368** (home section composer) → **TB-2369** (attention partitions) → **TB-2370** (graph materialization pipeline) → **TB-2371** (deferred-chunk manifest) → **TB-2372** (lifecycle display projection).

| ID | Title | Quality | Pri | Window | Size |
| --- | --- | --- | --- | --- | --- |
| TB-2363 | Eliminate `archTab` from deep links; one `reviewTab` href builder | Maintainability | P2 | V1 | M |
| TB-2364 | Shared find-a-page index for header search + command palette | Maintainability | P2 | V1 | M |
| TB-2365 | Vocabulary rail factory; drop `archTab` \| `reviewTab` href kinds | Maintainability | P2 | V1 | M |
| TB-2366 | Consolidate next-action builders into one phase registry | Maintainability | P2 | V1 | L |
| TB-2367 | Single `ReviewWorkspaceShell` (create-home + committed lifecycle) | Maintainability | P2 | V1.1 | L |
| TB-2368 | Operator home section composer (one layout matrix) | Maintainability | P2 | V1 | M |
| TB-2369 | Attention partition model across unfinished / assigned / alerts / awaiting | Maintainability | P2 | V1.1 | L |
| TB-2370 | Explicit graph materialization stage pipeline | Testability | P2 | V1 | L |
| TB-2371 | Route-level deferred-chunk manifest + import tests | Maintainability | P2 | V1 | M |
| TB-2372 | Lifecycle display projection boundary (no API verbs in chrome) | Maintainability | P2 | V1 | S |

---

## TB-2363 — Eliminate `archTab` from deep links; one `reviewTab` href builder (P2) — **V1**

**Window:** V1 — Maintainability (URL contract).

**Priority:** P2.

**Source:** Owner ask 2026-08-19. Residual after **TB-2355** V1 slice (`unified-review-workspace-tabs` reads both params; `buildArchitectureWorkspaceTabHref` emits `reviewTab`).

**Problem:** Dozens of href builders, vocabulary rails, tests, and traffic-workbook rows still emit or assert `?archTab=`. Readers must know two param names and mapping tables; bookmarks split across params; grep cannot enforce a single tab SoT.

**Approach:**

1. Add `buildReviewWorkspaceTabHref(runId, tab, options?)` as the only supported tab deep-link builder (canonical `ReviewDetailTabId`).
2. Migrate create-home-specific links through the arch↔review map internally; stop writing `archTab` to the URL.
3. Update traffic honesty rows (REA, REC, REF, …) to `reviewTab` equivalents where lifecycle allows.
4. Vitest: ban `archTab=` in `archlucid-ui/src` except legacy redirect tests in `unified-review-workspace-tabs.test.ts`.

**Acceptance:** Grep guard passes; `readReviewDetailTabFromHref` and create-home workspace both resolve from `reviewTab` URLs; no production href builder sets `archTab`.

**Out of scope:** Full tab-bar UI merge (**TB-2367**). Reopening **TB-2355** acceptance text.

**Peers:** `unified-review-workspace-tabs.ts`, `architecture-workspace-tabs.ts`, `package-*-vocabulary.ts`, `run-work-queue-groups.ts`.

**Size estimate:** M.

---

## TB-2364 — Shared find-a-page index for header search + command palette (P2) — **V1**

**Window:** V1 — Maintainability (discovery).

**Priority:** P2.

**Source:** Owner ask 2026-08-19. Residual after **TB-2356** (placeholder/aria alignment only).

**Problem:** `GlobalSearchBar` queries `/api/proxy/v1/search`; `CommandPalette` indexes `NAV_GROUPS`, curated tasks, docs, and recent views separately. Two ranking contracts, duplicate route lists, and drift risk when nav changes.

**Approach:**

1. Introduce `findPageSearchIndex` (static nav + help + curated tasks + optional API merge).
2. Header combobox and palette both call the same search function and share result shape.
3. Keep Insights Ask and evidence-trail search out of this index (**TB-2196** / **TB-2316** boundaries).

**Acceptance:** One module owns find-a-page entries; Vitest asserts header and palette surface the same top match for a fixture query; `GLOBAL_FIND_PAGE_SEARCH` helper text unchanged.

**Out of scope:** Merging evidence-trail search. Help drawer full-text index (**TB-2238** Done).

**Peers:** `GlobalSearchBar.tsx`, `CommandPalette.tsx`, `GLOBAL_FIND_PAGE_SEARCH`, `command-palette-curated-tasks.ts`.

**Size estimate:** M.

---

## TB-2365 — Vocabulary rail factory; drop `archTab` \| `reviewTab` href kinds (P2) — **V1**

**Window:** V1 — Maintainability (pairwise rails).

**Priority:** P2.

**Source:** Owner ask 2026-08-19. Residual after **TB-2239** glossary expansion and **TB-2355** tab mapping.

**Problem:** `package-activity-audit-trail-vocabulary.ts`, `package-evidence-evidence-graph-vocabulary.ts`, `package-governance-approval-queue-vocabulary.ts`, and siblings duplicate rail markup and accept `PackageActivityHrefKind = "archTab" | "reviewTab"`. Each rail re-implements peer links and tab param choice.

**Approach:**

1. `createPackageTabVocabularyRail({ currentTab, peerTab, copy })` using `buildReviewWorkspaceTabHref` only.
2. Migrate existing package vocabulary modules to the factory; delete per-rail `hrefKind` parameters.
3. Extend `vocabulary-product-language-guard.test.ts` pattern if new rails land.

**Acceptance:** No `archTab` \| `reviewTab` type unions in vocabulary folder; pairwise rails share one test harness.

**Out of scope:** New glossary content. Help-topic rails outside review package tabs.

**Peers:** `PackageActivityAuditTrailVocabularyRail`, `package-*-vocabulary.ts`, **TB-2363**.

**Size estimate:** M.

---

## TB-2366 — Consolidate next-action builders into one phase registry (P2) — **V1**

**Window:** V1 — Maintainability (guidance).

**Priority:** P2.

**Source:** Owner ask 2026-08-19. Residual after Done **TB-2232** (one home widget) and **TB-2361** (habit-loop optional trim).

**Problem:** `buildPostCommitHabitLoop`, `resolve-review-package-do-this-next.ts`, `first-review-guide-state.ts`, and operator-home canonical next-action logic each maintain overlapping action ids (Compare, Start another, Schedule recurrence, sponsor packet) with different filters and labels.

**Approach:**

1. Define `ReviewLifecycleNextAction` registry keyed by `(surface, phase)` with stable action ids.
2. Thin wrappers: habit loop and review package read from registry; home canonical slot reads same ids.
3. Vitest: no duplicate action ids across surfaces for the same phase; **TB-2361** bans remain enforced centrally.

**Acceptance:** One registry file is the SoT for post-finalize and in-review optional actions; habit-loop test imports registry constants.

**Out of scope:** GTM quote-to-proof paths. New buyer jobs beyond existing registry entries.

**Peers:** `post-commit-habit-loop.ts`, `resolve-review-package-do-this-next.ts`, `first-review-guide-state.ts`, Done **TB-2232**.

**Size estimate:** L.

---

## TB-2367 — Single `ReviewWorkspaceShell` (create-home + committed lifecycle) (P2) — **V1.1**

**Window:** V1.1 — Maintainability (twin workspace).

**Priority:** P2.

**Source:** Owner ask 2026-08-19. **TB-2355** V1.1 scope (one tab model on `/architecture/reviews/[id]`).

**Problem:** `ArchitectureCreatedWorkspace` and `ReviewDetailWorkspace` each mount tab lists, panel switches, hash handling, and deferred boundaries. Lifecycle differs by query intent and manifest state, not by needing two shells.

**Approach:**

1. `ReviewWorkspaceShell` with `lifecycle: "create-home" | "in-review" | "finalized"` drives visible tabs and default panel set.
2. Retire duplicate tab bar components; single `onTabChange` writes canonical `reviewTab`.
3. Stage panels hide instead of swapping URL param families.

**Acceptance:** One tab list component on the route; Vitest forbids second tab SoT; deep links from **TB-2363** land on same tab ids across lifecycles.

**Out of scope:** Per-tab screenshot polish (**TB-1836**–**TB-1865**). Diagram fidelity (**TB-2351**).

**Peers:** `ArchitectureCreatedWorkspace.tsx`, `ReviewDetailWorkspace`, **TB-2363**, Done **TB-1831**.

**Size estimate:** L.

---

## TB-2368 — Operator home section composer (one layout matrix) (P2) — **V1**

**Window:** V1 — Maintainability (home layout).

**Priority:** P2.

**Source:** Owner ask 2026-08-19. Residual after **TB-2360** (stickiness below fold) and Done **TB-2331** (eval-empty spine).

**Problem:** `BuyerPolishedHomePageBody` and `OperatorHomePageBody` duplicate section ordering rules; phase changes require editing two components and deferred chunk hosts.

**Approach:**

1. `composeOperatorHomeSections({ phase, buyerPolishedShell, metrics })` returns ordered section descriptors.
2. Single renderer maps descriptors to deferred chunks (`unfinished`, `hero`, `command-center`, `recent-reviews`, `stickiness`, `below-fold`).
3. Vitest matrix: returning phase never mounts hero + stickiness + unfinished as three equal above-fold spines.

**Acceptance:** One composer function; both shell modes use it; **TB-2360** ordering rules encoded once.

**Out of scope:** Core Pilot help copy (**TB-1355**–**TB-1357**). Stickiness metrics API (**TB-2191** Done).

**Peers:** `OperatorHomePageView.tsx`, `resolveOperatorHomeWorkspacePhase`, **TB-2360**.

**Size estimate:** M.

---

## TB-2369 — Attention partition model across unfinished / assigned / alerts / awaiting (P2) — **V1.1**

**Window:** V1.1 — Maintainability (attention data).

**Priority:** P2.

**Source:** Owner ask 2026-08-19. **TB-2353** V1 slice (label taxonomy only).

**Problem:** `UnfinishedWorkRail`, `GovernanceReviewsAwaitingNavBadge`, assigned-to-me findings count, alerts nav, and `run-work-queue-groups` each query different APIs and use overlapping “needs attention” semantics without a shared partition type.

**Approach:**

1. `AttentionPartition` enum aligned with `operator-attention-taxonomy.ts`.
2. Shared client hook or server summary DTO maps queue rows to partitions (no merged backend required in V1 slice).
3. V1.1 optional: single `GET /v1/operator/attention-summary` feeding home + nav badges.

**Acceptance:** Inventory test lists every attention surface with partition; home does not show two unlabeled blocks for the same partition/work item.

**Out of scope:** Merging alert-engine backends. Reopening **TB-2191** stickiness card metrics.

**Peers:** `operator-attention-taxonomy.ts`, `UnfinishedWorkRail`, `GovernanceReviewsAwaitingNavBadge`, `run-work-queue-groups.ts`.

**Size estimate:** L.

---

## TB-2370 — Explicit graph materialization stage pipeline (P2) — **V1**

**Window:** V1 — Testability (context graph).

**Priority:** P2.

**Source:** Owner ask 2026-08-19. Residual after Done **TB-2343**–**TB-2350** (materializers added incrementally).

**Problem:** `DefaultGraphBuilder` and friends invoke materializers in implicit order; skip/enrich rules are scattered; unit tests must mock entire builder to test one materializer interaction.

**Approach:**

1. `IGraphMaterializationStage` with ordered registration (actors → assumptions → QA/failure modes → cost enrichers → …).
2. Pipeline runner with per-stage telemetry and fail-fast options for tests.
3. Move **TB-2348** enricher hook into named stage (no behavior change).

**Acceptance:** Each stage has focused tests; pipeline order documented in one registrar; no new graph semantics.

**Out of scope:** New finding engines. Reopening Done **TB-2344**–**TB-2347** behavior.

**Peers:** `DefaultGraphBuilder`, `RequestActorMaterializer`, `CostConstraintProjectedSpendEnricher`, Done **TB-2343** cluster.

**Size estimate:** L.

---

## TB-2371 — Route-level deferred-chunk manifest + import tests (P2) — **V1**

**Window:** V1 — Maintainability (First Load JS).

**Priority:** P2.

**Source:** Owner ask 2026-08-19. Residual after Done **TB-2145** (home below-fold deferral) and run-detail deferred imports.

**Problem:** `run-detail-page-view-deferred-chunks.tsx`, `reviews-hub-deferred-chunks.tsx`, and `operator-home-page-view-deferred-chunks.tsx` each define dynamic imports ad hoc; tests grep source strings (`run-detail-bundle-deferred-imports.test.ts`) and break when paths change.

**Approach:**

1. Per-route `*-chunk-manifest.ts` listing chunk id, import path, and test id.
2. Deferred wrapper components generated from manifest (or single `loadDeferredChunk(manifestEntry)`).
3. Import tests assert manifest completeness instead of raw `import("@/…")` strings.

**Acceptance:** Manifest files exist for home, reviews hub, and run detail; deferred-import tests read manifests; no duplicate dynamic import paths off-manifest.

**Out of scope:** New code-splitting strategy for marketing routes. Full bundle analyzer CI.

**Peers:** `operator-home-page-view-deferred-chunks.tsx`, `reviews-hub-deferred-chunks.tsx`, `run-detail-page-view-deferred-chunks.tsx`.

**Size estimate:** M.

---

## TB-2372 — Lifecycle display projection boundary (no API verbs in chrome) (P2) — **V1**

**Window:** V1 — Maintainability (verbs).

**Priority:** P2.

**Source:** Owner ask 2026-08-19. Residual after **TB-2357** / **TB-2362** (string sweeps).

**Problem:** `manifestStatus`, `committedRunsInScope`, and similar API fields are formatted in JSX-adjacent code paths outside `review-lifecycle-verb-map.ts`; new surfaces can reintroduce `committed` or internal status strings.

**Approach:**

1. `projectReviewLifecycleForDisplay(input)` centralizes Finalized / Sealed review record / Finalize action labels.
2. Ban direct use of `committed` in customer chrome via existing guard + ESLint or Vitest inventory on `archlucid-ui/src/components` and `operator-home` formatters.
3. API DTO field names stay internal; projection layer only.

**Acceptance:** All stickiness/home/recent-review outcome strings flow through projection module; **TB-2362** guard list shrinks to projection-only.

**Out of scope:** Changing API field names. Apply verb on alert triage surfaces.

**Peers:** `review-lifecycle-verb-map.ts`, `OperatorStickinessSnapshotCard`, `formatOperatorHomeRecentReviewsOutcome`, `manifest-status-display.ts`.

**Size estimate:** S.
