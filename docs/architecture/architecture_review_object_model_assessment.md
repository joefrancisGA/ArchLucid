# Architecture / architecture review object-model & IA assessment

**Status:** Assessment only. No product code, content, routes, navigation, tests, fixtures, or demo data were modified while producing this file. All findings are grounded in the current working tree as of 2026-07-13.

**Method:** Read-only repository inspection across `archlucid-ui/` (navigation config, route tree, page components, copy constants, help content, demo/seed data, e2e and unit tests) and the .NET backend (`ArchLucid.Contracts`, `ArchLucid.Core`, `ArchLucid.Application`, `ArchLucid.Persistence`, generated API client, SQL DDL). Every claim below cites a file and, where practical, a line number.

**Headline conclusion (read this first):** ArchLucid's data layer does **not** support "Architecture" as an independent, reusable, customer-managed object with its own permissions, ownership, versioning, and lifecycle distinct from a review. There is no `Architecture` table, no `ArchitectureId`, and no confirmed customer-visible pattern of one architecture being deliberately reused across many separate governed reviews. **Hypothesis B is confirmed: "Architecture review" (persisted as `Run`) is the durable top-level object; "Architecture" is pre-review draft content or an editable representation living inside a review.** A separate top-level **"Architectures"** navbar destination is **not warranted** by repository evidence, and — importantly — the current sidebar does not currently contain one (see §4).

**But:** this assessment also surfaces a direct, current, and unresolved conflict with this task's premise that "package" has been retired from customer-facing language. **It has not been.** Two days before this assessment, **TB-738** (shipped 2026-07-11) deliberately renamed the primary reviews-list noun **from** "Review packages" **to** "Architecture packages" across the sidebar, hub, and home surfaces, added automated drift-guard tests to keep it that way, and the backend now persists a `PackageOrigin` column (`Created` / `Reviewed`) as a first-class field on the `Runs` table. This is not legacy drift — it is the most recently shipped, deliberately tested decision in the terminology surface area, and it points in the opposite direction from this task's stated retirement of "package." §2 and the closing "Owner decisions required" section treat this as the single highest-stakes open item.

---

## 1. Current object model

Every customer-visible noun found in the product, and what the application currently appears to mean by it.

| Noun (as seen by customers) | What it currently means in the product | Backing identifier | Primary evidence |
|---|---|---|---|
| **Architecture** (nav group label; "Create architecture") | (a) A nav section heading grouping review-workflow actions; (b) the pre-review draft content a user types/uploads before starting a review | No standalone entity — see "Architecture draft" | `i18n.ts:103` (`OPERATOR_NAV_GROUP_LABELS.reviewWork = "Architecture"`); `pilot-nav-group-builder.ts:27` |
| **Architecture draft** | A saved, resumable, mutable description of intended architecture (name, diagram, context) that can be edited across sessions **before** a review starts. Explicitly stated not to start a review. | `dbo.DraftRequests` (`DraftId`), `SpawnedRunId` column | `architectures/page.tsx:34` ("Saving a draft does not start a review"); `guided-intake-copy.ts:100`; SQL table `dbo.DraftRequests` |
| **Architecture review / Review** | The end-to-end governed work unit: intake → evidence → findings → policy evaluation → decisions/approvals → commit → signed record → exports. This is the durable object a returning user opens. | `dbo.Runs` (`RunId`), API contract `ArchitectureRun` | `RunDetailWorkspaceChrome.tsx:38-45` (eyebrow "Architecture review", H1 = review title); `ArchLucid.Contracts/Metadata/ArchitectureRun.cs:16-40` |
| **Review package / Architecture package** | The customer-facing name for the same review object when presented as a list row, breadcrumb parent, or finalized deliverable — i.e., the *same* `Run`, just referred to with a different noun depending on which surface renders it | Same `RunId` | `i18n.ts:119` (nav = "Architecture packages"); `breadcrumb-map.ts:49` (breadcrumb = "Review packages"); `review-detail-workspace-tabs.ts:24` (a *tab inside* the review is also literally named "Review package") |
| **Architecture** (tab inside review detail) | The submitted design/diagram/narrative as a sub-view *within* a review — explicitly subordinate to findings/evidence rendered above it | Content on the `Run`, not a separate ID | `RunDetailSubmittedArchitectureSection.tsx:80` ("this is the source material you submitted") |
| **Finding** | An evidence-backed observation about the architecture, scoped to one review | `FindingId`, `RunId` | `types/finding-inspect.ts:4-21` |
| **Evidence / Evidence trail / Evidence graph** | Supporting material (uploads, diagrams, citations) and its provenance lineage, always scoped to one review | Artifacts + `RunId` | `RunDetailCaptureEvidenceSection.tsx:18-20`; `EVIDENCE_GRAPH_PAGE_TITLE` |
| **Evidence package** | A specific *export/trace bundle* (ZIP) of evidence for one review — distinct product noun from "architecture package," not the whole review object | ZIP export keyed by `RunId` | `glossary-definitions.ts:36-40`; `RunDetailRunActionsSection.tsx:50` ("Download evidence package (ZIP)") |
| **Governance approval / Decision** | An approval/rejection workflow item tied to one review at a specific manifest version | `dbo.GovernanceApprovalRequests` (`RunId`, `ManifestVersion`) | SQL table `dbo.GovernanceApprovalRequests` |
| **Signed review record / Signed decision record** | The finalized, versioned authority closure produced when a review is finalized | `dbo.GoldenManifests` (`ManifestId`, FK `RunId`) | `ManifestDetailPageView.tsx:249` ("Signed decision record", buyer) vs. line 250 ("Finalized architecture package", architect) |
| **Deliverables / Artifact bundle / Review bundle / Exports** | Generated output files (DOCX, PDF, ZIP) derived from a signed record or finalized review, for different audiences | `ArtifactBundle`, `EvidenceBundle` (backend types) | `buyer-polish-copy.ts:467-482` (`BUYER_MANIFEST_DELIVERABLES_HEADING`) |
| **Sponsor dashboard / Sponsor summary** | A workspace-wide rollup across finalized reviews (dashboard), or a per-review summary panel | Aggregation of `Run` rows | `ExecutiveDashboardPageHero.tsx:31-35`; `RunDetailExecutiveSummaryCtaCard.tsx:22-27` |
| **Assessment** | A verb/activity — running the evaluation pipeline against policies — not a customer-facing peer noun to "review" | N/A (activity, not entity) | `architecture-created-home-copy.ts` ("Run initial assessment"); `recurrence-schedule-activation-copy.ts` ("recurring assessments") |
| **Revision** | Almost entirely a governance workflow verb ("request revision"), not a data-model version concept exposed to customers | N/A | `governance-approval-help-guide-content.ts:41` |
| **Review run** | A legacy/rejected buyer noun for the same `Run` object, still leaking into trial-limit copy, cost-reporting labels, and CLI | `RunId` | `trial-limit-problem.ts:66`; `AiUsageCostBreakdownPanel.tsx:27` |
| **Package** (bare noun) | Not used as a standalone customer-facing noun; always appears as a compound ("architecture package," "evidence package," "proof package," "diligence package"; legacy UI: "review package") | — | See §2.3 |

