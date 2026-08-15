> **Scope:** Manual QA â€” ordered UI click sequence for every **current** operator, marketing, and Internal screen, including empty vs populated variants. Complements [`MANUAL_QA_CHECKLIST.md`](./MANUAL_QA_CHECKLIST.md). This is the 2026-08-15 refresh of [`UI_SCREEN_COVERAGE_SEQUENCE.md`](./UI_SCREEN_COVERAGE_SEQUENCE.md) (keep v1 as the historical pass).

# UI screen coverage sequence 2 (empty vs populated)

**Audience:** Manual QA, release walkthroughs, founder exploratory passes.  
**Sources of truth:** `archlucid-ui/src/lib/*-nav-group-builder.ts`, `archlucid-ui/src/app/**/page.tsx`, `archlucid-ui/src/lib/product-documentation-registry.ts`.  
**Related:** [`MANUAL_QA_CHECKLIST.md`](./MANUAL_QA_CHECKLIST.md), [`LIVE_E2E_WORD_QA_COMPANION.md`](./LIVE_E2E_WORD_QA_COMPANION.md), [`docs/library/OPERATOR_ATLAS.md`](../library/OPERATOR_ATLAS.md).

**Principle:** Visit each list/hub once with **no tenant work** (Pass A), create at least one finalized architecture package (Phase 2), then revisit the same routes (Pass B). Use an **Admin** principal with Internal nav enabled (`features.showSystemAdministrationNav`) so every sidebar group is visible.

Mark each row **A** (empty) / **B** (populated) / **N/A** as you go.

---

## What changed vs sequence 1 (do not re-test retired URLs)

### Removed from the walk (no App Router page, or 404 by design)

| Old route | Why |
|-----------|-----|
| `/insights/pilot-outcomes` as a destination | Page **redirects** to `/insights/sponsor-report`. Do not treat it as a separate screen. |
| Architecture intelligence as a **sidebar** item | Still a real page, but **contextual-only** (TB-2241): reach from review detail, findings, command palette, or help â€” not Review work nav. |

### Corrected canonical paths

| Sequence 1 | Sequence 2 |
|------------|------------|
| `/administration/tenant` | `/administration/workspace-settings` |
| `/administration/tenant/recycle-bin` | `/administration/workspace-settings/recycle-bin` |
| `/architecture/reviews/{runId}` in notes | `/architecture/reviews/{reviewId}` (App Router segment is `[reviewId]`) |
| Help â€œGuides + Troubleshooting tabsâ€ | Help hub is a **single guides list**; advanced topics behind **Show advanced topics**. |

### Added (shipped after sequence 1 or missed)

- `/architecture/reviews/new` and `?path=quick-review` / `guided-intake` / `detailed`
- `/governance/findings/assigned-to-me`
- `/administration/notifications`
- `/internal/agent-model-catalog`, `/internal/platform-bundled-policy-packs`
- `/auth/bootstrap`, `/auth/callback`
- Review print: `/architecture/reviews/{reviewId}/print`
- Committed review tabs (`?reviewTab=`), create-home tabs (`?archTab=`), findings job views (`findingJobView=`)
- Model governance **Azure OpenAI tenant connection** card (on `/administration/model-governance`)

---

## How to get empty vs populated

| Pass | Goal | How |
|------|------|-----|
| **A â€” Empty** | Lists, hubs, and detail shells with no tenant work | Fresh tenant / DB with no reviews, or a workspace that has never finalized a review. Do **not** open sample/demo packages yet. |
| **B â€” Populated** | Same routes with real rows | Finish **Phase 2** (create â†’ run â†’ finalize at least one review), optionally a second review for compare, then seed governance/integrations as noted below. |
| **Demo / marketing populated** | Anonymous showcase chrome | `/see-it`, `/showcase/{runId}` â€” separate from tenant empty/populated. |

**Suggested session order**

