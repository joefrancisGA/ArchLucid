# ArchLucid information architecture assessment and technical backlog

**Status:** Assessment only. No product code, routes, navigation, copy, tests, or demo data were modified while producing this file.

**Baseline:** Working tree as of 2026-07-14, **including uncommitted changes**. This matters: the working tree contains an in-flight terminology consolidation (reviews hub, breadcrumbs, nav labels, and tab labels now use "Reviews"/"Review", superseding the "Architecture Packages" state documented in `architecture_review_object_model_assessment.md` of 2026-07-13). All findings below are grounded in the *current* working tree.

**Method:** Read-only inspection of `archlucid-ui/src/app` (134 `page.tsx` files), `next.config.ts` redirects/rewrites, `src/proxy.ts`, the eight `*-nav-group-builder.ts` files, `nav-shell-visibility.ts`, `breadcrumb-map.ts`, `i18n.ts`, vocabulary modules, empty-state presets, help registry, role-gating components, and demo/seed tooling. Route names were never trusted alone; page files and section components were read.

**Evidence labels used throughout:** `[PI]` Proven in implementation · `[PUI]` Proven in rendered UI (string constants that render directly) · `[SMI]` Supported by multiple indicators · `[PRV]` Plausible but requires user validation · `[UNP]` Unable to prove.

---

## 1. Executive conclusion

ArchLucid's information architecture is **fundamentally sound at the object level and cluttered at the route level**. The product has exactly two durable customer objects — the architecture review (`Run`) and its signed record (`GoldenManifest`) — and the primary navigation ("Overview → Create architecture → Start review → Reviews → Executive dashboard") correctly reflects that lifecycle. The recent (uncommitted) terminology consolidation to "Reviews" resolved what was previously the single worst IA defect (four nouns for one destination on one page render).

The remaining problems are of three kinds:

1. **Dead ends and orphans that will strand beta users.** The `/signed-records` list URL resolves to a 404 (a rewrite exists but no index page); the `/architectures` draft list is reachable only by deep link, so a user who saves a draft and signs out has no navigational path back to it; an empty-state CTA still targets the legacy `/policy-packs` path. These are P0 — they can materially strand users and invalidate beta feedback.
2. **Accretion duplication.** Six executive/reporting surfaces (`/dashboard`, `/executive/dashboard`, `/executive/scorecard`, `/insights/architecture-scorecard`, `/governance/dashboard`, `/value-report{,/pilot,/roi}`) show overlapping rollups of the same run data; two health pages, two ITSM hubs, and three cost-reporting URLs coexist. Most are already mitigated by redirects; the residue is page files behind permanent redirects and naming that makes near-duplicates look like distinct capabilities.
3. **Discoverability trade-offs from progressive disclosure.** The Operate unlock phases (phase 0 hides Insights, Governance, Reports, Integrations entirely) plus "consolidated omissions" (`/digests`, `/value-report/pilot`, `/value-report/roi`, `/governance/dashboard` never in nav) plus a command palette that lists some of those hidden destinations create a system where what a user *can* reach is a function of five interacting gates. This is defensible for a guided pilot; it must be instrumented, not assumed, during beta.

What the assessment does **not** recommend: wholesale restructuring. The nav group model, the tenant→workspace→project scoping, the authority-rank gating, and the review-detail tab workspace are coherent and recently hardened by drift-guard tests. The brief's product framing (creation, evidence, governance, patterns, reporting as peer capabilities) is *ahead of* the data model — evidence and architecture content exist only inside reviews — and the IA should stay truthful to the shipped model rather than manufacture peer inventories the backend cannot support (consistent with `architecture_review_object_model_assessment.md` §3–4).

**Bottom line for private beta:** fix the four P0 items (all XS–S), land the eight P1 items opportunistically, instrument navigation, and defer structural changes (evidence hub, reports consolidation) until telemetry exists.

---

## 2. Overall scorecard

| # | Dimension | Score | Evidence for score |
|---|---|---|---|
| 1 | Navigation clarity | **72** | Primary "Architecture" group reads as a task sequence with an explicit caption (`pilot-nav-group-builder.ts:29-30`) `[PI]`. Deductions: two verb items ("Create architecture", "Start review") sit beside noun items; group label "Architecture" vs. its contents (reviews) is a mild mismatch; "Programs" group name is opaque `[PUI]`. |
| 2 | Conceptual grouping | **68** | Governance, Insights, Reports, Integrations, Administration groups are internally coherent `[PI]`. Deductions: "Advisory scans" and "Recurrence schedules" live under Governance but are operational, not approval concepts; `/governance/first-30-days` is onboarding content inside Governance; `/insights/architecture-scorecard` (Insights) vs. `/executive/scorecard` (executive shell) split one concept across two groups `[PI]`. |
| 3 | Route necessity | **55** | 134 pages for a pre-beta product. 18 page-level redirect routes and 40+ config redirect rules `[PI]`. Superseded page files historically persisted behind permanent redirects (`/integrations/itsm` **removed**, `/executive/dashboard`, `/admin/ai-usage-cost`) `[PI]`. Six overlapping executive/reporting routes (§6). Marketing surface (~20 routes) is large but separately grouped. |
| 4 | Workflow continuity | **74** | Golden path (create → intake → run detail → finalize → governance → dashboard) is fully linked, with post-commit next-best-action CTAs (`resolve-pilot-next-best-action.ts`) `[PI]`. Deductions: draft→review hand-off leaves the draft editable in parallel with the review that consumed it `[PI]`; approval requests have a lineage subpage but no detail page `[PI]`; `/ask` requires a finalized record but is nav-visible before one exists `[SMI]`. |
| 5 | Terminology consistency | **70** | The uncommitted consolidation fixed the list noun: nav, H1, browser tab, and breadcrumb for `/reviews` all now say "Reviews" (`i18n.ts:44-45,119`, `reviews-hub-copy.ts:4`, `breadcrumb-map.ts:49`) `[PUI]`. Residuals: "Review record" vs. "Signed review record" in the same includes list (`reviews-hub-copy.ts:54-61`); "Evidence graph" (nav) vs. "Evidence trail" (help/hub copy) vs. "Graph" (default breadcrumb) vs. "Provenance graph" (command palette); "Executive dashboard" (nav) vs. "Executive summary" (page vocabulary); "Risk register" (nav) vs. "Findings" (breadcrumb) `[PUI]`. |
| 6 | Page-boundary quality | **62** | Review detail is one route with 8 tabs mixing object views (Architecture, Evidence, Findings), lifecycle actions (Review/finalize), and meta (Activity) — workable but the "Review" tab (id `review-package`) is a label that does not describe its finalize/export content (`review-detail-workspace-tabs.ts:24`) `[PI]`. Executive reporting is split across six routes where tabs or one hub would serve (§6). Alerts vs. Alert rules as two nav items is correct (inbox vs. config). |
| 7 | Discoverability | **58** | Five interacting visibility gates (tier, authority, unlock phase, demo omissions, consolidated omissions) mean the same user sees different navs at different lifecycle moments `[PI]`. `/architectures` list, `/signed-records` list, `/administration/settings/baseline`, `/digests`, `/value-report/roi` reachable only by deep link `[PI]`. Help is not a nav item (top-bar icon + contextual only) `[PI]`. Command palette lists destinations the sidebar hides `[PI]`. |
| 8 | Role and persona alignment | **78** | Authority ranks mirror API policies; sponsor-only users are confined to `/dashboard` and review surfaces (`SponsorExecutiveShellRedirect`); admin surfaces split cleanly into customer Administration vs. employee Internal Operations, and hub pages are contractually forbidden from linking internal ops (`onboarding-hub-contract.ts`, TB-680) `[PI]`. Deduction: "AdminAuthority"/"ExecuteAuthority" internal rank names render in customer-visible forbidden-state messages (`SettingsRolesPageView.tsx`, cloud connection wizard) `[PUI]`. |
| 9 | Product-model clarity | **66** | One durable object, one lifecycle, one sequence — and the nav caption states it `[PI]`. Deductions: home dual-path cards ("Create an architecture" / "Review an existing architecture") still frame two peer objects when both terminate in a `Run` (`buyer-polish-copy.ts`) `[PI]`; the signed record has a detail page but no home/inventory `[PI]`; draft vs. in-review architecture content has two live editors `[PI]`. |
| 10 | Administrative separation | **75** | Administration (customer) vs. Internal Operations (employee, feature-flagged, hidden in buyer shell) is a clean two-surface split `[PI]`. Deductions: `/health` ("System health", buyer-safe) vs. `/admin/health` ("Diagnostics dashboard") naming does not convey the distinction; nav "Settings" targets `/administration/settings/tenant` while a `/administration/settings` hub index also exists; AI usage and cost reporting canonical URL is `/administration/ai-usage` (legacy `/admin/ai-usage-cost` is a retired redirect-only bookmark — IA-014) `[PI]`. |
| 11 | Scalability | **60** | Nav config is centralized with drift guards (`NAV_CONFIG_CONTRACT.md`, `nav-config.structure.test.ts`) — good `[PI]`. But the mode matrix (buyer-polished × full-operator × demo × static-demo × CTO tour × governance view × unlock phases × dev overrides) is already at the edge of testability; the governance-view nav filter is implemented and tested but never wired into the live shell (`filterNavGroupsForGovernanceMode` unused) `[PI]`. |
| 12 | Private-beta readiness | **70** | Golden path, onboarding hub, sample workspace, and role gating are beta-ready `[PI]`. Blocked by: the P0 dead ends (§10); Pattern library nav that will render an empty aggregate for beta tenants (requires ≥5 contributing tenants, `PatternLibraryPageClient.tsx`) `[PI]`; absence of navigation telemetry to validate the progressive-unlock bet `[SMI]`. |

---

