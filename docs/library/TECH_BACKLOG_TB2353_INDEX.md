> **Scope:** Contributor-reference — residual ease-of-use / less-confusing cluster **TB-2353**–**TB-2362**. Merge into `TECH_BACKLOG.md` summary table + detail sections when that file is stable. Not a buyer or operator document.

# Ease-of-use / residual confusion (IA and chrome) — TB-2353–TB-2362

**Opened:** 2026-08-17. Owner ask: if you wanted to make ArchLucid easier to use or less confusing, what would you do — file backlog items.

**Thesis:** First-session, confusion-reduction, next-action, nav, glossary, persona, and intake-chooser waves already shipped. Residual confusion is *information architecture and leftover chrome*: too many homes, too many “needs me” queues, two workspaces on one URL, overlapping search, and verbs that still disagree after the glossary maps.

**Do not reopen (closed ease-of-use loops):** **TB-2130**–**TB-2139** (first-session); **TB-2148**–**TB-2157** (confusion-reduction — Done 2026-08-09; `TECH_BACKLOG_OPEN.md` cluster row was stale); **TB-2175**–**TB-2184** (do-this-next / understanding / forecast / sponsor-lens / job views / provenance / unpack / invitee / synopsis / disposition); **TB-2232**–**TB-2241** (canonical next-action, nav=authority+lifecycle, `[reviewId]`, finish→sponsor, demo spine, help corpus, glossary expansion, persona name, hidden routes); **TB-2330**–**TB-2332** (nav-gate Vitest, eval-empty home spine, job chooser vs path tabs); **TB-2131** / **TB-2234** / **TB-2240** (buyer nouns / URL / persona). Do **not** reopen **TB-2282**–**TB-2300** (artifact capture) or **TB-2343**–**TB-2352** (engines). Do not duplicate still-open page-polish clusters (**TB-1446**–**TB-1462** drafts, **TB-1134**+ screenshot rows, **TB-2284**–**TB-2295** chips/buttons, **TB-2090**–**TB-2093** chrome removal, **TB-1355**–**TB-1357** Core Pilot help spine, **TB-1638** help dual, **TB-1210** users-page honesty).

**Ship order:** **TB-2361** (post-finalize optional list) → **TB-2362** (live chrome vocab) → **TB-2357** (lifecycle verb map) → **TB-2354** (object map) → **TB-2360** (returning home) → **TB-2359** (do-it-again family) → **TB-2356** (find-a-page) → **TB-2353** (attention taxonomy) → **TB-2355** / **TB-2358** (V1.1 twin tabs + Architecture Intelligence positioning).

| ID | Title | Quality | Pri | Window | Size |
| --- | --- | --- | --- | --- | --- |
| TB-2353 | One “needs me” attention taxonomy across home, nav, and reviews | Adoption friction | P2 | V1.1 | L |
| TB-2354 | Persistent object map: draft, review, sealed record | Adoption friction | P2 | V1 | M |
| TB-2355 | One tab model on `/architecture/reviews/[id]` (`archTab` vs `reviewTab`) | Adoption friction | P3 | V1.1 | L |
| TB-2356 | Collapse GlobalSearch and command palette into one find-a-page | Adoption friction | P2 | V1 | M |
| TB-2357 | Single lifecycle verb map: Finalize vs Seal vs committed | Adoption friction | P2 | V1 | M |
| TB-2358 | Position Architecture Intelligence as a review tool, not a second product | Adoption friction | P3 | V1.1 | M |
| TB-2359 | One “do it again” family: Compare vs Validate vs Recurrence vs Start another | Adoption friction | P2 | V1 | M |
| TB-2360 | Returning-home: one primary spine after the first review exists | Adoption friction | P2 | V1 | M |
| TB-2361 | Post-finalize optional list: drop founder/CLI/sales tasks from operator chrome | Adoption friction | P2 | V1 | S |
| TB-2362 | Residual eng vocabulary in live chrome (committed, golden harness, operator diagnostics) | Adoption friction | P2 | V1 | S |

