<!-- Architecture-object Composer prompts — paste one prompt per session.
     Origin: 2026-09-07 livelihood restatement (issue #1): the work object is
     still a pipeline. ArchLucid is a working-architect tool; all-day use;
     livelihoods may depend on the sealed record. Wave 17 after
     defensible-record-00-index.md (DR-01–16) and customer-architecture-00-index.md
     (CA-01–50). Load-bearing bet: Architecture identity is the Working locator;
     review is a nested job. Do not merge DraftRequests and Runs.
     Do not implement from this index. -->

# Architecture-object mitigations — Composer prompt set (AO-01–AO-50)

ArchLucid sells a **seat for a repeat professional** (`docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R13; ADR 0052). People will sit in it much of the day; livelihoods may depend on the sealed record.

**This set is wave 17. It owns only issue #1:** the paying desk still treats a **review / run** as Monday morning. CA-01–50 productized `dbo.Architectures` as a named parent. ADR 0072 still makes the **review URL** canonical after spawn. ADR 0069 Start still prefers **`reviewDetailPath(inFlightReviewId)`**. `startReviewFromArchitectureHref` still passes a **draft id** as `sourceArchitectureId`. The SPA still has **142** peer routes.

Later livelihood issues (insight generation, dual buyer/Working skin, batch-priced what-if, in-memory undo, collaboration ACL) are **out of this wave**. Do not smuggle them in.

**Owner authorization (this wave):** on Working, the **canonical locator** is the architecture identity. Drafts and reviews are **nested jobs**. `/architecture/reviews` is an **inbox**. Guided / demo / trial may keep peer review URLs. **Do not merge tables.** **Do not rewrite ADR 0068 / 0069 / 0072 / 0074 bodies** — supersede the Working locator clauses with **ADR 0077**.

**Do not implement from this index.** Paste one numbered file per Composer session.

**Do not treat this set as a V1 assessment scorecard.** No GTM **M-90 / M-44 / M-91 / M-92**. No reopen **TB-135 / TB-136**. **TB-645** vocabulary stays.

## What this set *does* change

| Bet | From | To | Prompts |
|-----|------|----|---------|
| **Contract** | Review URL canonical after spawn (0072); Start = in-flight review (0069) | ADR 0077: architecture is the Working locator | AO-01 |
| **URL taxonomy** | Peer `/architecture/reviews/{id}` and `/architectures/{draftId}` | Nested `/architectures/{architectureId}/reviews\|drafts/{id}` | AO-02–05 |
| **Redirects / share** | Bookmarks, CLI, email, clipboard teach a run | Working copies and opens the architecture locator | AO-06–12 |
| **Monday desk** | Home / Start / recents / palette open a review | Portfolio + desk + chips; review is a verb | AO-13–25 |
| **Inboxes & tools** | Reviews hub / Ask / graph / search are peer products | Inbox + bind-to-open-architecture | AO-26–32 |
| **Job chrome** | Review detail is a separate app after spawn | Nested workspace, sticky identity, return to desk | AO-33–38 |
| **Sprawl / CI** | 142 unclassified Working destinations | Roles inventory, nav/palette gates, acceptance ratchet | AO-39–50 |

## What this set does *not* change

Keep: tenant isolation (ADR 0037); sealed-manifest immutability (ADR 0039); ADR 0068 two **kernels** and **separate SQL tables**; spawn lock (no live editor on locked drafts); document undo (ADR 0071); density gate (ADR 0070); trail finalize gate (ADR 0073); disposition 409 (ADR 0076); desktop review **tabs** as a full strip; Guided / demo / trial as eval sessions; `MUTATION_UNDO_WINDOW_SECONDS = 300`; BFF session (LK-05–07).

Do **not** collapse desktop review workspace tabs behind **More**. Do **not** restore system-wide breadcrumbs (**TB-2090**). Do **not** add a 40th coverage engine. Do **not** invent live presence, finding-comment chat, or per-architecture ACL. Do **not** lengthen 300s undo. Do **not** unseal. Do **not** paste **DR** fail-closed work unless a row names a leftover nest (AO-37 / AO-38).

## Relationship to prior sets

| Set | Role | Status |
|-----|------|--------|
| **DR-01–16** | Wave 16 fail-closed kernel | **Do not re-run.** AO-37/38 nest pin/room; do not rewrite 0075/0076 |
| **PC / CA / DA** | Identity exists; review still the locator | **Do not re-run CA/DA.** This set **supersedes CA’s “keep ADR 0072 review-as-canonical-URL”** for Working |
| **LK-04 / 0072 handoff** | Draft is not a second live editor | Keep lock; **change where Working sends you** (AO-07) |
| **IS-03 / CA-33 Start** | In-flight review first | **AO-15 changes this** |
| Overlay waves (LI…FD) | Chrome | Do not re-run / do not fork |

If a row lists a CA/PC/DR owner, **do not re-implement that file**. Implement only the leftover in *What to build*.

## Diagnosis classes (wave 17)

| Class | Livelihood failure | Prompts |
|-------|--------------------|---------|
| **Contract** | Named parent still not the locator | AO-01–03 |
| **Nested URLs** | Review is a peer product in the address bar | AO-04–12 |
| **Monday desk** | Home/Start/recents/palette resume a run | AO-13–25 |
| **Bind tools** | Ask/graph/search/compare ignore the open system | AO-26–32 |
| **Stay on the desk** | Finalize/spawn/pin/room exile you to a run | AO-33–38 |
| **Ratchet** | 142 routes + no CI that Start is an architecture | AO-39–50 |

## Run order

**ADR → taxonomy → nested routes → redirects → Start/Home → desk → bind tools → chrome → inventory/CI.**

Prefer **01 → 02 → 03**. Then **04 → 05 → 06 → 07 → 08**. Then **09–12** (parallel after 08). Then **15** (resolver — load-bearing; may share a PR with 01). Then **13 → 14 → 16 → 17 → 18 → 19**. Then **20 → 21 → 22 → 23 → 24 → 25**. Then **26–32**. Then **33–38**. Then **39 → 40 → 41 → 47 → 50**. **42–46, 48–49** independent after 15/16.

**01** must not rewrite 0068/0069/0072/0074 bodies. **04/05** must not delete legacy pages before **06/07**. **15** must not return `reviewDetailPath`. **22** must pass **ArchitectureId**, not DraftId. **26** must not hide the inbox. **39** must not delete routes. **45** must not delete Guided chooser. **49** must not fuzzy-merge by SystemName. **50** must not claim issues #2–7 closed.

| # | Prompt file | Flaw it mitigates | Owner (do not fork) |
|---|----------------|-------------------|---------------------|
| 01 | `architecture-object-01-adr-0077-architecture-is-the-locator.md` | Review URL is still the Working locator after spawn | New ADR 0077 |
| 02 | `architecture-object-02-route-taxonomy-nested-jobs.md` | No typed nested URL shape | AO-01 |
| 03 | `architecture-object-03-vocabulary-review-is-a-job-verb.md` | Review taught as a destination product | CA-44 leftover |
| 04 | `architecture-object-04-nested-review-route.md` | Job UI only lives at `/architecture/reviews/{id}` | CA-27 leftover |
| 05 | `architecture-object-05-nested-draft-route.md` | `{architectureId}` segment is still a draft id | CA-20 leftover |
| 06 | `architecture-object-06-redirect-peer-review-urls.md` | Old review bookmarks keep the peer product alive | AO-04 |
| 07 | `architecture-object-07-spawn-handoff-stays-on-architecture.md` | Spawn exile to a review URL | LK-04 / 0072 destination |
| 08 | `architecture-object-08-canonical-path-helpers-and-call-sites.md` | Working still mints `reviewDetailPath`; source id is DraftId | `startReviewFromArchitectureHref` |
| 09 | `architecture-object-09-share-and-bookmark-copy-architecture-url.md` | Clipboard copies a run | unique |
| 10 | `architecture-object-10-email-and-export-deep-links.md` | Sponsor/PDF deep links are run-centric | PC-13 leftover hrefs |
| 11 | `architecture-object-11-cli-print-architecture-urls.md` | CLI prints `/architecture/reviews/{guid}` | CA-43 leftover |
| 12 | `architecture-object-12-guided-keeps-peer-review-urls.md` | Nested routes would delete teaching | ADR 0067 / CA-36 |
| 13 | `architecture-object-13-home-is-architecture-portfolio.md` | Home resumes a review | PC-05 leftover |
| 14 | `architecture-object-14-nav-architectures-primary-reviews-inbox.md` | Sidebar daily tools outrank the system | CA-32 / daily hrefs |
| 15 | `architecture-object-15-start-alt-n-opens-architecture.md` | `resolveWorkingStartHref` returns `reviewDetailPath` first | IS-03 / CA-33 |
| 16 | `architecture-object-16-last-open-always-architecture.md` | Recents store a review as the locator | CA-37 / CA-38 |
| 17 | `architecture-object-17-palette-open-architecture-before-review.md` | Ctrl+K opens reviews as files | PC-11 / CA-34 |
| 18 | `architecture-object-18-overview-and-stickiness-use-architecture.md` | Overview restores a run | CD-11 leftover |
| 19 | `architecture-object-19-empty-home-never-sample-reviews.md` | Empty paying desk heroes samples | CA-35 / LD-02 |
| 20 | `architecture-object-20-architecture-desk-is-the-all-day-shell.md` | Identity page is a summary card | CA-26 leftover |
| 21 | `architecture-object-21-inflight-is-a-chip-on-architecture.md` | Wait page is the locator | PC-08 / CA-46 |
| 22 | `architecture-object-22-start-review-stays-parented.md` | `/reviews/new` is a second start product | IS-03 chooser leftover |
| 23 | `architecture-object-23-child-reviews-table-is-the-job-list.md` | Job history lives on the Reviews hub | CA-27 leftover |
| 24 | `architecture-object-24-current-draft-is-a-pane-not-a-site.md` | Draft editor is a second website | CA-28 leftover |
| 25 | `architecture-object-25-sealed-records-are-child-rows.md` | Sealed index competes with Home | PC-12 leftover |
| 26 | `architecture-object-26-reviews-hub-is-inbox-not-home.md` | Reviews hub is Monday morning | AD-07 role |
| 27 | `architecture-object-27-governance-return-to-architecture.md` | Queue only deep-links a run | unique |
| 28 | `architecture-object-28-findings-default-scope-open-architecture.md` | Findings landing is tenant-wide | PC-11 leftover |
| 29 | `architecture-object-29-compare-defaults-to-siblings.md` | Compare is unscoped | CA-30 / DR-11 |
| 30 | `architecture-object-30-ask-binds-to-open-architecture.md` | Ask opens empty without a package | WA-05 / LS-05 |
| 31 | `architecture-object-31-evidence-graph-binds-to-open-architecture.md` | Graph is a top-level canvas | PC-12 / LS-05 |
| 32 | `architecture-object-32-search-scope-open-architecture.md` | Search is tenant-wide while a system is open | WA-19 / CA-42 |
| 33 | `architecture-object-33-review-detail-is-nested-workspace.md` | Nested route still chromes as a peer app | ReviewDetailWorkspace |
| 34 | `architecture-object-34-sticky-architecture-chrome.md` | No identity while scrolling the job | AD-03 / TB-2090 |
| 35 | `architecture-object-35-finalize-returns-to-architecture-desk.md` | Success lands on a packet island | 0073 navigation |
| 36 | `architecture-object-36-clone-and-new-version-stay-on-architecture.md` | Clone fragments identity | WA-10 / CA-28 |
| 37 | `architecture-object-37-pin-compare-under-architecture.md` | Pin is two pipeline tabs | DR-11 leftover |
| 38 | `architecture-object-38-room-is-architecture-plus-job.md` | Room is `?presenter=1` on a run | DR-16 / PC-09 |
| 39 | `architecture-object-39-inventory-working-peer-routes.md` | 142 routes unclassified | ui_routes.md |
| 40 | `architecture-object-40-hide-unbound-eval-destinations-on-working.md` | Tools are the product before a system exists | PC-04 leftover |
| 41 | `architecture-object-41-palette-subseteq-architecture-scoped-actions.md` | Palette dumps the site map | PC-12 leftover |
| 42 | `architecture-object-42-help-monday-object-is-architecture.md` | Help narrates first-review as the job | WA-04 / CA-44 |
| 43 | `architecture-object-43-keyboard-work-on-the-architecture-desk.md` | Shortcuts only live on a review route | PC-11 / AD-10 |
| 44 | `architecture-object-44-deep-page-back-is-architecture.md` | Deep pages invert back | AD-03 |
| 45 | `architecture-object-45-guided-two-door-unchanged.md` | Nested Working would delete Guided chooser | ADR 0067 |
| 46 | `architecture-object-46-demo-screenshots-must-not-show-reviews-as-working-home.md` | Sales screenshots teach Reviews as Home | ux-audit registry |
| 47 | `architecture-object-47-nav-and-route-matrix-drift-guard.md` | Next overlay restores in-flight-review-first | CA-23 pattern |
| 48 | `architecture-object-48-server-prefs-last-open-architecture-id.md` | Server last-open still a run id | IS-13 leftover |
| 49 | `architecture-object-49-unlinked-review-honesty-on-the-desk.md` | Orphans look like a complete desk | CA-18 / CA-19 |
| 50 | `architecture-object-50-acceptance-guard-reviews-cannot-be-working-home.md` | No ratchet that issue #1 stayed closed | PC acceptance-guard pattern |

## Already shipped — do not re-open

| Item | Evidence |
|------|----------|
| `dbo.Architectures` + draft/review FKs | ADR 0074, CA schema |
| Identity desk + child table chrome | CA-25–31 components |
| Spawn-locked draft not a live editor | ADR 0072 handoff panel |
| Working one Start control | ADR 0069 chrome (resolver **target** still wrong — AO-15) |
| BFF / trail gate / density gate / 409 | LK / 0073 / 0070 / 0076 |

## Global constraints (every prompt)

- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path <file>` before editing a tracked file. Exit 2 → skip and report.
- **Do not** hide desktop review workspace tabs behind **More** / overflow (`.cursor/rules/no-collapse-workspace-tabs.mdc`).
- **Do not** rewrite ADR 0067, 0068, 0069, 0070, 0071, 0072, 0073, 0074, 0075, or 0076 in place. **Do not** merge draft and review tables.
- **Do not** change `DeterministicInsightDensityGate` demotion predicate.
- **Do not** add a 40th coverage engine or fake frontier transcripts.
- Claim discipline: `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`. **TB-645** vocabulary. Do **not** call a draft a sealed record.
- Verification: focused Vitest from `archlucid-ui/` and scoped C# tests named in the prompt. `pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1` when C# changes. No full-solution builds, no dev servers unless the prompt says so.
- UI: Carbon density, sentence case, no ghost/link `Button`, form validation **TB-2005**. Disabled reasons visible (not native `title` only).
- C#: one class per file; no `ConfigureAwait(false)` in tests; blank line before `if` / `foreach` unless first in method; check nulls; prefer LINQ and concrete types.
- New ADRs must include **Trade-offs**, **Constraints**, and **Expected impact** per `docs/architecture/adrs/template.md`.
- Tenant isolation: every new query is scoped (ADR 0037). No per-architecture ACL in V1.

## After each prompt

Summarize: files changed, tests run, residual risk, Working vs Guided behavior, **whether Working Start/Home can still open `/architecture/reviews/{id}` as the locator**, which ADR was added or Accepted, and whether Guided/demo/trial still work. Do not mark CA, DA, DR, PC, or LK as undone — except **CA’s “keep ADR 0072 review-as-canonical-URL after spawn”**, which this set supersedes for Working.

## Prompt files (paste one per session)

| # | File |
|---|------|
| 01 | `architecture-object-01-adr-0077-architecture-is-the-locator.md` |
| 02 | `architecture-object-02-route-taxonomy-nested-jobs.md` |
| 03 | `architecture-object-03-vocabulary-review-is-a-job-verb.md` |
| 04 | `architecture-object-04-nested-review-route.md` |
| 05 | `architecture-object-05-nested-draft-route.md` |
| 06 | `architecture-object-06-redirect-peer-review-urls.md` |
| 07 | `architecture-object-07-spawn-handoff-stays-on-architecture.md` |
| 08 | `architecture-object-08-canonical-path-helpers-and-call-sites.md` |
| 09 | `architecture-object-09-share-and-bookmark-copy-architecture-url.md` |
| 10 | `architecture-object-10-email-and-export-deep-links.md` |
| 11 | `architecture-object-11-cli-print-architecture-urls.md` |
| 12 | `architecture-object-12-guided-keeps-peer-review-urls.md` |
| 13 | `architecture-object-13-home-is-architecture-portfolio.md` |
| 14 | `architecture-object-14-nav-architectures-primary-reviews-inbox.md` |
| 15 | `architecture-object-15-start-alt-n-opens-architecture.md` |
| 16 | `architecture-object-16-last-open-always-architecture.md` |
| 17 | `architecture-object-17-palette-open-architecture-before-review.md` |
| 18 | `architecture-object-18-overview-and-stickiness-use-architecture.md` |
| 19 | `architecture-object-19-empty-home-never-sample-reviews.md` |
| 20 | `architecture-object-20-architecture-desk-is-the-all-day-shell.md` |
| 21 | `architecture-object-21-inflight-is-a-chip-on-architecture.md` |
| 22 | `architecture-object-22-start-review-stays-parented.md` |
| 23 | `architecture-object-23-child-reviews-table-is-the-job-list.md` |
| 24 | `architecture-object-24-current-draft-is-a-pane-not-a-site.md` |
| 25 | `architecture-object-25-sealed-records-are-child-rows.md` |
| 26 | `architecture-object-26-reviews-hub-is-inbox-not-home.md` |
| 27 | `architecture-object-27-governance-return-to-architecture.md` |
| 28 | `architecture-object-28-findings-default-scope-open-architecture.md` |
| 29 | `architecture-object-29-compare-defaults-to-siblings.md` |
| 30 | `architecture-object-30-ask-binds-to-open-architecture.md` |
| 31 | `architecture-object-31-evidence-graph-binds-to-open-architecture.md` |
| 32 | `architecture-object-32-search-scope-open-architecture.md` |
| 33 | `architecture-object-33-review-detail-is-nested-workspace.md` |
| 34 | `architecture-object-34-sticky-architecture-chrome.md` |
| 35 | `architecture-object-35-finalize-returns-to-architecture-desk.md` |
| 36 | `architecture-object-36-clone-and-new-version-stay-on-architecture.md` |
| 37 | `architecture-object-37-pin-compare-under-architecture.md` |
| 38 | `architecture-object-38-room-is-architecture-plus-job.md` |
| 39 | `architecture-object-39-inventory-working-peer-routes.md` |
| 40 | `architecture-object-40-hide-unbound-eval-destinations-on-working.md` |
| 41 | `architecture-object-41-palette-subseteq-architecture-scoped-actions.md` |
| 42 | `architecture-object-42-help-monday-object-is-architecture.md` |
| 43 | `architecture-object-43-keyboard-work-on-the-architecture-desk.md` |
| 44 | `architecture-object-44-deep-page-back-is-architecture.md` |
| 45 | `architecture-object-45-guided-two-door-unchanged.md` |
| 46 | `architecture-object-46-demo-screenshots-must-not-show-reviews-as-working-home.md` |
| 47 | `architecture-object-47-nav-and-route-matrix-drift-guard.md` |
| 48 | `architecture-object-48-server-prefs-last-open-architecture-id.md` |
| 49 | `architecture-object-49-unlinked-review-honesty-on-the-desk.md` |
| 50 | `architecture-object-50-acceptance-guard-reviews-cannot-be-working-home.md` |