## 3. Top ten findings

1. **`/signed-records` (list) is a customer-visible 404.** `next.config.ts` rewrites `/signed-records` → `/manifests`, but no `manifests/page.tsx` index exists — only `[manifestId]`. Breadcrumb map and command palette reference "Signed review records" as a parent concept. Any user who trims the URL from a signed-record detail, or follows a generated parent crumb, lands on a 404. `[PI]`
2. **Architecture drafts can be stranded.** `/architectures` (draft list) is not a configured nav item; it is reachable only from within the create flow ("Save and exit"). A user who saves a draft, signs out, and returns has no visible navigation path to resume it — "Create architecture" starts a *new* draft. `[PI]`
3. **The signed record — the product's core proof artifact — has no home.** It is reachable only from a review detail or a governance link. For an audit/governance-lead persona whose primary question is "show me every signed decision," the closest surface is `/governance/decision-register`, whose relationship to signed records is not stated on either page. `[PI]`
4. **Six executive/reporting surfaces overlap.** `/dashboard` (canonical), `/executive/dashboard` (redirected but page file retained), `/executive/scorecard` (separate shell, not in operator nav), `/insights/architecture-scorecard` ("Review scorecard", Insights group), `/governance/dashboard` (deep-link only, redirects home in demo), and the `/value-report` trio. Each has a defensible purpose; nothing in the IA tells a user which one answers which question. `[PI]`
5. **Progressive unlock is unvalidated.** At phase 0 (every new workspace), Insights, Governance, Reports, and Integrations groups do not exist in the nav. A governance-lead evaluator invited into a fresh beta workspace cannot discover the governance capabilities they are evaluating until someone finalizes a review. This may be the right guided-pilot bet, but there is no telemetry to prove it and no visible "what's locked and why" affordance beyond the unlock hint. `[PI]` for behavior; `[PRV]` for user impact.
6. **Home dual-path cards contradict the lifecycle model.** "Create an architecture" and "Review an existing architecture" render as two peer objects/workflows; both terminate in the same `createArchitectureRun` call, and `/reviews/new?intent=create-architecture` already server-redirects to `/architectures/new`. The nav caption gets this right (a sequence); the home cards re-fork it. `[PI]`
7. **Evidence has no landing, and its tools carry four names.** Evidence enters review-scoped (upload tabs, wizards, cloud connectors, extract-upload) and is consumed via `/graph`, `/ask`, `/search` — three sibling nav items whose shared corpus is invisible. The same surface is "Evidence graph" (nav), "Evidence trail" (hub includes, help topic), "Graph" (default breadcrumb segment), and "Provenance graph" (command palette). `[PUI]`
8. **Governance view is half-wired.** Vocabulary switching and detail-section behavior exist and are tested; the sidebar toggle component is not mounted, and `filterNavGroupsForGovernanceMode` is used only by tests. A mode that can only be enabled by editing `localStorage` is dead weight in the IA and a drift risk. `[PI]`
9. **Internal rank names and dev-state labels leak into customer surfaces.** "AdminAuthority"/"ExecuteAuthority" in forbidden-state messages; "V1 is sold through guided evaluation…" on public `/pricing`; help slug `creating-runs` in a customer URL; breadcrumb segment "pilot" for `/value-report/pilot` labeled "Review value report" in nav. `[PUI]`
10. **Superseded page files historically persisted behind permanent redirects.** `/integrations/itsm` is **removed** (OAuth callback retained); `/executive/dashboard`, `/admin/ai-usage-cost`, `/operate/architecture-graph` were unreachable behind config redirects or later retired. They cost build size, test surface, and future-engineer confusion, and `/why-archlucid` plus `/demo/explain` sit in customer route space as internal/demo tooling. `[PI]`

---

## 4. Current-state route inventory

Notation — **Nav:** P = primary sidebar (when gates pass), S = secondary/in-page, D = deep-link/card/palette only, R = redirect, X = orphaned/unreachable. **Disposition** uses the classification set from §9.1. Route groups `(operator)`, `(marketing)`, `(executive)` do not appear in URLs. Full per-route guard detail was verified against page files and `nav-config.ts`; guards summarized here.

### 4.1 Core review lifecycle (persona: architect, reviewer)

| Route | Purpose | Nav | Entry points → next actions | Disposition |
|---|---|---|---|---|
| `/` | Workspace overview: metrics, setup cards, recent reviews, next-best-action | P ("Overview") | Landing → `/reviews/new`, `/reviews`, `/dashboard`, `/onboarding` | Retain with revised purpose (fix dual-path cards, IA-005) |
| `/architectures/new` | Bootstrap a new architecture draft | P ("Create architecture") | Nav, home card → draft editor | Retain as-is |
| `/architectures/[architectureId]` | Long-lived draft editor (autosave) | D | From bootstrap/list → "Start architecture review" | Retain with revised purpose (hand-off lock, IA-007) |
| `/architectures` | Draft list/resume | **X (near-orphan)** | Only "Save and exit" from editor | **Promote to reachable** (IA-002) |
| `/reviews` | Reviews hub: summary, start CTA, samples, inventory | P ("Reviews") | Nav (Alt+R) → detail, new | Retain as-is (post-consolidation) |
| `/reviews/new` | Start-review intake (quick / guided / templates paths) | P ("Start review") | Nav (Alt+N), hub, home → `/reviews/[runId]` | Retain as-is; `?intent=create-architecture` redirect retained |
| `/reviews/[runId]` | Review detail workspace, 8 tabs (`?reviewTab=`) | D | Hub table, home, palette → findings, evidence, finalize, governance | Retain with revised purpose (rename "Review" tab, IA-003) |
| `/reviews/[runId]/findings/[findingId]` | Finding detail | D | Findings tab | Retain as-is |
| `/reviews/[runId]/findings/[findingId]/inspect` | Technical finding inspection + citations | D | Finding detail | Retain as-is |
| `/reviews/[runId]/provenance` | Review-scoped provenance graph + timeline | D | Run detail | Retain as-is |
| `/reviews/[runId]/artifacts/[artifactId]` | Artifact preview (**RER** retired — 404; Preview SoT is **GAR**) | D | Exports section | Remove / do not reintroduce |
| `/manifests/[manifestId]` (alias `/signed-records/[id]`) | Signed review record detail | D | Run detail, governance, golden journey | Retain as-is |
| `/signed-records` (list) | **404 — rewrite target has no index page** | **X** | Breadcrumb parent, palette concept | **Add index page in Governance group** (IA-001; D1 resolved 2026-07-14) |
| `/snapshot/[runId]` | Legacy bookmark alias → review workspace `readOnly=1` (redirect only) | R | Generated links, CTO recap | Retain redirect shim (not a standalone page) |

### 4.2 Insights / analysis (persona: architect, reviewer)

| Route | Purpose | Nav | Disposition |
|---|---|---|---|
| `/graph` | Evidence graph (React Flow; provenance, decision subgraph) | P ("Evidence graph", post-unlock) | Rename family to one term (IA-006) |
| `/ask` | Evidence-backed Q&A over finalized records | P ("Ask review questions") | Retain; gate or empty-state when no finalized record `[SMI]` |
| `/search` | Semantic search: evidence, findings, decisions | P | Retain as-is |
| `/compare` | Diff two finalized reviews | P (extended) | Retain as-is |
| `/insights/impact-preview` | Impact preview of proposed changes | P (extended) | Retain as-is; name is opaque — rename candidate (IA-021) |
| `/insights/architecture-scorecard` | Review scorecard (finalized-review metrics) | P (extended) | Move/merge into reporting family (IA-009, deferred) |
| `/patterns`, `/patterns/[patternKey]` | Anonymized pattern library (needs ≥5 tenants) | P (flagged) | **Hide from private beta** until data exists (IA-008) |
| `/planning`, `/planning/plans/[planId]` | Improvement themes and plans | P (advanced) | Retain as-is |
| `/internal/product-learning` | Pilot feedback themes | P (advanced; demo → `/`) | Retain; legacy `/product-learning` redirects |
| `/recommendation-learning` | Recommendation tuning profiles | P (advanced; demo → `/`) | Retain as-is |
| `/replay` | Validate stored review output integrity | Internal Ops nav | Retain as-is (system-admin surface) |
| `/operate/architecture-graph` | Legacy redirect → `/insights/evidence-graph` | R | **Remove** page file after redirect verified in config (IA-014) |

### 4.3 Governance (persona: governance/risk lead, reviewer)

| Route | Purpose | Nav | Disposition |
|---|---|---|---|
| `/governance` | Approval queue / workflow (approve, reject, promote) | P ("Approval queue", phase ≥1) | Retain as-is |
| `/governance/findings` | Cross-review risk register | P ("Risk register", phase 2) | Rename breadcrumb to match nav (IA-006 family) |
| `/governance/risk-exceptions` | Waivers and expirations | P (phase 2) | Retain as-is |
| `/governance/policy-packs`, `[id]` | Review standards | P (phase 2) | Retain as-is |
| `/governance/standards-and-rules` | Effective policy / precedence diagnostics | P ("Standards & rules") | Retain as-is |
| `/governance/decision-register` | Signed decisions ledger | P (phase 2) | Retain; cross-link to signed records (IA-001) |
| `/governance/audit` | Immutable audit trail + export | P ("Audit trail") | Retain as-is |
| `/governance/alerts` | Alerts inbox | P (phase 2) | Retain as-is |
| `/governance/alert-rules` | Rules/routing/composite/simulation (`?tab=`) | P (phase 2) | Retain as-is |
| `/governance/recurrence-schedules` | Automated follow-up reviews | P | Retain as-is |
| `/governance/first-30-days` | Governance operating-rhythm guide | P ("Governance setup guide") | Convert to help topic or keep — Requires product decision (IA-022) |
| `/governance/dashboard` | Workspace-health KPI tiles | D only (consolidated omission) | **Remove now** — redirect to `/dashboard`, fold unique tiles in (IA-009 D6 carve-out; resolved 2026-07-14) |
| `/governance/approval-requests/[id]/lineage` | Approval lineage graph | D | Retain; add parent detail route (IA-015) |
| `/advisory` (`?tab=scans\|schedules`) | Recommendations from finalized reviews | P ("Advisory scans", Governance group) | Move within navigation? Borderline — retain, monitor (IA-022) |
| `/alert-routing`, `/advisory-scheduling` | Legacy redirects | R | Retain redirects; remove page files where config covers them (IA-014) |
| `/settings/alerts` | Retired pre-release path | — | Removed (no redirect); use left nav Alert rules (`/governance/alert-rules`) |