1. Phase 0 â€” marketing & auth  
2. Phase 1 Pass A â€” empty operator shell  
3. Phase 2 â€” lifecycle (populate)  
4. Phase 1 Pass B â€” revisit hubs  
5. Phase 3 â€” ID satellites  
6. Phase 4 â€” Reader / Execute / command palette / Report a problem  

---

## Phase 0 â€” Auth and marketing (outside operator nav)

Do once. Variants are mostly static or form-state, not inventory empty/full.

| Done | Route | Regression notes |
|:----:|-------|------------------|
| [ ] | `/welcome` | Marketing home. |
| [ ] | `/why` | Comparison copy; no Contoso preview deep link. |
| [ ] | `/pricing` | Plan names match Billing & plans. |
| [ ] | `/faq` | |
| [ ] | `/privacy` | |
| [ ] | `/accessibility` | Keyboard / skip-link sanity. |
| [ ] | `/trust` | Trust Center â€” no CPA SOC 2 or third-party pen-test claims. |
| [ ] | `/security-trust` | Public security & trust. |
| [ ] | `/compliance-journey` | |
| [ ] | `/get-started` | |
| [ ] | `/quick-scan` | Form: primary CTA disabled until required fields valid (TB-2005). |
| [ ] | `/see-it` | Demo preview spine. Honesty: not a live tenant session. |
| [ ] | `/example-roi-bulletin` | |
| [ ] | `/signup` | |
| [ ] | `/signup/verify` | |
| [ ] | `/showcase/{runId}` | Static sample when published. |
| [ ] | `/auth/signin` | Email / SSO / code steps. |
| [ ] | `/auth/callback` | OAuth PKCE â€” expect loading then home or failure panel (do not leave hung). |
| [ ] | `/auth/bootstrap` | First-session bootstrap if shown after sign-in. |
| [ ] | `/auth/session-expired` | Direct visit + after idle timeout if available. |
| [ ] | `/auth/invite` | Needs invite token when available. |
| [ ] | `/403` | Open an Admin URL as Reader. |


---

## Phase 1 â€” Operator shell by nav group

Sign in as **Admin**. Complete the table in **Pass A**, then again in **Pass B** after Phase 2.

### Review work (`pilot`)

Architecture intelligence is **not** in this group. Workspace health is under **Governance** (hash on sponsor dashboard).

| # | Route | Empty (A) | Populated (B) | Extra regression | A | B |
|---|-------|-----------|---------------|------------------|:-:|:-:|
| 1 | `/` Home | Checklist / start first review | Next steps, recent activity | Command palette (`Ctrl/Cmd+K`) lists Home; Do-this-next vs Review guidance do not fight. | [ ] | [ ] |
| 2 | `/architecture/architectures` | Empty list | Draft + linked architectures | Soft-delete a draft â†’ recycle bin (Phase 1 admin). | [ ] | [ ] |
| 3 | `/architecture/architectures/new` | Blank create form | â€” | Continue disabled until intent valid. | [ ] | â€” |
| 4 | `/architecture/reviews` | Empty inventory (or drafts, no runs) | Package table | Filters, favourites, summary vs inventory vs drafts. | [ ] | [ ] |
| 5 | `/architecture/reviews/new` | Intake chooser | Prefill from architecture if linked | See Phase 2 path switcher rows. | [ ] | [ ] |
| 6 | `/architecture/sponsor-dashboard` | Empty KPIs | Metrics after finalize | Exports; board-pack evidence posture. | [ ] | [ ] |
| 7 | `/architecture/first-review-guide` | Hub status + deep links | Status after first finalize | After first finalize, nav demotes / moves last (TB-524). | [ ] | [ ] |
| 8 | `/architecture/digests?tab=get-started` | Empty browse | Generated digests | Sample-mode honesty if demo seed. | [ ] | [ ] |
| 9 | `/architecture/digests?tab=subscriptions` | Empty subscriptions | Rows after create | Reader: CRUD disabled. Execute: create/pause. | [ ] | [ ] |
| 10 | `/architecture/digests?tab=schedule` | Unconfigured / paused | Saved cadence + recipients | Recipients + pause/resume. | [ ] | [ ] |