**Structural read of the object model as shipped:** there are really only **two** durable, identifiable customer objects — the **architecture review** (`Run`) and, once committed, the **signed review record** (`GoldenManifest`, 1:N versions per run). Everything else (architecture draft, findings, evidence, governance approvals, deliverables) is content or output *attached to* a review. The "architecture," in its only persisted pre-review form (a `DraftRequest`), is scratch content with no reuse guarantee, no independent permissions, and no versioning beyond "the current saved state of one draft."

---

## 2. Conflict inventory

### 2.1 Architecture and review used interchangeably

| Location | Conflict |
|---|---|
| `RunDetailWorkspaceChrome.tsx:37-45` | Eyebrow says **"Architecture review"**, immediately followed by an optional **"System: {systemName}"** line and fields like "Review owner," "Review template" — three nested nouns (review / architecture / system) describing what is structurally one object |
| `ArchitectureCreatedWorkspaceHeader.tsx:26-35` | On the *same* `/reviews/{runId}` route (post-creation mode), the H1 is the **architecture name**, not a review title — the review detail route displays either an "architecture" identity or a "review" identity depending on query params (`fromGeneration=1&intent=create-architecture`) |
| `buyer-polish-copy.ts:81-94` | Home dual-path cards: **"Create an architecture"** vs. **"Review an existing architecture"** — phrased as two different objects/verbs, but both terminate in the same `createArchitectureRun` API call |
| `ArchitectureDraftWorkspace.tsx:43` (per help assessment) | Internal comment/doc calls the draft editor a **"Long-lived architecture draft editor,"** while the same component's primary CTA is **"Start architecture review"** — same screen, two nouns |
| Governance mode toggle (`governance-mode-vocabulary.ts:27-38`) | The identical `/reviews` list is called **"Architecture packages"** with governance mode off, and **"Reviews"** with it on — the *object* does not change, only the label, and a user who toggles the setting mid-session sees the primary nav noun change under them |

### 2.2 The Reviews destination presents itself as an architecture inventory

| Location | Conflict |
|---|---|
| `i18n.ts:43-46` (`RUNS_LIST_PAGE_TITLES`) | Both `buyerPolished` and `fullOperator` page titles for `/reviews` are **"Architecture Packages"** — the primary on-page H1 for the reviews list names it an architecture artifact, not a reviews list |
| `reviews-hub-copy.ts:5-6` | Subtitle: *"Start, resume, and inspect evidence-backed **architecture packages**."* |
| `reviews-hub-copy.ts:41-50` | Section headings: **"Recent architecture packages"**, **"No architecture packages yet,"** **"What a package includes"** |
| `reviews/page.tsx:7-9` | Browser tab `<title>` metadata is simply **"Reviews"** — disagreeing with the H1 on the same page |
| `route-static-titles.ts:15-18` | Static a11y/announcement title map also says **"Architecture Packages"** for `/reviews`, reinforcing the H1 over the tab title |