### 4.4 Reporting (persona: executive, sponsor)

| Route | Purpose | Nav | Disposition |
|---|---|---|---|
| `/dashboard` | Canonical executive/portfolio ROI dashboard | P ("Executive dashboard") | Retain; reconcile "dashboard vs summary" naming (IA-010) |
| `/executive/dashboard` | Same component in retired executive chrome | R (config redirect) | **Remove** page file (IA-014) |
| `/executive/scorecard` | Sponsor scorecard, standalone executive shell | D (from dashboard) | Retain with revised purpose; label relationship to `/insights/architecture-scorecard` (IA-010) |
| `/value-report` | Sponsor DOCX value report (Execute+) | P (advanced) | Retain as-is |
| `/value-report/pilot` | Evaluation value report | D (consolidated omission) | Convert to tab of `/value-report` — defer (IA-009) |
| `/value-report/roi` | ROI hours estimate | D (consolidated omission) | Convert to tab of `/value-report` — defer (IA-009) |
| `/digests` (`?tab=browse\|subscriptions\|schedule`) | Digests hub | D (consolidated omission; palette lists it) | Align palette/nav visibility (IA-011) |
| `/digest-subscriptions` | Legacy redirect | R | Retain redirect; remove page files (IA-014) |
| `/settings/exec-digest` | Retired pre-release path | — | Removed (no redirect); use Digests → Schedule (`/digests?tab=schedule`) |
| `/example-roi-bulletin` | Synthetic ROI bulletin sample | D (marketing) | Hide from private beta operator space — Requires product decision |

### 4.5 Integrations (persona: admin, operator)

| Route | Purpose | Nav | Disposition |
|---|---|---|---|
| `/integrations/readiness` | Connector health hub (canonical) | P (Administration: "Connection status") | Retain as-is |
| `/integrations/cloud-connections` (+ `/azure`, `/aws`, `/gcp`) | Cloud evidence connections | P | Retain as-is |
| `/integrations/{jira,azure-boards,servicenow,slack,teams,webhooks}` | Per-connector config | P | Retain as-is |
| `/integrations/itsm` | Legacy combined ITSM page | R (**removed** — no redirect; OAuth carve-out retained) | **Remove** page file (IA-014) — **Done** |
| `/integrations/itsm/oauth/callback` | OAuth callback | flow-only | Retain as-is |
| `/admin/integrations/itsm` | Internal connector probes/onboarding | Internal Ops | Retain as-is |

### 4.6 Settings and administration (persona: admin)

| Route | Purpose | Nav | Disposition |
|---|---|---|---|
| `/administration/settings` | Searchable settings hub (tenant administration only) | P ("Settings", `ReadAuthority`) | Done 2026-08-05 — promoted to the nav target (IA-016 / D5, hub-first) |
| `/administration/settings/tenant` (+ `recycle-bin`) | Workspace settings | P ("Workspace settings", `AdminAuthority`) | Done 2026-08-05 — relabelled to match the breadcrumb; admin-gated (IA-016) |
| `/administration/settings/preferences`, `/administration/settings/account-security` | Personal appearance and sign-in methods | Top-bar account menu (ungated) | Done 2026-08-05 — previously reachable only by URL; not admin surfaces (IA-016) |
| `/administration/settings/users` (+ `invite-reviewer`, `?tab=users\|roles\|keys`) | Users, roles, keys | P | Retain as-is |
| `/administration/settings/identity-providers` (+ saml, oidc, role-mapping, diagnostics), `/administration/settings/identity/sso-wizard`, `/administration/settings/scim-provisioning` | Identity administration | P (advanced) | Retain as-is |
| `/administration/settings/api-keys` | Automation keys | P (advanced; omitted in buyer shell) | Retain as-is |
| `/administration/settings/billing` | Billing and plans | P | Retain as-is |
| `/administration/ai-usage` | Tenant LLM spend | P ("AI usage") | Canonical product URL; legacy `/admin/ai-usage-cost` is redirect-only (IA-014) |
| `/administration/settings/security-trust` | Procurement/trust materials | P | Retain as-is |
| `/administration/settings/support` | Support and diagnostics bundle | P | Retain as-is |
| `/administration/settings/preferences` | Personal preferences | S (settings hub) | Retain as-is |
| `/administration/settings/baseline` | ROI baseline methodology | D (intentional deep link from ROI surfaces) | Retain as-is |
| `/administration/settings/extract-upload` | Azure extractor upload | D (pilot checklist deep link) | Retain as-is |
| `/administration/settings/developer` | Internal dev tools (redirects unless system-admin) | X-ish | Retain as-is (internal) |
| `/health` | Buyer-safe API health | P ("System health") | Rename to distinguish from `/admin/health` (IA-017) |
| `/admin/{health,configuration,tenant-health,trial-funnel,rag-health,fleet-llm-cogs,pricing-quote-aging,evidence-proposals,demo-readiness}` | Employee internal operations | Internal Ops (flagged) | Retain as-is |
| `/operate/integration-events/dlq` | Failed outbound events | Internal Ops | Retain as-is |

### 4.7 Onboarding, help, auth

| Route | Purpose | Nav | Disposition |
|---|---|---|---|
| `/onboarding` | First-review guide hub (status + deep links only) | P ("First review guide"; demoted post-commit) | Retain as-is |
| `/onboard`, `/onboarding/start`, `/getting-started` | Alias redirects | R | Retain as-is |
| `/help`, `/help/[...topic]` (~45 registered slugs) | In-app documentation | D (top-bar icon, contextual buttons, empty states) | Retain; normalize "Help" vs "Support" breadcrumb (IA-018); alias `creating-runs` slug (IA-013) |
| `/auth/signin`, `/auth/callback`, `/auth/session-expired`, `/login` (redirect), `/403` | Auth and access denied | flow-only | Retain as-is |

### 4.8 Marketing and demo (public / evaluator)

| Route | Purpose | Disposition |
|---|---|---|
| `/welcome` (canonical public home), `/signup`, `/signup/verify`, `/get-started`, `/try`, `/see-it`, `/pricing`, `/faq`, `/trust`, `/security-trust`, `/privacy`, `/accessibility`, `/why`, `/compliance-journey` | Public acquisition and procurement surface | Retain as-is (separately grouped; consistent) |
| `/quick-start` | Legacy marketing bookmark (retired) | Canonical buyer URL is `/get-started`; no competing marketing page (TB-1818/TB-1819) |
| `/quick-scan` | No-sign-in ephemeral scan | Retain as-is |
| `/demo/preview`, `/live-demo`, `/showcase/[runId]` | Read-only demo walkthroughs | Retain as-is (well-differentiated with sample badges) |
| `/demo` | CTO demo tour redirect | Retain as-is |
| `/demo/explain` | Internal demo provenance tooling — no inbound nav links | **Hide from private beta** / move behind demo tooling env (IA-014) |
| `/why-archlucid` | Internal proof page; redirects away in buyer shell | **Remove or fold into `/why`** (IA-014) |

### 4.9 Redirect ledger

40+ `next.config.ts` redirect rules (`/runs*`→`/reviews*`, `/manifests*`→`/signed-records*`, `/policy-packs*`→`/governance/policy-packs*`, `/audit*`, `/alerts*`, `/admin/users*`→`/administration/settings/users*`, `/executive/dashboard`→`/dashboard`, `/portfolio`→`/dashboard`, etc.), 4 rewrite aliases, and 18 page-level redirects were enumerated and verified `[PI]`. All customer-visible links checked resolve — **except** the `/signed-records` index (Finding 1) and the deliberately legacy `/policy-packs` empty-state CTA (resolves via redirect; normalize anyway, IA-012).

---

## 5. Persona and workflow assessment

### 5.1 Personas

**A. Enterprise/solution architect creating an architecture.** Goals: capture a design, refine over sessions, get it evaluated. Path: "Create architecture" → draft editor → "Start architecture review" → guided intake → run detail. Works end-to-end `[PI]`. Failure points: no way back to a saved draft from navigation (Finding 2); after the review spawns, the draft remains editable in parallel with the review's own Architecture tab, with no lock or hand-off message beyond an "Open linked review" link `[PI]`; no diagram/modeling canvas exists — creation is form + text + import, which the marketing framing ("architecture creation platform") over-promises `[SMI]`.

**B. Architect preparing an architecture for review.** Path: `/reviews/new` (three intake paths) → evidence tab → pipeline → findings. Works; the path switcher (quick / guided / templates) is the clearest multi-path intake in the app `[PI]`. Terminology stays consistent post-consolidation. Weak point: evidence completeness expectations appear inside the wizard but there is no pre-flight "what evidence will I need" summary reachable before starting (help topic `evidence-intake` exists but is contextual only) `[PRV]`.

**C. Reviewer examining evidence and asking questions.** Path: hub → run detail → Findings/Evidence tabs → finding inspect → `/ask`. Works. Weak points: `/ask` is nav-visible pre-finalization but requires a finalized record (subtitle states it) — an invitation to a dead end for a mid-review reviewer `[SMI]`; the graph/trail naming split (Finding 7) forces the reviewer to learn that "Evidence graph," "Evidence trail," and "Provenance" are one capability `[PUI]`.