---

## TB-2353 — One “needs me” attention taxonomy across home, nav, and reviews (P2) — **V1.1**

**Window:** V1.1 — Adoption friction (cross-system attention). A V1 slice may unify *labels* on home + the awaiting-action badge without merging backends.

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Residual after Done **TB-2232** (one next-action *widget*) and **TB-2191** (stickiness cockpit shipped).

**Problem:** Home and Governance each surface a different “what needs me?” lane. Independent surfaces include: Alerts, Assigned to me, Findings, Digests, Notifications, `UnfinishedWorkRail`, stickiness cockpit, reviews list `"needs-attention"` groups (`run-work-queue-groups.ts`), and `GovernanceReviewsAwaitingNavBadge`. **TB-2232** put one *guidance* slot on home; it did not make those queues one taxonomy. Users cannot tell which inbox is authoritative.

**Approach:**

1. Publish a four-kind attention map in `UI_DESIGN_SYSTEM.md` (e.g. unfinished work, assigned to me, alerts, awaiting approval) and map every current surface onto one kind.
2. V1 slice: home rails + nav badge copy use the same kind names; do not invent a ninth queue.
3. V1.1: retire or demote duplicate lanes so a returning user sees one primary inbox plus overflow.

**Acceptance:** A Vitest/inventory lists every home/nav attention surface against the four-kind map; home no longer shows two unlabeled “needs attention” blocks for the same work item.

**Out of scope:** Reopening **TB-2232** next-action resolver. Merging alert-engine backends. **TB-2191** stickiness metrics (keep the card; stop competing unlabeled).

**Peers:** `UnfinishedWorkRail`, `OperatorHomePageView`, `GovernanceReviewsAwaitingNavBadge`, `run-work-queue-groups.ts`.

**Size estimate:** L.

---

## TB-2354 — Persistent object map: draft, review, sealed record (P2) — **V1**

**Window:** V1 — Adoption friction (object IA).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Residual after Done **TB-2130** (one *create* default), **TB-2153** (canonical-home *labels*), **TB-2332** (job chooser vs path tabs).

**Problem:** Left nav lists Architectures (`ARCHITECTURES_LIST_PATH`), Reviews (`OPERATOR_NAV_LINK_LABELS.reviewPackage`), and Sealed review records as peer homes. Home still says “Two ways in:” Create architecture vs Review architecture (ADR 0067, `operator-home.ts`) and Start review is **not** in left nav. The difference is explained only on the home cards — not as a persistent object map — so drafts, in-flight reviews, and sealed records feel like three products.

**Approach:**

1. Add a compact three-object map (draft → review → sealed record) on Home, Architectures, and Reviews headers (reuse glossary nouns; do not add a fourth object).
2. Keep ADR 0067 co-equal *create* vs *review* on first-run home; for returning users, rank by workspace phase (drafts waiting vs reviews in flight vs sealed).
3. Vitest: nav labels + home map share one noun set; Start review remains a job, not a fourth nav home.

**Acceptance:** Architectures / Reviews / Sealed review records headers each state the other two objects in one sentence; first-run home still does not rank Create above Review.

**Out of scope:** Page-polish density on `/architectures` (**TB-1446**–**TB-1462**). Changing Quick start as first-run primary (**TB-2130**).

**Peers:** `PilotNavGroupBuilder`, `OPERATOR_HOME_ARCHITECTURE_LIFECYCLE_INTRO_LABEL`, `OPERATOR_NAV_LINK_LABELS.sealedReviewRecords`.

**Size estimate:** M.

---

## TB-2355 — One tab model on `/architecture/reviews/[id]` (P3) — **V1.1**

**Window:** V1.1 — Adoption friction (twin workspace chrome).

**Priority:** P3.

**Source:** Owner ask 2026-08-17. Residual after Done **TB-1831** (create-intent `archTab`) and **TB-2234** (`[reviewId]` URLs).