**Contextual (not in sidebar):** `/architecture/architecture-intelligence` â€” empty vs after Execute closed-loop. Open from a review or findings CTA, not left nav.

### Analysis (`operate-analysis`)

| # | Route | Empty (A) | Populated (B) | Extra regression | A | B |
|---|-------|-----------|---------------|------------------|:-:|:-:|
| 11 | `/insights/evidence-graph` | No graph / pick a review | Graph for finalized run | Trace table vs interactive graph; sample-mode banner. | [ ] | [ ] |
| 12 | `/insights/ask-review-questions` | Empty thread / no run | Thread with answers | Grounding / citations; no invented sources. | [ ] | [ ] |
| 13 | `/insights/search-review-evidence` | Empty results | Hits after index | Scope to one review vs workspace. | [ ] | [ ] |
| 14 | `/insights/compare-two-reviews` | Need two runs | Diff after 2+ finalizes | **0 / 1 / 2+** runs. Policy-pack mismatch and cloud-target mismatch banners if seeded. | [ ] | [ ] |
| 15 | `/insights/impact-preview` | Empty candidates | Simulation results | Nav reachability of operator links in empty CTA. | [ ] | [ ] |
| 16 | `/insights/improvement-planning` | Empty themes/plans | Plan list | Hide zero KPIs/export until plans exist. | [ ] | [ ] |
| 17 | `/insights/architecture-scorecard` | Empty scorecard | Metrics after finalize | Empty-state dashes, not large zeros. | [ ] | [ ] |
| 18 | `/insights/patterns` | Empty or catalog-only | Adoption signals | | [ ] | [ ] |
| 19 | `/insights/sponsor-report` | Empty / no report | Outcomes + exports | Merged former pilot-outcomes. DOCX / board-pack Execute-gated. | [ ] | [ ] |
| 20 | `/insights/roi-summary` | Empty ROI | Hours / severity estimate | Aligns with baseline settings. | [ ] | [ ] |

### Governance (`operate-governance`)

| # | Route | Empty (A) | Populated (B) | Extra regression | A | B |
|---|-------|-----------|---------------|------------------|:-:|:-:|
| 21 | `/governance/approval-queue` | Empty queue | Pending approvals | Reader: mutations disabled with copy. | [ ] | [ ] |
| 22 | `/governance/findings` | Empty risk queue | Owned findings | Job-view chips (`findingJobView=`): needs-my-decision, needs-governance, ready-for-sponsor-packet, deferred, answer-these-questions, verify-hypotheses, resolve-contradictions, coverage-gaps, disposition-closed. Active filter chips clear. | [ ] | [ ] |
| 23 | `/governance/findings/assigned-to-me` | Empty â€œassigned to youâ€ | Assigned rows | Empty secondary CTA to full findings queue. Freshness â€œLast checkedâ€. | [ ] | [ ] |
| 24 | `/governance/exceptions` | No waivers | Active exceptions | Renew / revoke as Execute. | [ ] | [ ] |
| 25 | `/governance/policy-packs` | Empty or defaults only | Assigned packs | Catalog vs my-packs. | [ ] | [ ] |
| 26 | `/governance/policy-packs/{id}` | Detail shell | Scoped assignment | | [ ] | [ ] |
| 27 | `/governance/standards-and-rules` | Empty diagnosis | Conflict / precedence | | [ ] | [ ] |
| 28 | `/governance/decision-register` | Empty dispositions | Signed decisions | | [ ] | [ ] |
| 29 | `/governance/sealed-records` | Empty | Manifests after finalize | Buyer noun is **sealed review record**. | [ ] | [ ] |
| 30 | `/governance/advisory-scans?tab=scans` | Empty scans | Scan results | | [ ] | [ ] |
| 31 | `/governance/advisory-scans?tab=schedules` | Empty schedules | CRUD schedules (Execute) | | [ ] | [ ] |
| 32 | `/governance/audit` | Empty audit table | Events after actions | Search / integrity export if offered. | [ ] | [ ] |
| 33 | `/governance/alerts` | Empty inbox | Open / ack alerts | Ack vs open. | [ ] | [ ] |
| 34 | `/governance/alert-rules` | Empty / defaults | Configured rules | Tabs: conditions, `?tab=notifications`, `?tab=advanced-rules`, `?tab=test-alerts`. | [ ] | [ ] |
| 35 | `/governance/recurrence-schedules` | Empty recurrence | Follow-up schedules | | [ ] | [ ] |
| 36 | `/governance/setup` | Setup guide status | Completion status | | [ ] | [ ] |
| 37 | `/architecture/sponsor-dashboard#workspace-health` | Empty posture | Populated KPIs | Governance nav â€œWorkspace healthâ€ â€” same page as #6, jump to section. | [ ] | [ ] |