**D. Governance or risk leader.** Path: Governance group → approval queue → decision register → audit trail. Coherent once unlocked. Failure points: at unlock phase 0/1 most of this group does not exist in nav (Finding 5); the signed-record inventory gap (Finding 3) means "show me all signed decisions" lands on the decision register, which does not explain its relation to signed review records; approval request has lineage but no detail page `[PI]`.

**E. Executive seeking status/value/portfolio insight.** Path: `/dashboard` (sponsor-only users are hard-redirected there). Strong single landing `[PI]`. Failure point: the six-surface reporting overlap (Finding 4) — an executive who is *also* an operator sees "Executive dashboard," "Review scorecard," "Value report," and (via palette) "Digests," with no surface explaining which answers what.

**F. Administrator.** Path: Administration group → settings/users/identity/integrations health. Coherent; internal ops correctly separated. Failure points: `/administration/settings` hub vs. nav-target `/administration/settings/tenant` ambiguity; `/health` vs. `/admin/health` naming; internal rank names in error messages (Finding 9).

**G. First-time evaluator (demo/private-beta workspace).** Strongest persona support in the app: sample workspace badge, seeded sample review, golden-journey strip, dual-path home cards, onboarding hub `[PI]`. Failure points: the dual-path cards mislead about the object model (Finding 6); demo-blocked route prefixes silently trim most of the app, which is intended but means beta feedback on IA breadth requires the *non*-demo shell; Pattern library will render a below-threshold empty aggregate (Finding 10 → IA-008).

### 5.2 Core workflows

| Workflow | Natural start | Current start | Verdict and defects |
|---|---|---|---|
| Architecture creation | "Create architecture" | Same `[PI]` | Continuous. Defects: draft-list orphan (P0); dual live editors post-spawn; creation terminates in a `Run` displayed via a query-param-switched workspace view (`fromGeneration=1`) — invisible to users but a fragile page boundary `[PI]` |
| Architecture review | "Start review" | Same | Continuous. Defect: "Review" tab label on the finalize/export tab is uninformative (IA-003) |
| Governance and approval | Finalize → approval queue | Same | Continuous post-unlock. Defects: unlock gating pre-first-commit; no approval-request detail route; governance-mode vocabulary half-wired |
| Evidence | Review intake / connectors | Same | Works review-scoped. Defect: no cross-review evidence landing; naming split; classification is implicit (policy packs / severity), with no classification surface — acceptable for the current model, should be stated in help `[SMI]` |
| Patterns and reuse | `/patterns` | Same | Will be empty for beta tenants (threshold ≥5 tenants) — hide nav until populated |
| Executive/value reporting | `/dashboard` | Same | Landing is right; family fragmentation (Finding 4) |
| Administration | Administration group | Same | Sound; naming defects only |

---

## 6. Duplication and overlap matrix

| Page A | Page B | Shared content/action | Meaningful distinction | Confusion risk | Recommendation | Migration risk |
|---|---|---|---|---|---|---|
| `/dashboard` | `/executive/dashboard` | Identical dashboard component (`surface="executive"`) | Chrome only; A is canonical, B config-redirected | Low (redirect live) | **Remove B's page file**; keep redirect | None — redirect already permanent `[PI]` |
| `/dashboard` | `/governance/dashboard` | Workspace-health KPIs over same run data | B is governance-posture tiles; deep-link only | Medium if B is ever promoted | **Remove B now** (D6, 2026-07-14): redirect to `/dashboard`, fold unique tiles in | Low |
| `/insights/architecture-scorecard` | `/executive/scorecard` | Finalized-review metrics vs. sponsor scorecard | A is operator analysis; B is sponsor-facing leave-behind | **High** — same word, different shells | Rename one (e.g., B → "Sponsor scorecard") and cross-link | Low — label change |
| `/value-report` | `/value-report/pilot`, `/value-report/roi` | Value reporting family | DOCX generator vs. read-only reports | Medium — two of three are nav-invisible | Convert pilot/roi to tabs of `/value-report` after usage data | Medium — deep links must redirect |
| `/health` | `/admin/health` | System health signals | Buyer-safe liveness vs. employee diagnostics | Medium — identical concept name | Rename nav labels to state audience ("Service status" vs. "Internal diagnostics") | None |
| `/integrations/readiness` | `/admin/integrations/itsm` | Connector health | Customer hub vs. employee probes | Low (separate surfaces) | Retain both | None |
| `/administration/ai-usage` | `/admin/ai-usage-cost` (retired redirect-only bookmark) | Tenant LLM spend reporting | Canonical vs. legacy bookmark | Low | Link docs to `/administration/ai-usage` only | None |
| `/governance/alerts` | `/governance/alert-rules` | Alerting | Inbox vs. configuration | Low — correct split | Retain both | — |
| `/reviews/[runId]` Architecture tab | `/architectures/[id]` draft editor | Editable architecture content | Pre-review draft vs. in-review content | **High** — two live editors for one narrative | Hand-off lock when draft spawns a review (IA-007) | Low |
| `/reviews/[runId]` Review tab (finalize/exports) | `/manifests/[manifestId]` | Finalized outputs, export CTAs | In-review action vs. durable record | Medium | Retain both; tab rename (IA-003) + explicit "view signed record" link | None |
| `/onboarding` | `/governance/first-30-days` | Guided setup checklists | First review vs. governance rhythm | Medium — two "getting started" surfaces in different groups | Requires product decision: fold B into help or into `/onboarding` phase 2 | Low |
| `/search` | `/ask` | Query over evidence corpus | Retrieval vs. grounded Q&A | Low-medium | Retain both; shared empty-state cross-link | None |
| `/reviews` hub summary | `/` home recent reviews | Same run rows, different framing | Home = next action; hub = inventory | Low — intentional | Retain both | — |

No merge is recommended purely on component similarity; each recommendation above is based on user intent, per the assessment brief.

---

## 7. Orphaned and poorly discoverable routes

| Route | Class | Evidence | Action |
|---|---|---|---|
| `/signed-records` (index) | **Orphaned + broken** | Rewrite to `/manifests` which has no index page; breadcrumb/palette reference the concept `[PI]` | IA-001 (P0) |
| `/architectures` (list) | **Near-orphan** | Not in any nav builder; only "Save and exit" reaches it `[PI]` | IA-002 (P0) |
| `/demo/explain` | Orphan (internal) | No inbound nav links; only registry entries `[PI]` | IA-014 |
| `/why-archlucid` | Orphan (internal) | Only `public-marketing-seo-paths.ts`; buyer shell redirects away `[PI]` | IA-014 |
| `/integrations/itsm` (**removed**), `/executive/dashboard`, `/admin/ai-usage-cost`, `/operate/architecture-graph` | Unreachable or retired page files behind permanent redirects / removals | Config redirects verified or hub removed `[PI]` | IA-014 |
| `/governance/dashboard`, `/digests`, `/value-report/pilot`, `/value-report/roi` | Deliberately nav-omitted ("consolidated omissions") but palette lists some | `nav-config` omission set vs. `command-palette-curated-tasks.ts` `[PI]` | IA-011 |
| `/administration/settings/baseline`, `/administration/settings/extract-upload` | Intentional deep links | Linked from ROI surfaces / pilot checklist `[PI]` | Retain; document in help |
| `/governance/approval-requests/[id]/lineage` | Deep-only child without a parent detail route | No `[id]/page.tsx` `[PI]` | IA-015 |

---

## 8. Terminology and product-model conflicts

The recent uncommitted consolidation resolved the primary conflict (list noun). Remaining conflicts, all `[PUI]` unless noted:

| Concept | Surface A says | Surface B says | Resolution direction |
|---|---|---|---|
| Evidence visualization | "Evidence graph" (nav, `i18n.ts:120`) | "Evidence trail" (hub includes, help topic map); "Graph" (default breadcrumb segment); "Provenance graph" (command palette) | One noun everywhere; recommend **"Evidence graph"** for the tool, "evidence trail" reserved for prose about lineage (IA-006) |
| Signed output | "Signed review record" (canonical) | "Review record" (first item of `REVIEWS_HUB_INCLUDES_ITEMS`, which also lists "Signed review record" as item 4) | Delete or rename the redundant "Review record" item (IA-004) |
| Signed output (governance view off) | "Approved design" | "Signed review record" (view on) | Resolved by D2 (delete mode branch): "Signed review record" becomes the single vocabulary (IA-020) |
| Executive landing | "Executive dashboard" (nav) | "Executive summary" (page vocabulary); "Portfolio overview" (i18n key name) | Pick one customer noun (IA-010) |
| Findings queue | "Risk register" (nav) | "Findings" (breadcrumb segment) | Align breadcrumb to nav (IA-006 family) |
| Review detail finalize tab | Label "Review" | Tab id `review-package`; legacy hash `run-actions` | Rename label to describe content ("Finalize & exports" or "Deliverables"); ids stay for deep-link stability (IA-003) |
| Value report | "Review value report" (nav vocabulary) | URL segment and breadcrumb "pilot" | Alias or relabel (IA-013) |
| Authority ranks | "Admin" role names in UI | "AdminAuthority"/"ExecuteAuthority" in forbidden-state messages | Replace with role-name phrasing (IA-013) |
| Product dev state | — | "V1 is sold through guided evaluation…" on public `/pricing`; "pilot" in customer copy | Copy pass (IA-013) |
| Settings | Nav "Settings" → `/administration/settings` (hub) | Nav "Workspace settings" → `/administration/settings/tenant`, matching its breadcrumb and title | IA-016 ✓ (2026-08-05) |