The net effect: a user who clicks **"Reviews"** in the nav lands on a page whose browser tab says "Reviews," whose H1 says "Architecture Packages," whose breadcrumb parent (when nested) says "Review packages," and whose table column header says "Review package" — four different nouns for one destination, on one page render.

### 2.3 "Package" remains visible — extensively, and it was recently reinforced, not retired

This directly contradicts the task's premise that "package" has been retired from customer-facing language.

**Navigation / hub / home (recently reinforced by TB-738, shipped 2026-07-11):**
- `i18n.ts:119` — `OPERATOR_NAV_LINK_LABELS.reviewPackage = "Architecture packages"` (primary sidebar item)
- `governance-mode-vocabulary.ts:29` — pilot-mode `reviewPlural = "Architecture packages"`
- `review-terminology-guard.test.ts:118-135` — a **drift guard test**, added for TB-738, that *fails the build* if `OPERATOR_NAV_LINK_LABELS.reviewPackage` is anything other than `"Architecture packages"` and if `RUNS_LIST_PAGE_TITLES.buyerPolished` is anything other than `"Architecture Packages"` — i.e., "package" as the primary nav noun is currently enforced, not merely tolerated

**Breadcrumbs, tabs, and detail surfaces:**
- `breadcrumb-map.ts:49` — `"reviews": "Review packages"`; lines 254/480/571 — singular fallback **"Review package"**
- `review-detail-workspace-tabs.ts:24` — a tab inside the review workspace literally named **"Review package"**
- `RunDetailReviewPackageSection.tsx:28,42` — section heading **"Review package"**, list item **"Evidence package (N artifacts)"**

**Exports / deliverables:**
- `buyer-polish-copy.ts:474` — deliverable title **"Architecture package (DOCX)"**
- `ManifestDetailPageView.tsx:256` — operator CTA **"Export review package bundle"**
- `ManifestBuyerBundleDownloadSection.tsx:35` — **"Download finalized review package"**
- `RunDetailRunActionsSection.tsx:50`, `RunDetailArtifactsExportsSection.tsx:133-134,239` — **"Download evidence package (ZIP)"**
- `DocxExportController.cs:70` — backend route literally named `runs/{runId}/architecture-package`

**Help, docs, and glossary:**
- `docs/library/customer-facing/REVIEW_GUIDE.md:5-25` — *"Create an architecture review **package** by uploading architecture evidence…"*
- `docs/library/customer-facing/REVIEW_PACKAGES_OPERATOR_GUIDE.md:7-16` — entire page organized around **"review package"** as the primary noun
- `archlucid-ui/src/lib/glossary-terms.ts:23-26` — glossary defines **"Review package"** as *"the unit buyers open from the reviews list"*
- `docs/go-to-market/UI_GLOSSARY_V1.md:12` — a **different, more recent** glossary defines **"Architecture package"** as canonical and demotes "Review package" to *"(legacy UI noun)"* — the two glossaries actively disagree
- `docs/architecture/help_review_and_architecture_guidance_assessment.md:26,148-162` — an existing, independent assessment already documents this exact conflict as **"Unresolved owner decision #1"** and declines to resolve it

**Marketing and demo:**
- `archlucid-ui/src/app/(marketing)/why/WhyArchlucidMarketingView.tsx` — **"evidence package,"** **"proof package,"** **"audit evidence package"**
- `first-pilot-readiness-cockpit.ts:204-220` — **"Sponsor evidence package,"** **"Pilot evidence package"**
- `showcase-static-demo.ts:16-22` — `SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE`

**Backend (structural, not just copy):**
- `ArchLucid.Contracts/Common/ArchitecturePackageOrigin.cs` — enum `Created` / `Reviewed`
- `ArchLucid.Persistence/Migrations/274_Runs_PackageOrigin.sql` — persisted `dbo.Runs.PackageOrigin NVARCHAR(16)` column
- `AgentEvidencePackage`, `EvidenceBundle`, `ArtifactBundle`, `dbo.AzureExtractorPackages`, `dbo.CloudInventoryExtractorPackages` — internal/API type and table names built on "package"/"bundle"