**Problem:** One route hosts two mutually exclusive tab systems. Create-home `ArchitectureCreatedWorkspace` uses `?archTab=` (seven tabs: overview, diagram, clarifications, findings, evidence, governance, activity — `architecture-workspace-tabs.ts`). Committed packages use `?reviewTab=` on `ReviewDetailWorkspace` (eight tabs: overview, findings, evidence, policies, decisions-remediation, review-package, architecture, activity — `review-detail-workspace-tabs.ts`). Bookmarks and “where did my diagram tab go?” fracture after finalize.

**Approach:**

1. Define one tab id set for the review URL; unused tabs hide by lifecycle instead of swapping SoT.
2. Redirect legacy `archTab` / `reviewTab` values.
3. Stage chrome (draft vs in-review vs finalized) stays a status, not a second tab bar.

**Acceptance:** Deep links to either query param land on the same tab ids; Vitest forbids a second tab SoT on this route.

**Out of scope:** Per-tab screenshot polish (**TB-1836**–**TB-1865**). Diagram fidelity (**TB-2351**).

**Peers:** `ARCHITECTURE_WORKSPACE_TAB_PARAM`, `REVIEW_DETAIL_TAB_PARAM`, TB-1831 create-intent.

**Size estimate:** L.

---

## TB-2356 — Collapse GlobalSearch and command palette into one find-a-page (P2) — **V1**

**Window:** V1 — Adoption friction (discovery).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Residual after Done **TB-2237** (help corpus split) and pairwise rails **TB-2196** / **TB-2316** (find-a-page ≠ evidence search ≠ sidebar).

**Problem:** Users still face overlapping “find something” entry points: header `GlobalSearchBar` (“Find a page” / “Go to…”), Ctrl+K `CommandPalette` (nav + help + tasks), `HelpSearchPanel`, Insights **Ask review questions**, and Insights **Search review evidence**. Pairwise copy rails exist (`search-surface-disambiguation.ts`); GlobalSearch and the palette still both mean “go to a page.”

**Approach:**

1. Make header find-a-page and Ctrl+K the same command surface (one index, one placeholder contract).
2. Keep Ask and Search review evidence as distinct Insights jobs (do not merge into find-a-page).
3. Help drawer search stays help-only; do not re-index runbooks (**TB-2237**).

**Acceptance:** One find-a-page SoT; Vitest that header and palette share placeholder/aria strings; Ask and evidence search remain separately labeled.

**Out of scope:** Workspace Ask backend (**TB-2200** Done). Help module loader (**TB-2238** Done).

**Peers:** `GLOBAL_FIND_PAGE_SEARCH`, `CommandPalette`, `GlobalSearchBar`, `EVIDENCE_TRAIL_SEARCH`.

**Size estimate:** M.

---

## TB-2357 — Single lifecycle verb map: Finalize vs Seal vs committed (P2) — **V1**

**Window:** V1 — Adoption friction (verbs).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Residual after Done **TB-2131** buyer nouns and glossary expansion **TB-2239**.

**Problem:** Primary CTA is `"Finalize review"` (`resolve-review-package-primary-action.ts`) while a tab is `"Sealed review record"`, lists say `"Seal integrity"`, and live chrome still prints `committed` (`formatOperatorHomeRecentReviewsOutcome` → `` `${committed} committed · ${active} active` ``; `OperatorStickinessSnapshotCard` “committed ·”). `manifestStatusForDisplay` maps API `committed` → `"Finalized"` in some places only. Apply remains a different verb (alert triage, model governance) and should stay out of this map.

**Approach:**

1. One verb table: user-visible **Finalize** (action) / **Finalized** (state) / **Sealed review record** (artifact). Ban `committed` in customer chrome.
2. Keep Seal as the artifact noun, not a second CTA.
3. Vitest guard on home/stickiness/recent-reviews outcome strings.