### Integrations (`operate-integrations`)

| # | Route | Empty (A) | Populated (B) | Extra regression | A | B |
|---|-------|-----------|---------------|------------------|:-:|:-:|
| 38 | `/integrations/cloud-connections` | No providers | Connected providers | Execute-gated. | [ ] | [ ] |
| 39 | `/integrations/cloud-connections/azure` | Disconnected form | Connected + health | | [ ] | [ ] |
| 40 | `/integrations/cloud-connections/aws` | Disconnected form | Connected + health | | [ ] | [ ] |
| 41 | `/integrations/cloud-connections/gcp` | Disconnected form | Connected + health | | [ ] | [ ] |
| 42 | `/integrations/jira` | Not configured | Configured | Admin-gated. Do not complete OAuth in a shared tenant unless intended. | [ ] | [ ] |
| 43 | `/integrations/azure-boards` | Not configured | Configured | Help connection context if linked. | [ ] | [ ] |
| 44 | `/integrations/servicenow` | Not configured | Configured | | [ ] | [ ] |
| 45 | `/integrations/teams` | Not configured | Configured | Read can view; mutations per page. | [ ] | [ ] |
| 46 | `/integrations/slack` | Not configured | Configured | | [ ] | [ ] |
| 47 | `/integrations/webhooks` | Not configured | Configured | Execute-gated. | [ ] | [ ] |

Skip `/integrations/itsm/oauth/callback` as a walk row (OAuth bounce only).

### Administration (`operator-admin`)