**Conclusion of this sub-section:** "package" is not a residual cleanup item. It is the **currently shipped, tested, and actively-guarded** primary noun for the reviews list, and it is now a **persisted database field name** (`PackageOrigin`). Any terminology standard that treats "package" as non-normal (per this task's brief) is in direct, current conflict with TB-738 and must be flagged to the owner before implementation — see the closing section.

### 2.4 Creation and review as separate, competing workflows

| Location | Conflict |
|---|---|
| `buyer-polish-copy.ts:81-94` | Home page presents **"Create an architecture"** and **"Review an existing architecture"** as two peer, equally-weighted cards — implying two independent workflows |
| `pilot-nav-group-builder.ts:41-55` | Sidebar lists **"Create architecture"** (`/architectures/new`) and **"Start review"** (`/reviews/new`) as two separate, equally-weighted essential nav items |
| `reviews/new/page.tsx:43-45` | Yet `/reviews/new?intent=create-architecture` **server-redirects to `/architectures/new`** — the "review" entry point already redirects into the "create" entry point for one specific intent, evidence that engineering has already started collapsing these two flows |
| `SocraticIntakeWizard.tsx:500-524` | The guided **create-architecture** flow's own submit action lands the user on **`/reviews/{runId}?fromGeneration=1&intent=create-architecture`** — i.e., "create architecture" does not terminate in an architecture object at all; it terminates in a `Run`, displayed via a special `ArchitectureCreatedWorkspace` view bolted onto the review detail route |
| `architecture-routes.ts:28-34` | The draft editor's own **"Start architecture review"** button constructs `/reviews/new?path=guided-intake&sourceArchitectureId={id}` — the "create" flow's natural endpoint is itself a hand-off into the "review" flow |

**Read:** the two flows are not actually independent competing workflows at the object level — both already terminate in a `Run`. They are competing only in *positioning/copy* (two cards, two nav items, two verbs), not in underlying data. This is copy/IA debt, not an architectural fork, and is fixable without a data-model change.

### 2.5 Breadcrumbs, titles, routes, and CTAs disagreeing about the current object

| Surface | Says | Location |
|---|---|---|
| Sidebar nav item | **"Architecture packages"** | `i18n.ts:119` |
| `/reviews` browser tab | **"Reviews"** | `reviews/page.tsx:7-9` |
| `/reviews` page H1 | **"Architecture Packages"** | `RUNS_LIST_PAGE_TITLES` |
| `/reviews` breadcrumb (as parent) | **"Review packages"** | `breadcrumb-map.ts:49` |
| `/reviews/{runId}` breadcrumb (leaf) | **"Review package"** | `breadcrumb-map.ts:480` |
| `/reviews/{runId}` eyebrow | **"Architecture review"** | `RunDetailWorkspaceChrome.tsx:38` |
| `/reviews/{runId}` tab | **"Review package"** (one tab among eight) | `review-detail-workspace-tabs.ts:24` |
| Governance-mode toggle on | Same list renamed **"Reviews"** | `governance-mode-vocabulary.ts:38` |
| `/architectures` page H1 | **"Architectures"** | `architectures/page.tsx:21` |
| `/architectures` nav-reachable? | **No** — not a configured sidebar item; only `/architectures/new` is | `pilot-nav-group-builder.ts` (no `/architectures` list link) |
| `/reviews/new` H2 | **"Start review"** | `reviews/new/page.tsx:50` |
| `/reviews/new` breadcrumb | **"Create architecture"** (per `breadcrumb-map.test.ts:26-29`) | Disagrees with the page's own H2 |
| `/reviews/new` primary CTA (hub link) | **"Start architecture review"** | `ReviewsHubPrimaryActions.tsx:27-28` |
| Manifest detail H1 (buyer) | **"Signed decision record"** | `ManifestDetailPageView.tsx:249` |
| Manifest detail H1 (operator) | **"Finalized architecture review package"** | `ManifestDetailPageView.tsx:250` |
| Manifest export CTA | **"Export review package bundle"** | `ManifestDetailPageView.tsx:256` |

This table alone documents at least **six distinct customer-facing nouns** (`Reviews`, `Architecture Packages`, `Review packages`, `Architecture review`, `Review package`, `Architectures`) all describing what is, at the data layer, exactly one object type (`Run`) and one output type (`GoldenManifest`).

---

## 3. Recommended object model

### Testing Hypothesis A (Architecture as an independent object) against repository evidence

| Hypothesis A requirement | Evidence found | Verdict |
|---|---|---|
| Can exist meaningfully without a review | A `DraftRequest` can exist without a `Run` — **true**, but it is explicitly framed as incomplete/pre-review scratch content, not a finished, meaningful artifact ("Saving a draft does not start a review" — a caveat, not an endorsement of independent value) | **Partially true, weak** |
| Can be reused across multiple reviews | No `ArchitectureId` exists anywhere in the codebase (zero grep hits). Every review creation path inserts a **new** `ArchitectureRequestId`. The closest thing to reuse — `sourceArchitectureId` on the guided-intake wizard — loads a **draft's content as a one-time snapshot**; later draft edits do **not** propagate to the review already created from it (`SocraticIntakeWizard.tsx:551-557`). Recurrence schedules and replay both **clone into a new `RequestId`** rather than attach a second run to the same architecture. A concurrency guard even **prevents** more than one active non-terminal run per request at a time (`SqlRunRepository.cs:716-726`) | **False** |
| Has its own lifecycle, permissions, ownership, versioning, and navigation | `ArchitectureRequest` has no `OwnerId`/`TenantId` field at all (`dbo.ArchitectureRequests` has no tenant column); `DraftRequest` lifecycle is binary (draft → spawned-into-a-run); no `ArchitectureVersion` entity exists — versioning lives on `GoldenManifest`, attached to `Run` | **False** |
| Deserves a separate "Architectures" navigation destination | Consistent with the above — and, notably, **the current sidebar does not have one**; `/architectures` (the draft list) is reachable only by direct URL or in-page links, not a configured nav item | **False; also already not the current state** |

**Conclusion: Hypothesis A is not supported.** ArchLucid does not have two independently valuable customer-facing objects. It has one durable object (the architecture review) and one piece of attached, pre-review-only draft content (the architecture draft) that exists solely to be consumed by a review.

**Recommended model (confirms the preferred hypothesis in the task brief):**

1. **"Architecture review"** (persisted as `Run`) is the durable, top-level, customer-managed object. It owns the editable architecture representation, evidence, findings, policy evaluations, decisions, approvals, history, and outputs.
2. **"Architecture"** is editable content *within* a review (the submitted design/diagram/narrative), or — before a review exists — a **draft** the user is preparing for a future review. It is never a peer object with its own list, ownership model, or lifecycle independent of a review.
3. **"Review"** is the correct concise label once context is established (inside a review's own workspace, in a table column already headed "Reviews," etc.).
4. **"Package"** should not be a normal customer-facing noun per this task's brief — but this recommendation is currently in direct tension with the shipped, tested TB-738 decision, and that conflict must be adjudicated by the owner (see closing section) before any implementation proceeds.
5. Signed records, exports, and evidence bundles may keep specific, narrower names (**"signed review record,"** **"evidence graph,"** **"deliverables"**) but should not redefine the main product object as a "package."

**Nothing in the repository evidence overturns this hypothesis.** The draft workspace's own honesty ("saving a draft does not start a review," "does not imply a review has begun") is itself evidence the product team already understands architecture-as-draft is subordinate scratch content, not a peer object — the confusion is in *navigation and list-page copy*, not in the underlying design intent.

---

## 4. Navigation recommendation

**Should the left navbar contain an "Architectures" item?**
**No.** It does not today (confirmed: `pilot-nav-group-builder.ts` has no `/architectures` list link — only `/architectures/new`), and repository evidence does not support adding one. Adding a peer "Architectures" destination would manufacture a second object-inventory illusion the data model does not back up. Do not add it.

**What should clicking "Reviews" display?**
The list of architecture reviews (`Run` rows) — status, findings/risk summary, evidence completeness, governance state, last-updated — i.e., exactly the `RunsListClient` / `ReviewsHubRecentPackages` table that exists today, but **relabeled** so its H1, subtitle, empty state, and section headings say "reviews," not "architecture packages." The list should not be presented as, or read as, an architecture inventory. This is a copy change on an already-correct data source, not a data or route change.

**Should "Create architecture" and "Start review" remain separate?**
**Yes, as entry points — but both should be understood, and worded, as two doors into the same lifecycle**, not two competing product objects:
- **"Create architecture"** → opens a **draft** workspace for preparing content before committing to a review. Good current framing ("save and resume, does not start a review") should be kept and reinforced.
- **"Start review"** → begins a governed review, either from scratch or from an existing draft's content.
- Recommend the sidebar caption already in place — *"Overview → Create architecture → Start review → Reviews → Sponsor dashboard"* (`pilot-nav-group-builder.ts:29-30`) — stays as the mental model, since it already describes a **sequence**, not two parallel systems. The bug is downstream copy (home dual-path cards, hub CTAs) that reintroduces symmetric-object framing TB-738's own design rationale explicitly rejected (per [`POSITIONING.md`](../go-to-market/POSITIONING.md#create-vs-review--adversarial-evaluation-closed), referenced in `TECH_BACKLOG.md` TB-738 cluster).

**Where should users resume editing an existing architecture?**
- **Before a review starts:** at `/architectures/{id}` (the draft workspace) — keep this.
- **After a review starts:** inside the review's own **Architecture tab** on `/reviews/{runId}` — keep this too, but the two editors should not both remain live indefinitely for the same content. Recommend the draft workspace clearly hands off ("this draft became Review #1234 — continue there") once a review is spawned, rather than leaving the draft editable in parallel with a review that has already consumed its content, which would otherwise silently create the exact "two independently valuable objects" illusion this assessment concludes does not exist.

**How should finalized and historical reviews be represented?**
As **reviews with a "Committed"/finalized status** in the same reviews list, each carrying a link to its **signed review record** (`/signed-records/{manifestId}`) once committed — not as a separate destination or object class. The existing `/signed-records` route (rewritten from `/manifests`, per `next.config.ts:181-183`) is the right place for the finalized artifact; it should continue to present itself as "the signed record **for this review**," not as a third independent product noun.

---

## 5. Terminology standard

| Approved customer-facing term | Definition | Where used | Terms it replaces | Internal-code-only? |
|---|---|---|---|---|
| **Architecture review** | The end-to-end governed work unit for one system/design: intake, evidence, findings, policy evaluation, decisions, approvals, and outputs. The durable object customers return to. | First reference on any surface; page eyebrows; glossary | "Review package," "Architecture package," "package" (as the object name) | No — primary buyer noun |
| **Review** | Concise label for "architecture review" once context is already established (inside a review's own workspace, table columns headed "Reviews," repeated references on one page) | Second and later references on a page; table headers; nav item once "Architecture" section context exists | "Run" (as buyer copy), "Review run" | No |
| **Architecture** | The editable design/diagram/narrative content that is the subject of a review — a tab or section *inside* a review, or, before a review exists, draft content being prepared | Review detail "Architecture" tab; `/architectures` draft workspace | — (already the correct noun; keep) | No |
| **Architecture draft** | A saved, resumable, pre-review description of architecture intent. Explicitly does not start a review. | `/architectures`, `/architectures/{id}`, onboarding copy | — (retain; add a glossary entry — currently missing per `docs/library/GLOSSARY.md`) | No |
| **Review package** | **Not recommended as the primary object name going forward per this task's brief** — but currently the shipped, tested canonical noun on some surfaces and the currently-being-demoted noun on others (TB-738 vs. earlier copy). See owner-decision note below. If retained at all, should mean only "the finalized bundle of outputs for one review," not the review itself. | Currently: hub, breadcrumbs, tabs, help, glossary | — | Owner decision required |
| **Package** (bare) | **Not a normal customer-facing noun.** Should not appear unqualified in new copy. | — | "Package" used alone anywhere | Discouraged everywhere; if unavoidable in a compound term, must be qualified (e.g., "evidence package") |
| **Evidence package** | A specific export/trace bundle (ZIP) of supporting evidence for one review — narrower than, and not a synonym for, the review itself | Evidence tab download actions, glossary | "Package" used loosely for evidence exports | No, but should be renamed to **"evidence export"** or **"evidence bundle"** if the owner wants "package" fully absent even from qualified export names |
| **Signed review record** | The finalized, versioned, cryptographically-anchored authority closure produced when a review is committed | `/signed-records/{manifestId}`, glossary, canonical product terms | "Signed decision record" (reconcile to one), "Golden manifest," "Manifest" | No — but reconcile the two buyer-facing synonyms in `ManifestDetailPageView.tsx:249-250` to a single term |
| **Review output** | Not currently a shipped term; recommended as the umbrella customer-facing label for exports/deliverables generated from a review (DOCX, PDF, ZIP) if a term broader than "deliverable" is needed | Proposed for exports/artifacts section headings | "Architecture package (DOCX)," "architecture package bundle," "artifact bundle" (as customer copy) | No |
| **Artifact bundle** | Internal/API name for a synthesized collection of export artifacts; not itself a customer-facing noun | `ArtifactBundle` (backend), export pipeline | — | **Yes, internal only** — customer copy should say "deliverables" or "review output," not "artifact bundle" |
| **Revision** | A governance workflow outcome ("request revision") — not a data-model version concept exposed to customers | Governance approval help/dialogs | — (do not introduce "architecture revision" as a customer noun; versioning is expressed via review/manifest history, not "revisions") | No, but scope strictly to governance-decision language |
| **Review run** | Legacy/rejected buyer noun for a review; still leaks into trial-limit copy, cost-reporting labels, CLI | `trial-limit-problem.ts`, `AiUsageCostBreakdownPanel.tsx` | Should be replaced by "review" everywhere in buyer-facing copy | Acceptable internally (`RunId`, `ArchitectureRun` contract), not customer-facing |
| **Assessment** | A verb/activity describing the evaluation pipeline running against a review's evidence and policies — not a peer noun to "review" | "Run initial assessment," "recurring assessments," activity-tab progress labels | — (keep as activity language only; do not let it become a rival object noun) | No |

**Owner decision required before implementing this table (see closing section):** rows for **"Review package,"** **"Package,"** and **"Evidence package"** cannot be finalized without the owner explicitly reconciling this task's premise ("package" retired) against TB-738 (shipped 2 days prior, "Architecture packages" now canonical and drift-guarded). This assessment does not resolve that conflict — it documents it and flags it, matching the standard already set by the existing `help_review_and_architecture_guidance_assessment.md`'s "Unresolved owner decision #1."

---

## 6. Migration plan (route-by-route and component-by-component, ordered by customer impact)

This plan assumes the owner resolves the "package" conflict above before Steps 1–4 proceed on packaging vocabulary specifically. Steps that don't touch "package" wording can proceed independently.

| Order | Impact | Surface | File(s) | Change |
|---|---|---|---|---|
| 1 | **Highest** — every session touches this | `/reviews` landing page H1, subtitle, empty states, section headings | `i18n.ts:43-46` (`RUNS_LIST_PAGE_TITLES`), `reviews-hub-copy.ts:5-64`, `route-static-titles.ts:15-18` | Align H1/tab-title/breadcrumb to one noun ("Architecture reviews" or resolved package term); fix the H1-vs-tab-title mismatch |
| 2 | **Highest** | Primary sidebar nav item | `i18n.ts:119` (`OPERATOR_NAV_LINK_LABELS.reviewPackage`), `governance-mode-vocabulary.ts:27-38` | Reconcile pilot-mode vs. governance-mode labels to one noun; retire the dual-vocabulary toggle for this specific label if the owner wants one consistent noun regardless of mode |
| 3 | **High** | Breadcrumbs for `/reviews` and `/reviews/{runId}` | `breadcrumb-map.ts:49,254,480,571` | Replace "Review packages"/"Review package" with the resolved term; make governance-mode-aware if the toggle is kept |
| 4 | **High** | Review detail tab name | `review-detail-workspace-tabs.ts:24` | Rename or fold the "Review package" tab into "Overview" or a resolved "Outputs"/"Deliverables" tab, since it currently duplicates the finalize/export section's own content |
| 5 | **Medium-high** | Home dual-path cards | `buyer-polish-copy.ts:70-94` | Reframe "Create an architecture" / "Review an existing architecture" as sequential steps of one lifecycle, not two competing objects (per §4) |
| 6 | **Medium-high** | Reviews hub CTAs and helper links | `ReviewsHubPrimaryActions.tsx:22-38` | Fix the helper link that points "Create architecture" at the same `/reviews/new` href used for "Start review," which currently conflates two intents on one URL |
| 7 | **Medium** | `/reviews/new` breadcrumb vs. H2 mismatch | `breadcrumb-map.test.ts:26-29` vs. `reviews/new/page.tsx:50` | Make breadcrumb say "Start review" to match the page's own H2, or vice versa — pick one |
| 8 | **Medium** | Signed record detail page dual H1 | `ManifestDetailPageView.tsx:249-250` | Collapse "Signed decision record" (buyer) / "Finalized architecture review package" (full workspace) to **architecture package** consistently across modes |
| 9 | **Medium** | Export/deliverables surfaces | `RunDetailArtifactsExportsSection.tsx`, `buyer-polish-copy.ts:467-482`, `GoldenManifestExportMenu.tsx`, `ManifestBuyerBundleDownloadSection.tsx`, `RunDetailRunActionsSection.tsx:50` | Align export CTAs to **architecture package** / **evidence package** vocabulary (retire "review package bundle" / "finalized review package" copy) |
| 10 | **Medium** | `/architectures` and draft workspace copy | `architectures/page.tsx`, `ArchitectureDraftWorkspace.tsx`, `architecture-draft-guidance-copy.ts` | Already close to the recommended model; lowest-priority pass — mainly reinforce the hand-off message when a draft spawns a review |
| 11 | **Medium-low** | Help content and glossary | `docs/library/customer-facing/*.md`, `docs/library/GLOSSARY.md`, `archlucid-ui/src/lib/glossary-terms.ts`, `docs/go-to-market/UI_GLOSSARY_V1.md` | Coordinated pass once the package decision is made; cross-reference and execute alongside `docs/architecture/help_review_and_architecture_guidance_assessment.md`'s own "Unresolved owner decision #1" and its step-by-step plan (already scoped independently) |
| 12 | **Low** | Marketing pages | `WhyArchlucidMarketingView.tsx`, `showcase-static-demo.ts` | Update after operator-shell terminology stabilizes, to avoid a second round of marketing copy churn |
| 13 | **Low** | Demo/showcase static data labels | `operator-static-demo.ts`, `showcase-static-demo.ts`, `breadcrumb-map.ts` demo-title entries | Update display titles only; underlying fixture IDs (`runId`s) do not change |
| 14 | **Lowest, last** | Tests and fixtures | `review-terminology-guard.test.ts`, `review-terminology-surfaces.ts`, `breadcrumb-map.test.ts`, various `*.spec.ts`/`*.test.tsx` | Update **after** copy stabilizes — this file set currently *enforces* TB-738's "Architecture packages" decision as a drift guard, so it must be deliberately edited (not just adjusted incidentally) as part of implementing whatever the owner decides |

**Do not include in this migration:** any change to routes (`/reviews`, `/architectures`, `/signed-records`, `/reviews/{runId}`) or to backend identifiers (`RunId`, `ArchitectureRequestId`, `ManifestId`, `PackageOrigin` column name). This plan is copy/label-only; see §7 for why route/schema stability should be preserved.

---

## 7. Risk analysis

**Database / API compatibility risks:** Low, *if* this migration stays copy-only (recommended). `PackageOrigin` (`dbo.Runs.PackageOrigin`), `ArchitecturePackageOrigin` enum, `AgentEvidencePackage`, `EvidenceBundle`, `ArtifactBundle`, and cloud-extractor "package" tables are all internal/API identifiers with no requirement to change if only customer-facing labels change. Risk becomes **high** only if the owner also wants "package" removed from the DTO/DB layer (`PackageOrigin` column, `ArchitecturePackageOrigin` type, the `architecture-package` DOCX route) — that is a separate, larger, and currently out-of-scope engineering effort with real migration cost (column rename, API contract version bump, generated client regeneration).

**Route compatibility risks:** None anticipated. This plan recommends no changes to `/reviews`, `/architectures`, `/signed-records`, or their dynamic segments. The repository already has a proven pattern for route renames when they are truly needed (`/manifests` → `/signed-records`, `/runs` → `/reviews`, via `next.config.ts` rewrites/redirects) — that pattern is available but not needed for this specific migration.

**Saved-link risks:** None, provided routes are unchanged. Bookmarks and shared links to `/reviews/{runId}`, `/architectures/{id}`, and `/signed-records/{manifestId}` remain valid regardless of label changes.

**Test fixture impact:** Meaningful and must be sequenced last (§6, Step 14). `review-terminology-guard.test.ts` currently hard-asserts `OPERATOR_NAV_LINK_LABELS.reviewPackage === "Architecture packages"` and `RUNS_LIST_PAGE_TITLES.buyerPolished === "Architecture Packages"` as a **drift guard** — i.e., the test suite is currently designed to fail if this exact migration were implemented without also updating the guard. E2E specs (`core-pilot-path.spec.ts`, `demo-workspace-a.smoke.spec.ts`, `smoke.spec.ts`) may still assert as-found strings like "Validate review package" / "finalized review package" — update those assertions to **architecture package** / **Finalize** buyer copy in the same pass (keep API/CLI `commit` identifiers with gloss where tests target routes or payloads).

**Demo-data impact:** Low-to-medium. Fixture IDs (`runId`s in `demo-workspaces.fixture.manifest.json`) carry no display-name coupling and need no change. Display titles in `showcase-static-demo.ts` (`SHOWCASE_BUYER_REVIEW_PACKAGE_TITLE`) and backend seed narrative (`CreatedSampleWorkspaceSeed.cs`, `DemoSeedService.cs`) reference "package"/"architecture package" and will need label updates, but no data restructuring.

**Documentation impact:** High breadth, low individual risk. `docs/library/customer-facing/*.md`, `docs/library/GLOSSARY.md`, `docs/go-to-market/UI_GLOSSARY_V1.md`, and `docs/library/CONCEPT_VOCABULARY.md` all encode one or the other side of the package conflict and currently **disagree with each other** (see §2.3). This is exactly the gap the existing `docs/architecture/help_review_and_architecture_guidance_assessment.md` already scoped as its own follow-up (steps 1–9 there); this migration should execute in the same pass, not a separate one, to avoid a third round of documentation churn.

**Analytics impact:** Not deeply verified in this pass — flagged as a follow-up. If product analytics events or dashboard funnels are keyed on literal copy strings (rather than route/action IDs), a terminology change could silently break funnel definitions. Recommend a targeted check of the analytics/telemetry event-naming layer before Step 1 ships, since this was outside this assessment's inspection scope.

**Are aliases or redirects needed?** **No**, under the recommended copy-only migration — no route names change. If the owner later also decides to rename any route segment (not recommended here), reuse the existing `next.config.ts` rewrite/redirect pattern rather than inventing a new mechanism.

---

## Required conclusion (restated)

**Do not add an "Architectures" navbar item.** Repository evidence shows architecture is not an independent, reusable, customer-managed object today: there is no `Architecture`/`ArchitectureId` entity, no confirmed pattern of one architecture being deliberately reused across multiple separate governed reviews, no independent ownership/permissions model, and no versioning outside the review/manifest chain. The current sidebar already reflects this correctly (no `/architectures` list item exists in nav) — this assessment recommends **preserving that omission**, not correcting a mistake. The problems documented in §2 are page-copy and information-architecture inconsistencies around a single durable object (the architecture review), not evidence of a second, independently valuable object needing its own top-level destination.

## Owner decisions required before any implementation

1. **The "package" conflict (highest priority).** This task's brief states "package" has been retired from customer-facing language. Repository evidence (TB-738, shipped 2026-07-11, drift-guarded by `review-terminology-guard.test.ts`) shows the opposite: "Architecture packages" is the current, deliberately-shipped, tested canonical noun for the reviews list, and `PackageOrigin` is now a persisted database column. This assessment does not resolve the conflict — it flags it, consistent with how `docs/architecture/help_review_and_architecture_guidance_assessment.md` already flagged the same conflict as its own "Unresolved owner decision #1." No copy work in §6 that touches "package"/"Architecture packages" wording should proceed until the owner picks a direction. Sequencing this as one repo-wide vocabulary decision (not resolved page-by-page) avoids creating a third, transitional terminology state on top of the two that already coexist.
2. **Whether the governance-mode vocabulary toggle should be retired for this specific label.** Today the same `/reviews` route deliberately shows two different primary nouns ("Architecture packages" vs. "Reviews") depending on a user-togglable setting. Decide whether that toggle should keep affecting this label once Decision 1 is resolved, or whether the resolved noun should be constant regardless of governance mode.
3. **Whether the draft-workspace/review-Architecture-tab dual-editing pattern should be tightened.** Both can edit "architecture content" for the same underlying material today with no hard hand-off. Decide whether to add an explicit hand-off/lock once a draft spawns a review (recommended in §4) or leave both editable in parallel.