**Acceptance:** Home, stickiness, and review primary CTA never show `committed`; status chips say Finalized.

**Out of scope:** API field names. Apply on admin/alert surfaces. **TB-2362** golden/operator diagnostics (sibling sweep).

**Peers:** `manifestStatusForDisplay`, `REVIEW_DETAIL_TAB_LABELS["review-package"]`, `operator-home-recent-reviews-outcome.ts`.

**Size estimate:** M.

---

## TB-2358 — Position Architecture Intelligence as a review tool, not a second product (P3) — **V1.1**

**Window:** V1.1 — Adoption friction (second product).

**Priority:** P3.

**Source:** Owner ask 2026-08-17. Residual after Done **TB-2241** (hid the nav row) and open **TB-2352** (engine quality on the default package).

**Problem:** `/architecture/architecture-intelligence` is contextual-only (`nav-contextual-only-operator-paths.ts`) but still marketed in Ask/help as “closed-loop architecture reasoning or the golden regression harness” (`ask-architecture-intelligence-vocabulary.ts`, page subtitle on `ArchitectureIntelligencePageClient`). Hiding it from nav without renaming it leaves a second product reachable from Ask, findings, and help.

**Approach:**

1. Rename customer chrome to a review-adjacent job (e.g. “Try another reasoning pass”) — not “golden regression harness.”
2. Entry points: review overflow / Ask rail only; keep off left nav.
3. Help subtitle matches the job, not the internal lane.

**Acceptance:** Customer-visible strings on the route + Ask rail omit `golden` / `closed-loop`; Vitest on the vocabulary module.

**Out of scope:** Feeding closed-loop into the committed package (**TB-2352**). Un-hiding as a top-level nav product.

**Peers:** `ASK_ARCHITECTURE_INTELLIGENCE_WHY_TWO`, `CONTEXTUAL_ONLY_OPERATOR_NAV_DESTINATIONS`, **TB-2352**.

**Size estimate:** M.

---

## TB-2359 — One “do it again” family: Compare vs Validate vs Recurrence vs Start another (P2) — **V1**

**Window:** V1 — Adoption friction (overlapping next jobs).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Residual after Done **TB-2299**–**TB-2300** (second-review reuse + compare default) and **TB-2178** (sponsor-lens compare).

**Problem:** After a review, chrome offers Compare two reviews, Validate review (`OPERATOR_NAV_LINK_LABELS.replayReview`, `/internal/validate-route`), Start another review, Schedule recurring review, Manage recurrence schedules, and Impact preview — all answering “what’s next?” `buildPostCommitHabitLoop` lists several of these as optionals, including both schedule *and* manage recurrence.

**Approach:**

1. One family: **Start another** (new review), **Compare** (two packages), **Schedule** (recurrence), **Validate** (system-admin replay — keep off the default post-finalize list).
2. Collapse duplicate recurrence optionals to one link.
3. Impact preview stays Insights, not a post-finalize twin of Compare.

**Acceptance:** Post-finalize optional list has at most one recurrence action and does not include Validate review; Vitest on `buildPostCommitHabitLoop`.

**Out of scope:** Help dual IA (**TB-1638**). Replay engine behavior. **TB-2361** founder/CLI optionals (ship first).

**Peers:** `post-commit-habit-loop.ts`, Insights Compare / Impact preview, `INTERNAL_REPLAY_PATH`.

**Size estimate:** M.

---

## TB-2360 — Returning-home: one primary spine after the first review exists (P2) — **V1**

**Window:** V1 — Adoption friction (home competition).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Residual after Done **TB-2331** (stickiness hidden only on `eval-empty`) and **TB-2232** (one next-action slot).

**Problem:** `BuyerPolishedHomePageBody` still stacks `UnfinishedWorkRail` → first-run hero / command center → stickiness cockpit → recent reviews → below-fold. **TB-2331** only returns null when `workspacePhase === "eval-empty"`. Returning users get unfinished work *and* stickiness *and* recent reviews competing with the canonical next-action.