| # | Route | Empty / configured notes | Extra regression | A | B |
|---|-------|--------------------------|------------------|:-:|:-:|
| 48 | `/administration` | Settings index (link inventory) | Search cards; every card lands. | [ ] | [ ] |
| 49 | `/administration/notifications` | Channel hub vs configured | Digests / alerts / Teams / Slack launchers. | [ ] | [ ] |
| 50 | `/administration/workspace-settings` | Trial / cost / scope unset vs set | Admin only; Reader restricted state. **Not** `/administration/tenant`. | [ ] | [ ] |
| 51 | `/administration/workspace-settings/recycle-bin` | Empty bin vs restored projects | Restore after soft-delete. | [ ] | [ ] |
| 52 | `/administration/users?tab=users` | Empty directory vs invited | | [ ] | [ ] |
| 53 | `/administration/users?tab=roles` | Default roles vs assignments | | [ ] | [ ] |
| 54 | `/administration/users?tab=keys` | Keys tab vs API keys page | Cross-check with `/administration/api-keys`. | [ ] | [ ] |
| 55 | `/administration/users/invite-reviewer` | Invite form | CTA disabled until email valid. | [ ] | â€” |
| 56 | `/administration/identity-providers` | Catalog vs IdP configured | | [ ] | [ ] |
| 57 | `/administration/identity-providers/oidc` | | | [ ] | [ ] |
| 58 | `/administration/identity-providers/saml` | | | [ ] | [ ] |
| 59 | `/administration/identity-providers/role-mapping` | | | [ ] | [ ] |
| 60 | `/administration/identity-providers/diagnostics` | | | [ ] | [ ] |
| 61 | `/administration/identity/sso-wizard` | Incomplete vs complete | | [ ] | [ ] |
| 62 | `/administration/api-keys` | No keys vs list | Create / revoke; never screenshot secrets. | [ ] | [ ] |
| 63 | `/administration/scim-provisioning` | Token unset vs verified | | [ ] | [ ] |
| 64 | `/administration/billing` | Plan packaging | Current plan summary; trial vs paid copy. | [ ] | [ ] |
| 65 | `/administration/ai-usage` | Zero spend vs trends | Admin-only nav. Cap / gate messaging. | [ ] | [ ] |
| 66 | `/administration/baseline` | Defaults vs saved ROI basis | Hours / people per review. | [ ] | [ ] |
| 67 | `/administration/security-trust` | Links / assessment status | No implied CPA attestation. | [ ] | [ ] |
| 68 | `/administration/connection-status` | Disconnected vs ready | | [ ] | [ ] |
| 69 | `/administration/system-health` | Ready vs degraded | Live vs demo-safe shell; related readiness strip. | [ ] | [ ] |
| 70 | `/administration/support` | Support bundle | Execute; Reader cannot download. | [ ] | [ ] |
| 71 | `/administration/model-governance` | Via Settings index | **Azure OpenAI connection** card: disconnected vs saved vs probe health. Do not paste keys into tickets. | [ ] | [ ] |
| 72 | `/administration/extract-upload` | Via Settings index | | [ ] | [ ] |
| 73 | `/administration/developer` | Via Settings index | | [ ] | [ ] |
| 74 | `/administration/auth-domains` | Via Settings index | | [ ] | [ ] |
| 75 | `/account/preferences` | Account menu | Personal prefs (not workspace notifications). | [ ] | â€” |
| 76 | `/account/security` | Account menu | | [ ] | â€” |

### Internal (`operator-system-admin`)

Requires host / `features.showSystemAdministrationNav`. Walk once empty, once after fleet or demo activity.

| Done A | Done B | Route | Extra regression |
|:------:|:------:|-------|------------------|
| [ ] | [ ] | `/internal/pricing-quote-aging` | |
| [ ] | [ ] | `/internal/trial-funnel` | |
| [ ] | [ ] | `/internal/fleet-llm-cogs` | |
| [ ] | [ ] | `/internal/agent-model-catalog` | **New vs sequence 1.** Alias lifecycle; no tenant secrets in UI. |
| [ ] | [ ] | `/internal/tenant-health` | |
| [ ] | [ ] | `/internal/tenants` | Provision / pause only in a disposable environment. |
| [ ] | [ ] | `/internal/health` | Distinct from `/administration/system-health`. |
| [ ] | [ ] | `/internal/deployment-status` | BUILD_ID agreement. |
| [ ] | [ ] | `/internal/rag-health` | |
| [ ] | [ ] | `/internal/configuration` | |
| [ ] | [ ] | `/internal/failed-integration-messages` | Retry only on disposable events. |
| [ ] | [ ] | `/internal/evidence-proposals` | |
| [ ] | [ ] | `/internal/platform-bundled-policy-packs` | **New vs sequence 1.** Fleet activate/deactivate. |
| [ ] | [ ] | `/internal/validate-route` | Replay / integrity. |
| [ ] | [ ] | `/internal/recommendation-learning` | |
| [ ] | [ ] | `/internal/product-learning` | |
| [ ] | [ ] | `/internal/demo-readiness` | Showcase seed vs missing. |
| [ ] | [ ] | `/internal/integrations/itsm` | **Not in Internal sidebar** â€” open from Settings / help / URL. Onboarding wizard vs connector list. |