**Product-model conflicts:** the home dual-path cards (two peer objects) vs. the nav caption (one sequence) is the load-bearing conflict (Finding 6). The data layer supports one durable object; the IA should consistently present *one lifecycle with two entry doors*, per `architecture_review_object_model_assessment.md` §4 — that document's conclusion is confirmed by this pass and by the working tree's own direction of travel (`/reviews/new?intent=create-architecture` already redirects into `/architectures/new`).

---

## 9. Proposed target information architecture

### 9.0 Design stance

No route renames. No group re-architecture. The proposal is: keep the existing five-group model, fix reachability, converge names, and make the lifecycle framing consistent. URL changes appear only where a route is broken (`/signed-records` index) or a page file is dead.

### 9.1 Hierarchical sitemap (operator shell, all gates passed)

```text
ArchLucid (workspace scope: tenant → workspace → project)
├── Architecture  (lifecycle group; caption states the sequence)
│   ├── Overview                    /
│   ├── Create architecture         /architectures/new
│   │   └── Drafts (resume)         /architectures            ← promoted to reachable
│   ├── Start review                /reviews/new
│   ├── Reviews                     /reviews
│   │   └── Review detail           /reviews/[runId]  (tabs: Overview · Findings · Evidence ·
│   │        Policies & standards · Decisions & remediation · Finalize & exports ·
│   │        Architecture · Activity)
│   ├── Executive dashboard         /dashboard
│   └── First review guide          /onboarding (demoted post-commit)
├── Insights
│   ├── Evidence graph              /graph
│   ├── Ask review questions        /ask
│   ├── Search review evidence      /search
│   ├── Compare two reviews         /compare
│   ├── Impact preview              /insights/impact-preview
│   └── Review scorecard            /scorecard
│   └── (Pattern library            /patterns — hidden until data threshold)
├── Governance
│   ├── Approval queue              /governance
│   ├── Risk register               /governance/findings
│   ├── Risk exceptions · Policy packs · Standards & rules · Decision register
│   ├── Signed review records       /signed-records            ← new index (or de-referenced)
│   ├── Audit trail · Alerts · Alert rules · Recurrence schedules
│   └── Advisory scans              /advisory
├── Reports
│   ├── Value report                /value-report  (future tabs: evaluation · ROI)
│   └── Digests                     /digests (palette + nav aligned)
├── Integrations                    (unchanged)
├── Administration                  (unchanged; audience-labeled health)
└── Internal Operations             (employee only; unchanged)
```

### 9.2 Navigation table (deltas only)

| Item | Current | Proposed | Why |
|---|---|---|---|
| Drafts list | Unreachable | "Drafts" strip/link on `/reviews` hub + breadcrumb parent of `/architectures/[id]` (not a top-level nav item) | Reachability without manufacturing a peer "Architectures" inventory the data model doesn't support |
| Signed records | 404 index | Either a Governance-group "Signed review records" index or removal of all parent references | Fix broken concept |
| "Review" tab | `/reviews/[runId]` tab label "Review" | "Finalize & exports" | Label describes content |
| Pattern library | Nav item behind flag | Nav hidden until aggregate threshold met | No empty destination in beta |
| Palette vs. nav | Palette lists nav-omitted destinations | Palette honors `visibleOperatorShellHrefSet` uniformly | One visibility contract |
| Health items | "System health" / "Diagnostics dashboard" | "Service status" (customer) / "Internal diagnostics" (employee) | Audience clarity |

### 9.3 Persona-to-destination map

| Persona | Landing | Primary destinations | Secondary |
|---|---|---|---|
| Architect (create) | `/` | Create architecture → Drafts → Start review → Review detail | Evidence graph, Compare |
| Architect (prepare/review) | `/` | Start review → Review detail (Findings/Evidence) | Ask, Search |
| Reviewer | `/reviews` | Review detail → Finding inspect → Ask | Graph, Compare |
| Governance lead | `/governance` | Approval queue → Decision register → Signed records → Audit trail | Policy packs, Risk register |
| Executive / sponsor | `/dashboard` (hard redirect for sponsor-only) | Dashboard → Value report | Sponsor scorecard |
| Administrator | `/administration/settings/tenant` | Users, Identity, Connection status, Billing | Service status, Support |
| First-time evaluator | `/` (sample workspace) | Sample review → Start review → First review guide | Help topics |

### 9.4 Current-route → proposed-route mapping

All routes map 1:1 except: `/signed-records` (new index page or removed references); page-file deletions behind existing redirects or removals (`/integrations/itsm` **removed**, `/executive/dashboard`, `/admin/ai-usage-cost`, `/operate/architecture-graph`, `/why-archlucid`, `/demo/explain` — files removed; legacy config redirects largely emptied in IA batch 4); future `/value-report/pilot|roi` → `/value-report?tab=` (deferred, redirects required at cut-over).

**Breadcrumb strategy:** breadcrumb labels must be sourced from the same constants as nav labels (extend the drift-guard pattern already used by `review-terminology-guard.test.ts` to `breadcrumb-map.ts` segment labels). Help breadcrumbs standardize on "Help".

**Administration / help / demo treatments:** unchanged in structure. Demo state remains badge-differentiated (Sample workspace); demo-only tooling routes move fully behind the demo-tooling env. Evidence remains a workflow input inside reviews *and* is acknowledged as a reusable asset only through Insights tools — a standalone evidence library is explicitly deferred until telemetry shows cross-review evidence-seeking behavior (see §13).

---

## 10. Private-beta minimum correction set

Structural problems that would invalidate beta feedback (fix **before** beta):

1. **IA-001** — `/signed-records` index 404 (users hit a dead end from a product-canonical concept).
2. **IA-002** — draft list unreachable (users lose work they were told is "saved and resumable").
3. **IA-005** — home dual-path cards reframed as one lifecycle (otherwise beta users form the wrong product model on day one and their feedback tests the wrong mental model).
4. **IA-008** — hide Pattern library nav (an empty flagship "reuse" destination poisons the reuse narrative).

Safe to test **during** beta: progressive unlock phases (instrumented, IA-019), Insights naming, `/ask` pre-finalization gating. (The governance-view question was resolved by D2 — delete — so IA-020 is now ordinary cleanup, not a beta experiment.)

Wait for **usage evidence**: value-report tab consolidation (IA-009), evidence hub (§13), any route renames. (IA-016 no longer waits — D5 resolved it hub-first.)

---

## 11. Prioritized technical backlog

Complexity: XS/S/M/L/XL per the brief. All items are UI-only unless noted. Shared acceptance criteria for every item (in addition to per-item criteria): existing deep links resolve; browser back preserves workflow context; page titles, breadcrumbs, headings, and nav labels agree; role-restricted destinations stay hidden from unauthorized users; mobile drawer and desktop sidebar stay consistent (both consume `useOperatorShellNavRows`); keyboard navigation and focus order unchanged; Vitest guards and affected Playwright specs updated in the same change; sample and production workspaces behave consistently where intended.

---

**IA-001 · Resolve the `/signed-records` index dead end** — **Done (2026-07-14)** — **P0 · S**
- **Problem:** `next.config.ts` rewrites `/signed-records` → `/manifests`, but no `manifests/page.tsx` index exists; only `[manifestId]` detail. Breadcrumb map and command palette use "Signed review records" as a parent concept. `[PI]`
- **User impact:** Governance leads and anyone URL-trimming from a signed record hit a 404 on a canonical product noun. **Personas:** governance lead, reviewer, executive.
- **Routes:** `/signed-records`, `/manifests`. **Files:** `archlucid-ui/next.config.ts`, `src/app/(operator)/manifests/`, `src/lib/breadcrumb-map.ts`, `command-palette-curated-tasks.ts`.
- **Change (per D1, resolved 2026-07-14):** Add a signed-records index page (list of committed manifests per project scope, columns: review title, version, committed date, link to review) placed in the Governance group. The redirect-to-decision-register alternative was considered and rejected by the owner.
- **Implementation notes:** List data derivable from the runs list filtered `hasGoldenManifest`; reuse `EnterpriseTable`. If redirect option chosen, it is one config rule + breadcrumb edits.
- **Dependencies:** backend list endpoint availability (check `listRunsByProjectPaged` filters first). **Migration:** none; URL already public.
- **Telemetry:** page-view event on the new index; 404 monitoring on `/signed-records` before/after.
- **A11y:** table semantics per `EnterpriseTable`; crumb `aria-current`.
- **Tests:** route renders under Read authority; redirect (if chosen) covered in a config redirect test; breadcrumb unit test.
- **Acceptance:** navigating to `/signed-records` never 404s; a first-time governance user can reach it through visible navigation (Governance group) or is redirected to an explained equivalent.
- **Beta impact:** unblocks governance persona. **Risk if deferred:** dead end on a core concept during evaluations.

**IA-002 · Make architecture drafts reachable** — **Done (2026-07-14)** — **P0 · S**
- **Problem:** `/architectures` (draft list) is in no nav builder; "Create architecture" always starts a new draft. `[PI]`
- **User impact:** Architects lose saved drafts across sessions despite copy promising "save drafts over multiple sessions" (nav tooltip, `pilot-nav-group-builder.ts:43`). **Personas:** architect (create), first-time evaluator.
- **Routes:** `/architectures`, `/architectures/new`, `/reviews`. **Files:** `reviews/_sections/ReviewsHubPrimaryActions.tsx` or `RunsPageView.tsx`, `src/app/(operator)/architectures/new/` bootstrap, `breadcrumb-map.ts`.
- **Change:** (a) Add a "Resume a draft" affordance: a drafts strip or link on the Reviews hub when ≥1 draft exists; (b) `/architectures/new` bootstrap should offer "resume existing draft" when drafts exist instead of silently creating a new one; (c) breadcrumb for `/architectures/[id]` gains parent "Drafts" → `/architectures`. Do **not** add a top-level "Architectures" nav item (consistent with the object-model assessment §4).
- **Implementation notes:** Draft presence is queryable via the draft registry/API used by `architectures/page.tsx`; hide the strip at zero drafts.
- **Dependencies:** none. **Migration:** none. **Telemetry:** draft-resume click event; count of abandoned drafts (created, never reopened, never spawned).
- **A11y:** strip links are `<Link>`s, not clickable divs.
- **Tests:** hub renders drafts strip with fixture drafts; bootstrap offers resume; zero-draft state unchanged.
- **Acceptance:** a user with a saved draft can reach it within two clicks of signing in, through visible UI.
- **Beta impact:** prevents lost-work reports. **Risk if deferred:** "the product lost my work" is a trust-killing beta signal.