**Approach:**

1. After first review exists: one primary block (canonical next-action + unfinished work if any) then recent reviews; demote stickiness below the fold or into workspace context.
2. Keep eval-empty hero exclusive (do not reopen **TB-2331**).
3. Vitest on `OperatorHomePageView` / phase resolver: returning phase does not mount hero + stickiness + unfinished as three equal spines.

**Acceptance:** Returning-home screenshot/Vitest: at most one above-fold “what to do” region besides Recent reviews.

**Out of scope:** Core Pilot help spine copy (**TB-1355**–**TB-1357**). Stickiness *data* (**TB-2191**).

**Peers:** `OperatorHomeStickinessCockpit`, `UnfinishedWorkRail`, `resolveOperatorHomeWorkspacePhase`.

**Size estimate:** M.

---

## TB-2361 — Post-finalize optional list: drop founder/CLI/sales tasks from operator chrome (P2) — **V1**

**Window:** V1 — Adoption friction (wrong audience in the habit loop).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Residual after Done **TB-2175** do-this-next and **TB-2192** recurrence decline.

**Problem:** `buildPostCommitHabitLoop` always appends “Collect quote-to-proof packet” whose description is `Run collect-first-pilot-proof.ps1 and attach go-no-go artifacts for sales handoff`, plus “Run governance dry-run.” Those are founder/GTM/CLI jobs, not architect post-finalize work. They teach the wrong product.

**Approach:**

1. Remove quote-to-proof and governance dry-run from the default operator optional list (keep GTM docs / Internal Ops).
2. Keep sponsor-packet primary and Start another / Compare as architect jobs.
3. Vitest: habit-loop labels never mention `.ps1` or quote-to-proof.

**Acceptance:** Post-finalize optional list has no CLI or sales-handoff items in the architect workspace.

**Out of scope:** Recurrence vs Compare family (**TB-2359**). Creating the quote-to-proof packet in GTM.

**Peers:** `post-commit-habit-loop.ts` (`quote-to-proof`, `governance-dry-run`).

**Size estimate:** S.

---

## TB-2362 — Residual eng vocabulary in live chrome (P2) — **V1**

**Window:** V1 — Adoption friction (incomplete purge).

**Priority:** P2.

**Source:** Owner ask 2026-08-17. Residual after Done **TB-2131** / **TB-2239** / **TB-2240**. Reviews hub copy already bans “architecture package” in `reviews-hub-copy.test.ts`; leaks remain elsewhere.

**Problem:** Customer-visible strings still include: home/stickiness `committed ·`; Architecture Intelligence `golden regression harness`; trust evidence `"Operator diagnostics API routes"` / `"Evidence routes (operator diagnostics)"` (`RunTrustEvidenceCardSection.tsx`); deferred Reviews hub `"Loading package includes"`. Product-language guard intentionally does not ban `run` (`vocabulary-product-language-guard.test.ts`).

**Approach:**

1. Replace those strings with Finalize/Finalized, review tool naming (pair **TB-2358**), and buyer diagnostics labels.
2. Change `"Loading package includes"` to `"Loading what each review contains"` (title already `REVIEWS_HUB_INCLUDES_TITLE`).
3. Extend the product-language guard for these exact chrome leaks (not a blanket `run` ban).

**Acceptance:** Grep/Vitest fails on the listed live strings; trust-evidence collapsible omits `operator` in the buyer-polished shell.

**Out of scope:** Users & roles operator-vs-architect honesty (**TB-1210**). Lifecycle verb *table* (**TB-2357** owns committed→Finalized systematically; this row is the leftover string sweep if **TB-2357** has not shipped yet — implement whichever is picked first, skip overlapping files).

**Peers:** `OperatorStickinessSnapshotCard`, `operator-home-recent-reviews-outcome.ts`, `RunTrustEvidenceCardSection`, `reviews-hub-deferred-chunks.tsx`.

**Size estimate:** S.