### Help and misc operator

| Done | Route | Notes |
|:----:|-------|-------|
| [ ] | `/help` | Single guides list. Expand **Show advanced topics**. |
| [ ] | `/help/{topic}` | Spot-check high-traffic: `getting-started`, `first-architecture-review`, `findings`, `evidence-trail`, `governance-approval`, `policy-packs`, `digests`, `workspace-settings`, `users-and-roles`, `troubleshooting`, `cli-usage`, `report-a-problem`, `architecture-intelligence`, `notifications`, `model-governance`. Full slug list: `product-documentation-registry.ts`. |
| [ ] | `/why-archlucid` | In-app why (authenticated). |
| [ ] | `/demo/explain` | Demo seed present vs missing. |

**Shell (no dedicated route):** Command palette â€” search a Review work, Analysis, Governance, and Admin destination; confirm architecture intelligence appears for Execute and not in sidebar.

---

## Phase 2 â€” Create lifecycle variants (populate pass)

Do once; unlocks almost every populated and multi-state review screen.

| Done | Step |
|:----:|------|
| [ ] | Start from Home, **Architectures â†’ New**, or `/architecture/reviews/new` |
| [ ] | Path switcher: `?path=quick-review` (default bare `/new`) |
| [ ] | Path switcher: `?path=guided-intake` |
| [ ] | Path switcher: `?path=detailed` |
| [ ] | Wizard: evidence-only / **No cloud** |
| [ ] | Wizard: cloud target selected (even if not connected) |
| [ ] | Wizard: with file uploads vs empty evidence |
| [ ] | Wizard: validation-blocked CTA vs ready-to-submit (inline errors, no validation toast) |
| [ ] | Submit â†’ `/architecture/reviews/{reviewId}` |
| [ ] | **Create-home** (`intent=create-architecture`): every `?archTab=` â€” overview, diagram, clarifications, findings, evidence, governance, activity |
| [ ] | **Committed review** (`?reviewTab=`): overview, findings, evidence, policies, decisions-remediation, review-package, architecture, activity |
| [ ] | Findings tab: each `findingJobView=` lane + lane callout on finding inspect |
| [ ] | State: **In progress** |
| [ ] | State: **Ready to finalize** |
| [ ] | State: **Needs attention** (if blockers) |
| [ ] | State: **Finalized** (after Finalize) â€” sealed record title is not raw upload markdown |
| [ ] | Print `/architecture/reviews/{reviewId}/print` |
| [ ] | Finding detail `/architecture/reviews/{reviewId}/findings/{findingId}` |
| [ ] | Evidence trace `â€¦/findings/{findingId}/evidence-trace` |
| [ ] | Provenance `/architecture/reviews/{reviewId}/provenance` |
| [ ] | Sealed record `/governance/sealed-records/{manifestId}` |
| [ ] | Second review â†’ finalize (unlocks Compare and richer digests/ROI) |
| [ ] | Optional: digest subscription + enable schedule |
| [ ] | Optional: alert rule â†’ inbox row |
| [ ] | Optional: advisory scan + one schedule |
| [ ] | Optional: approve/waive one finding; assign one finding to self (assigned-to-me) |
| [ ] | Optional: connect one integration |
| [ ] | Optional: invite one user |
| [ ] | Optional: save Azure OpenAI connection on model governance (probe, then disconnect in disposable tenant) |
| [ ] | **Report a problem** from a high-stakes surface (review detail, findings, compare) â€” dialog copy, no GitHub blob links |

Then **re-run Phase 1 as Pass B**.

---

## Phase 3 â€” Satellite screens (need IDs)