**IA-003 · Rename the review-detail "Review" tab** — **Done (2026-07-14)** — **P1 · XS**
- **Problem:** Tab id `review-package` renders label "Review" (`review-detail-workspace-tabs.ts:24`) on a page that *is* the review — the label carries no information; the tab contains finalize + exports. `[PUI]`
- **Impact:** Architects/reviewers can't predict where finalize/export lives. **Routes:** `/reviews/[runId]`. **Files:** `review-detail-workspace-tabs.ts` (label map only; ids and legacy hash map unchanged).
- **Change:** label → "Finalize & exports" (or "Deliverables" post-finalize; keep it one static label for now).
- **Telemetry:** existing tab-change events retained (param unchanged). **Tests:** tab label unit test; e2e selector update if label-keyed.
- **Acceptance:** deep links with `?reviewTab=review-package` and legacy hashes still resolve; label consistent in tab list and any CTA that targets the tab.
- **Risk if deferred:** low individually; contributes to "can't find export" support load.

**IA-004 · Fix the hub includes-list redundancy** — **Done (2026-07-14)** — **P1 · XS**
- **Problem:** `REVIEWS_HUB_INCLUDES_ITEMS` lists both "Review record" and "Signed review record" (`reviews-hub-copy.ts:54-61`) — two near-identical nouns in a six-item list defining the product. `[PUI]`
- **Change:** Replace "Review record" with the concept it means (likely "Architecture description" or drop it); keep "Signed review record".
- **Files:** `reviews-hub-copy.ts`, `ReviewsHubPackageIncludes.tsx` test. **Complexity/priority:** XS/P1. **Acceptance:** includes list has no two items differing only by a qualifier; glossary terms match.

**IA-005 · Reframe home dual-path cards as one lifecycle** — **Done (2026-07-14)** — **P0 · S**
- **Problem:** "Create an architecture" and "Review an existing architecture" render as two peer workflows; both terminate in `createArchitectureRun`. Nav caption already frames a sequence. `[PI]`
- **Impact:** First-time evaluators form a two-object mental model the product cannot sustain; beta feedback then tests the wrong model. **Personas:** evaluator, architect.
- **Routes:** `/`. **Files:** `buyer-polish-copy.ts` (dual-path card copy), `OperatorHomeDualPathCards` component and test.
- **Change:** Copy-only: reposition cards as "Step 1 — describe or import your architecture (start from a draft)" and "Step 2 — run a governed review" (or a single card with two entry buttons). No route changes; CTAs keep their targets.
- **Telemetry:** card-click events per path (add if absent). **Tests:** copy constants + snapshot updates.
- **Acceptance:** home, nav caption, and hub CTAs describe the same single lifecycle; both entry CTAs remain one click from home.
- **Risk if deferred:** misleading product model at the highest-traffic entry point.

**IA-006 · Converge evidence-tool and governance naming** — **Done (2026-07-14)** — **P1 · S**
- **Problem:** One capability, four names: "Evidence graph" (nav), "Evidence trail" (hub includes, help topic label), "Graph" (default breadcrumb segment), "Provenance graph" (command palette). Also "Risk register" (nav) vs. "Findings" (breadcrumb); "Settings" (nav) vs. "Workspace settings" (crumb). `[PUI]`
- **Change:** Canonical noun per surface family: tool = **"Evidence graph"** everywhere (nav, crumbs, palette, help label); "evidence trail" allowed only in prose about lineage. Breadcrumb segment labels for `graph`, `findings` (under governance), `tenant` sourced from `OPERATOR_NAV_LINK_LABELS` constants instead of parallel literals.
- **Files:** `breadcrumb-map.ts`, `command-palette-curated-tasks.ts`, `page-help-topic-map.ts`, `reviews-hub-copy.ts` includes item, related tests.
- **Implementation notes:** extend the terminology drift-guard test to assert nav label ↔ breadcrumb segment equality for these keys.
- **Acceptance:** for `/graph`, `/governance/findings`, `/administration/settings/tenant`: nav label, breadcrumb, page title, palette entry, and contextual help label all use one string each.
- **Priority/complexity:** P1/S. **Risk if deferred:** users treat one tool as several; help searches fail.
- **Shipped:** `OPERATOR_NAV_LINK_LABELS` sourcing in breadcrumbs, route titles, palette, contextual help, hub includes, and registry title; `review-terminology-guard.test.ts` IA-006 alignment test.

**IA-007 · Draft → review hand-off lock** — **Done (2026-07-14)** — **P1 · S**
- **Problem:** After a draft spawns a review (`spawnedRunId`), the draft workspace remains fully editable in parallel with the review's Architecture tab; later draft edits do not propagate. `[PI]`
- **Impact:** Architects edit the wrong copy and lose changes. **Routes:** `/architectures/[id]`, `/reviews/[runId]`.
- **Change (per D4, resolved 2026-07-14 — soft gate):** When `spawnedRunId` exists, the draft workspace renders a hand-off banner — "This draft became review {title}; continue editing there" — and the editor is disabled until the user explicitly acknowledges that further draft edits will not flow into the existing review. A hard permanent lock was considered and rejected by the owner.
- **Files:** `ArchitectureDraftWorkspace.tsx`, draft registry helpers, tests.
- **Telemetry:** count of post-spawn draft edits (validates severity before/after). **Acceptance:** post-spawn, the primary CTA on the draft is the linked review; no silent parallel editing.
- **Priority/complexity:** P1/S. **Risk if deferred:** silent divergence and "two objects" illusion.
- **Shipped:** `architecture-draft-handoff-gate.ts`, `ArchitectureDraftHandoffBanner`, workspace soft-lock + `ArchitectureDraftHandoffAcknowledged` / `ArchitectureDraftPostSpawnEdit` telemetry; tests in `architecture-draft-handoff-gate.test.ts` and `ArchitectureDraftWorkspace.test.tsx`.

**IA-008 · Hide Pattern library nav until content threshold** — **Done (2026-07-14)** — **P1 · XS**
- **Problem:** `/patterns` requires ≥5 contributing tenants and ≥3 live cards for live aggregates; private-beta tenants will see an empty/below-threshold flagship "reuse" destination. Nav visibility flag exists (`isPatternLibraryNavVisible()`). `[PI]`
- **Change (per D3, resolved 2026-07-14 — data-driven):** Make visibility data-driven: the nav item appears only when the aggregates endpoint reports the threshold met. Route stays live for deep links with an honest below-threshold empty state. The flag-off shortcut was considered and rejected by the owner.
- **Files:** pattern nav visibility module, `operate-analysis-nav-group-builder.ts`, nav structure test.
- **Acceptance:** beta workspaces show no Pattern library nav item while below threshold; deep link renders the threshold explanation; when the threshold is met the item appears without a deploy.
- **Priority/complexity:** P1/S (data-driven). **Risk if deferred:** reuse pillar reads as vaporware in beta.

**IA-009 · Reports family consolidation (deferred design)** — **P2 · M**
- **Problem:** `/value-report`, `/value-report/pilot`, `/value-report/roi`, `/insights/architecture-scorecard`, `/governance/dashboard`, `/digests` fragment reporting; two of six are nav-invisible. `[PI]`
- **Change (post-telemetry, except the D6 carve-out):** Convert `/value-report/pilot` and `/value-report/roi` into tabs of `/value-report` (redirects for old URLs); rename `/executive/scorecard` label to "Sponsor scorecard" and cross-link with `/insights/architecture-scorecard`.
- **D6 carve-out (resolved 2026-07-14 — immediately actionable, not telemetry-gated):** remove `/governance/dashboard` now — redirect it to `/dashboard` and fold any unique workspace-health KPI tiles into `/dashboard`. This portion can ship in Wave 4 independently of the rest of IA-009.
- **Dependencies:** IA-019 telemetry (route entries per surface) for the value-report portion only. **Migration:** redirects for the two tab-ified routes and for `/governance/dashboard`; preserve DOCX generation deep link.
- **Acceptance:** an executive-persona click path from `/dashboard` reaches every report within one hop; no report reachable only by palette.
- **Priority/complexity:** P2/M. **Risk if deferred:** manageable — palette covers power users; confusion cost grows with adoption.