| Done | Screen | How |
|:----:|--------|-----|
| [ ] | `/architecture/architectures/{architectureId}` | Architectures list â€” every create-home tab if offered |
| [ ] | `/insights/improvement-planning/plans/{planId}` | Planning after a plan exists |
| [ ] | `/insights/patterns/{patternKey}` | Patterns list |
| [ ] | `/governance/approval-requests/{id}/lineage` | Approval queue item |
| [ ] | `/governance/sealed-records/{manifestId}` | Sealed records list |
| [ ] | Policy pack detail | Policy packs list |

---

## Phase 4 â€” Authority and shell variants

| Done | Check |
|:----:|-------|
| [ ] | As **Reader**: Admin/Internal nav hidden; mutation CTAs disabled (approval, digest subscriptions, support bundle, admin integrations, model-governance writes) |
| [ ] | As **Execute**: governance mutations + digest subscription CRUD; no Users/SSO/Internal; architecture intelligence reachable |
| [ ] | Operator â†” Sponsor shell toggle (if exposed) lands on portfolio overview |
| [ ] | Before vs after first finalize: **First review guide** nav position / demotion (TB-524) |
| [ ] | Direct visit to `/administration/workspace-settings` as non-Admin shows restricted state (not a blank crash) |
| [ ] | Legacy bookmarks: `/runs/{id}` â†’ `/architecture/reviews/{id}`; `/signed-records` â†’ `/governance/sealed-records`. `/insights/pilot-outcomes` â†’ sponsor-report. |

---

## Highest-variance screens (extra time)

Spend more time here; most other pages are mainly empty vs list:

| Screen | Variants to force |
|--------|-------------------|
| Review detail | Pipeline states + every `reviewTab` + findings job views + evidence / provenance / print + exports before vs after finalize + create-home `archTab` |
| Reviews hub | No drafts; drafts only; runs present |
| Start review | Three `?path=` wizards; blocked vs ready CTA |
| Digests / Advisory / Alert rules / Users | Each `?tab=` empty and with rows |
| Compare | 0 / 1 / 2+ finalized runs; policy-pack mismatch; cloud mismatch |
| Assigned to me vs findings queue | Same finding in both; empty assigned lane |
| Integrations + cloud | Disconnected form vs connected health |
| Model governance | Azure OpenAI unset / saved / probe fail / probe ok |
| SSO wizard / IdP | Incomplete vs complete |
| Home / First review guide | Pre-first-finalize vs post-finalize |
| Command palette | Rank-filtered destinations; no Internal for Execute |

---

## Product language (fail the row if copy regresses)

On operator surfaces, prefer: *architecture package*, *finding*, *evidence trail*, *sealed review record*, *decision*, *governance approval*, *audit trail*. Do not call the package a *signed decision record*. Do not label normal review work as a *job* or *run* in buyer chrome (IDs may still appear behind disclosure).

---

## Document maintenance

When sidebar nav or App Router pages change:

1. Update route tables from `archlucid-ui/src/lib/*-nav-group-builder.ts`, `nav-contextual-only-operator-paths.ts`, and `archlucid-ui/src/app/**/page.tsx`.
2. Sync release checklist rows in [`MANUAL_QA_CHECKLIST.md`](./MANUAL_QA_CHECKLIST.md) **UI release clearance tracker** and **Navigation from home** (that file still lists some sequence-1 paths such as `/administration/tenant` â€” treat **this** document as route-canonical until that checklist is updated).
3. Prefer canonical `/architecture/*`, `/insights/*`, `/governance/*`, `/integrations/*`, `/administration/*`, `/internal/*` paths â€” do not reintroduce retired top-level bookmarks except as redirect/404 notes.

| Date | Change |
|------|--------|
| 2026-08-15 | Sequence 2: drop merged insights routes; correct workspace-settings; add assigned-to-me, notifications, reviews/new paths, reviewTab/archTab/job views, Internal catalog/policy-pack pages, model-governance Azure OpenAI, print, auth bootstrap/callback, and expanded regression notes. |