**IA-010 · Executive naming reconciliation** — **Done (2026-07-14)** — **P1 · XS**
- **Problem:** Nav "Executive dashboard" → `/dashboard`; page vocabulary "Executive summary"; i18n key `portfolioOverview`; `/executive/scorecard` vs. `/insights/architecture-scorecard` share a word across shells. `[PUI]`
- **Change:** One customer noun for `/dashboard` (recommend "Executive dashboard" since it's already the nav string) across page title, vocabulary module, and crumbs; rename `/executive/scorecard` visible title to "Sponsor scorecard".
- **Files:** `i18n.ts`, `BUYER_EXECUTIVE_SUMMARY_VOCABULARY` module, executive scorecard page metadata, tests. **Acceptance:** per shared criteria. **Risk if deferred:** low, but cheap.

**IA-011 · Align command palette with nav visibility** — **P1 · S**
- **Problem:** Palette curates tasks including consolidated-omission destinations (e.g., "Digests & subscriptions") while nav deliberately omits them; palette is documented as gated to `visibleOperatorShellHrefSet` but drift exists on omission-set entries. `[SMI]` — verify each palette entry against the omission set during implementation.
- **Change:** One visibility contract: palette entries filtered by the same composed href set as the sidebar, plus an allowlist for intentional palette-only power destinations (documented in `NAV_CONFIG_CONTRACT.md`).
- **Files:** `command-palette-curated-tasks.ts`, `nav-shell-visibility.ts`, contract doc, tests.
- **Acceptance:** every palette destination is either sidebar-visible or on the documented palette-only allowlist; no palette entry leads to a demo-blocked route in demo shells.
- **Priority/complexity:** P1/S. **Risk if deferred:** inconsistent discoverability; demo leaks.

**IA-012 · Normalize legacy CTA targets** — **Done (2026-07-14)** — **P1 · XS**
- **Problem:** `GOVERNANCE_WORKFLOW_IDLE*` empty-state CTA targets legacy `/policy-packs` (redirect covers it); nav uses `/governance/policy-packs`. `[PI]`
- **Change:** Point all empty-state and enterprise-compact preset CTAs at canonical paths; add a lint/unit guard that preset `href`s are not in the redirect source list.
- **Files:** `empty-state-presets.ts`, `enterprise-compact-empty-state-presets.ts`, new guard test.
- **Acceptance:** no customer-visible link targets a redirect source; guard test enforces it.
- **Shipped:** `GOVERNANCE_WORKFLOW_IDLE` policy packs CTA → `/governance/policy-packs`; `auditTrailNavHref` → `/governance/audit`; `empty-state-preset-cta-guard.test.ts` enforces disjointness from `next.config.ts` permanent redirect sources.

**IA-013 · Internal-concept leakage copy pass** — **Done (2026-07-14)** — **P1 · XS**
- **Problem:** "AdminAuthority"/"ExecuteAuthority" in forbidden-state messages (`SettingsRolesPageView.tsx`, `TrialFunnelOpsPageClient.tsx`, cloud wizard); "V1 is sold through guided evaluation…" on `/pricing`; help slug `creating-runs` in customer URLs; breadcrumb "pilot" for `/value-report/pilot`. `[PUI]`
- **Change:** Replace rank names with role phrasing ("Requires a workspace admin"); reword pricing note without version labels; register slug alias `starting-reviews` (keep `creating-runs` as redirect alias in the help registry); breadcrumb label for `pilot` segment already maps to "Review value report" — verify and keep.
- **Files:** the three components, `buyer-polish-copy.ts`, `product-documentation-registry.ts`, `breadcrumb-map.ts`, tests.
- **Acceptance:** grep guard for `Authority"` strings in rendered copy passes; old help slug still resolves.
- **Shipped:** `FORBIDDEN_WORKSPACE_ADMIN_ACCESS_MESSAGE*` on settings/trial-funnel gates; `BUYER_SALES_LED_PRICING_NOTE` without version label; `starting-reviews` help slug + `creating-runs` alias; `internal-concept-leakage-guard.test.ts`.

**IA-014 · Dead page-file and internal-route cleanup** — **P2 · S**
- **Problem:** Page files historically persisted for `/integrations/itsm` (**now removed**; OAuth callback retained), `/executive/dashboard`, `/admin/ai-usage-cost`, `/operate/architecture-graph` (unreachable behind permanent redirects or later retired); `/why-archlucid` and `/demo/explain` are internal tooling in customer route space. `[PI]`
- **Change:** Delete the four unreachable page files (config redirects remain authoritative); fold `/why-archlucid` content into `/why` or delete with redirect; gate `/demo/explain` behind the demo-tooling env (404 otherwise).
- **Migration:** verify each config redirect covers all former sub-paths before deletion; keep `public-marketing-seo-paths.ts` in sync.
- **Tests:** redirect e2e for each removed path; build passes; First Load JS budget unchanged or improved.
- **Acceptance:** no orphaned page files behind permanent redirects; internal tooling unreachable in customer builds.
- **Risk if deferred:** engineering confusion and drift, not user harm.

**IA-015 · Approval-request detail route** — **P2 · M**
- **Problem:** `/governance/approval-requests/[id]/lineage` exists with no parent `[id]` detail page; approval context lives only in the queue. `[PI]`
- **Change:** Add `/governance/approval-requests/[id]` (request summary, status, decision history, link to review and lineage) or relocate lineage as a tab of the queue's detail panel. Depends on how often approvals are shared by link — instrument first (IA-019).
- **Acceptance:** the lineage page has a breadcrumb parent that resolves; approval links shared in ITSM/Slack land on a self-sufficient page.
- **Risk if deferred:** governance deep links land on a context-free child page.

**IA-016 · Settings entry point: hub-first** — **P2 · XS (D5 resolved 2026-07-14) · Done 2026-08-05**
- **Problem:** Nav "Settings" targets `/administration/settings/tenant` while a searchable `/administration/settings` hub index exists, reachable only by URL. `[PI]`
- **Change (per D5 — hub-first):** Point the sidebar "Settings" item at `/administration/settings` (the searchable index); `/administration/settings/tenant` remains a first-class hub destination. Update the breadcrumb parent chain accordingly.
- **Acceptance:** exactly one settings landing pattern (hub-first); breadcrumbs consistent.
- **Shipped:** sidebar "Settings" → `/administration/settings` at `ReadAuthority`; `/administration/settings/tenant` is a separate "Workspace settings" entry at `AdminAuthority` (label, breadcrumbs, and static title all say "Workspace settings", closing the IA-006-family mismatch in §8). Implementation also split the hub by **audience**: `settings-master-audience.ts` derives audience from each destination's data scope, the hub publishes only `workspace-admin` rows, and personal settings (`preferences`, `account-security`) moved to a new ungated top-bar account menu — they were previously unreachable from any nav builder. The duplicated executive digest editor was removed from the tenant page in favour of the Digests hub.

**IA-017 · Health-surface audience naming** — **P2 · XS**
- **Problem:** `/health` ("System health", customer Administration) vs. `/admin/health` ("Diagnostics dashboard", Internal Operations) — same concept name, different audiences. `[PI]`
- **Change:** Rename nav labels: "Service status" (customer) and "Internal diagnostics" (employee). Routes unchanged.
- **Acceptance:** per shared criteria; no label contains "health" twice across the two groups.

**IA-018 · Help breadcrumb and entry normalization** — **P2 · XS**
- **Problem:** `/help/*` breadcrumbs use "Support" or "Help" interchangeably; Help has no sidebar presence (top-bar icon + contextual only). `[PI]`
- **Change:** Standardize crumbs on "Help"; keep top-bar entry (adding a sidebar footer "Help" link is optional — defer to beta feedback).
- **Acceptance:** all help crumbs share one parent label.

**IA-019 · Navigation and route-entry telemetry** — **Done (2026-07-14)** — **P1 · S**
- **Problem:** Web Vitals telemetry exists (TB-692) but there is no navigation-click or route-entry funnel to validate progressive unlock, consolidated omissions, or the reports family. `[PI]` for absence of nav-click events in the nav components; `[SMI]` overall.
- **Change:** Emit AppInsights custom events: `NavLinkClick` (href, group, tier, unlock phase, shell mode), `RouteEntered` (normalized route, referrer type: nav/palette/card/deep-link), `UnlockPhaseChanged`. Dimensions must reuse the normalized-route convention from `WebVitalsMetric`.
- **Acceptance:** dashboards can answer: % of sessions reaching Governance pre/post unlock; palette-only destination usage; draft resume rate; report-surface split.
- **Priority:** P1 — it gates every deferred structural decision. **Risk if deferred:** post-beta IA decisions stay opinion-based.
- **Shipped:** `operator-navigation-telemetry.ts`, `operator-navigation-referrer.ts`, `OperatorRouteEnteredTelemetry`, sidebar/palette/unlock wiring; tests in `operator-navigation-telemetry.test.ts`.

**IA-020 · Remove the governance-view mode branch** — **P1 · S (D2 resolved 2026-07-14 — delete)**
- **Problem:** Vocabulary switching, presentation gate, and a nav filter exist for "governance view"; the toggle is not mounted and the nav filter is unused outside tests. Mode is enable-able only via `localStorage`. `[PI]`
- **Change (per D2 — delete):** Remove `GovernanceModeToggle`, `filterNavGroupsForGovernanceMode`, the `archlucid_governance_mode_enabled` storage key handling, and the dual-vocabulary branches in `governance-mode-vocabulary.ts`; collapse to one vocabulary using the already-canonical terms ("Signed review record", "Authority chain" per the canonical-product-terms module — confirm final noun choice against the D7 baseline during implementation). Delete the associated mode tests rather than leaving them asserting dead code.
- **Acceptance:** no unreachable vocabulary branch ships; grep finds no references to the removed storage key or filter; tests match the shipped single-vocabulary behavior.

**IA-021 · Opaque nav label pass** — **P3 · XS**
- **Problem:** "Impact preview" (`/insights/impact-preview`), "Programs" (group), "Advisory scans" are labels a first-time user cannot map to intent. `[PRV]` — validate with beta users before renaming.
- **Change:** After beta feedback: candidate renames ("Change impact preview"; group "Improvement programs"). No URL changes.

**IA-022 · Guide-content placement review** — **P3 · S**
- **Problem:** `/governance/first-30-days` (a guide) sits in the Governance nav beside operational queues; `/onboarding` already owns guided setup. `[PI]`
- **Change (post-beta):** fold into help registry or an `/onboarding` governance phase; keep a redirect.

---

## 12. Suggested implementation sequence

| Wave | Items | Rationale |
|---|---|---|
| **Wave 1 — before beta invites (P0)** | IA-001 ✓, IA-002 ✓, IA-005 ✓, IA-008 ✓ | Dead ends, stranded work, wrong mental model, empty flagship |
| **Wave 2 — with wave 1 or first beta patch (P1 copy/labels)** | IA-003 ✓, IA-004 ✓, IA-010 ✓, IA-012 ✓, IA-013 ✓ | XS copy items; batch into one terminology PR so drift guards update once |
| **Wave 3 — early beta (P1 structural-lite)** | IA-019 ✓, IA-006 ✓, IA-007 ✓, IA-011, IA-020 | Telemetry must precede the still-deferred decisions; naming convergence, hand-off gate, and governance-view removal ride behind it |
| **Wave 4 — mid-beta hygiene (P2)** | IA-014, IA-016 ✓, IA-017, IA-018, IA-009 D6 carve-out (`/governance/dashboard` removal) | No user-facing risk; reduces engineering drag |
| **Wave 5 — post-telemetry (P2/P3)** | IA-009, IA-015, IA-021, IA-022 | Each is explicitly gated on usage evidence |

Sequencing constraints: IA-019 before IA-009/IA-015/IA-021; D1–D5 (§14) before their dependent items; the Wave 2 copy batch updates `review-terminology-guard.test.ts` and breadcrumb tests in the same change, never separately (the guards are designed to fail otherwise).

---

## 13. Validation plan

**Telemetry to add (IA-019) and the decisions it validates:**

| Question | Metric | Decides |
|---|---|---|
| Does progressive unlock help or hide? | % sessions visiting Governance/Insights pre vs. post unlock; unlock-hint click-through | Keep phases vs. flatten to tier disclosure |
| Are consolidated omissions correct? | Palette vs. nav referrals for `/digests`, `/value-report/*` | IA-009 shape (value-report portion; `/governance/dashboard` already resolved by D6) |
| Draft stranding severity | Drafts created vs. resumed vs. spawned; post-spawn draft edits (and acknowledgment click-through) | Whether the D4 soft gate should tighten to a hard lock |
| Report surface overlap | Route entries + dwell per reporting surface, by persona rank | IA-009 value-report tab conversion |
| Evidence-tool naming | Help searches for "trail"/"graph"/"provenance"; `/graph` entry referrers | IA-006 completeness; whether an evidence hub is warranted |
| Ask dead end | `/ask` visits with zero finalized records | Gate or empty-state redesign |

**Beta-facilitated checks (no telemetry needed):** first-session task tests — "find your saved draft" (IA-002), "export the finalized review" (IA-003), "show me every signed decision" (IA-001/IA-015), "what does ArchLucid do besides review?" (IA-005 framing).

**Regression net:** the existing drift-guard pattern (terminology guard, nav structure test, onboarding hub contract) is the right mechanism; Waves 2–3 extend it to breadcrumb-segment ↔ nav-label equality and preset-CTA ↔ redirect-source disjointness.

---

## 14. Product decisions — RESOLVED (owner, 2026-07-14)

All seven decisions were put to the owner one at a time on 2026-07-14 and resolved as follows. Dependent backlog items are no longer blocked.

| # | Decision | Owner resolution (2026-07-14) | Effect on backlog |
|---|---|---|---|
| **D1** | Signed-records inventory | **Build a real signed-records index page** in the Governance group (review title, version, committed date, link to review) | IA-001 proceeds with the index-page option; redirect fallback discarded |
| **D2** | Governance view mode | **Delete the branch** — remove the unmounted toggle, the unused nav filter, and collapse to one vocabulary | IA-020 becomes a removal task; IA-006 converges on the single (governance-view-on) canonical nouns already marked canonical ("Signed review record") |
| **D3** | Pattern library in beta | **Data-driven visibility** — nav item appears only when the aggregates endpoint reports the threshold met; route stays live for deep links with an honest below-threshold state | IA-008 implemented as the S-complexity data-driven option, not the XS flag-off option |
| **D4** | Draft post-spawn policy | **Acknowledged divergence** — draft stays editable, but only after the user explicitly acknowledges that edits will not flow into the already-spawned review | IA-007 implements the soft gate, not the hard lock; keep the post-spawn-edit telemetry to revisit |
| **D5** | Settings landing | **Hub-first** — the sidebar "Settings" item targets the searchable `/administration/settings` index | IA-016 unblocked; breadcrumbs and nav label updated together |
| **D6** | `/governance/dashboard` fate | **Remove now** — redirect to `/dashboard` and fold any unique KPI tiles into it; do not wait for telemetry | The `/governance/dashboard` portion of IA-009 is carved out as immediately actionable (see IA-009 note); disposition changes to Remove (with redirect) |
| **D7** | Terminology baseline | **Commit the "Reviews" consolidation as-is** — it is the settled terminology baseline for all backlog waves and supersedes the TB-738 "Architecture packages" state and the "package" conflict flagged in `architecture_review_object_model_assessment.md` | Waves 2–3 unblocked once the working-tree consolidation is committed (owner names the branch per repo convention) |

---

## Appendix A — Mandatory challenge questions (direct answers)

1. **Navbar: customer goals or internal modules?** Customer goals — the pilot group is a task sequence, not module names `[PI]`. "Programs" is the exception (module-ish name).
2. **Is "Reviews" carrying foreign responsibilities?** Less than before: the hub now carries lifecycle stages (Architecture definition → … → Approval, `reviews-hub-review-status.ts`), which correctly absorbs creation/evidence/governance *status* without absorbing their workflows. Acceptable.
3. **Creation vs. review distinct but connected?** Connected in data (both end in `Run`), distinct in entry. The defect is the home cards' peer-object framing (IA-005) and the dual-editor overlap (IA-007), not the route split.
4. **Governance / Audit / Evidence / Executive non-overlapping?** Governance and Audit: yes (queue vs. ledger, audit nested under governance — defensible). Evidence: no single home (accepted, deferred). Executive: overlapping (Finding 4).
5. **System-health/admin placement?** Yes — Administration group is where admins expect it; naming defect only (IA-017).
6. **Top-level → secondary candidates?** "First review guide" already auto-demotes post-commit (good pattern). "Governance setup guide" should follow it (IA-022).
7. **Secondary/hidden → top-level candidates?** Drafts list (to reachable, not top-level); signed-records index (to Governance group).
8. **Pages existing because features shipped at different times?** Yes: the six reporting surfaces; three cost-reporting URLs; two ITSM hubs (one redirected); `/insights/architecture-scorecard` vs. `/executive/scorecard`.
9. **Same object, multiple presentations?** `Run`: hub row, home card, detail workspace, showcase, snapshot, compare picker — all intentional views. The problematic pair is draft editor vs. Architecture tab (IA-007).
10. **Tabs where routes would be clearer?** No — the 8-tab review workspace is right for one object. **Routes where tabs would be clearer?** `/value-report/{pilot,roi}` (IA-009).
11. **Users taken out of the shell unnecessarily?** `/executive/scorecard` uses a separate executive chrome; acceptable for a sponsor leave-behind, but label it (IA-010). Help stays in-shell (good, TB-143–148).
12. **Demo/sample/setup/production differentiated?** Yes — badges, seeded-sample flows, strict demo nav gates `[PI]`. Residual: internal demo tooling in customer route space (IA-014).
13. **Disabled/future capabilities harming clarity?** Pattern library pre-threshold (IA-008); governance view half-wired (IA-020).
14. **Version labels/internal API/dev-state shaping IA?** Copy-level only (IA-013); not structural.
15. **Does the IA imply review-only?** Largely yes — and that is currently *truthful*. The correction is the lifecycle framing (creation → review → governance → reporting as one loop), not manufacturing peer inventories.
16–21. **Coherent homes:** architecture work — yes (`/` + create/drafts once IA-002 lands); review work — yes (`/reviews`); governance — yes post-unlock (`/governance`); evidence — **no** (accepted gap, telemetry-gated); administration — yes.
22. **Can users understand tenant/workspace/project/architecture/review/package/evidence scope?** Tenant/workspace/project: yes via ScopeSwitcher + `/help/scope`. Architecture-vs-review: only after IA-005/IA-007. "Package": retired from lists in the working tree; residuals are compound export nouns ("evidence package ZIP") — acceptable if D7 commits the consolidation.

## Appendix B — Disposition summary

| Disposition | Routes |
|---|---|
| Retain as-is | ~100 of 134 (all marketing, auth, most governance/insights/settings/integrations/internal-ops, review lifecycle core) |
| Retain with revised purpose | `/`, `/architectures/[id]`, `/reviews/[runId]` (tab label), `/executive/scorecard` |
| Rename (labels only) | `/graph` family surfaces, `/health`, `/admin/health`, `/governance/findings` crumb, `/dashboard` title family |
| Move within navigation | `/governance/first-30-days` (P3, post-beta) |
| Promote to reachable | `/architectures`, `/signed-records` (index) |
| Demote to secondary | none new ("First review guide" auto-demote already shipped) |
| Merge / convert to tab | `/value-report/pilot`, `/value-report/roi` (deferred, P2) |
| Convert from tab to route | none |
| Redirect | keep all 40+ existing rules |
| Hide from private beta | `/patterns` nav item, `/demo/explain`, `/example-roi-bulletin` (decision) |
| Remove (page files) | `/integrations/itsm` (**removed**), `/executive/dashboard`, `/admin/ai-usage-cost` (retired redirect-only), `/operate/architecture-graph`, `/why-archlucid` (fold into `/why`) |
| Requires product decision | `/example-roi-bulletin` beta visibility; `/governance/first-30-days` placement (IA-022, P3). D1–D7 were resolved by the owner on 2026-07-14 (§14) |
