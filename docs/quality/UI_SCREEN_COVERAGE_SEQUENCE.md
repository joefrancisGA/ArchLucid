> **Scope:** Manual QA — ordered UI click sequence to reach every operator, marketing, and Internal screen, including empty vs populated variants. Complements judgment/checklists in [`MANUAL_QA_CHECKLIST.md`](./MANUAL_QA_CHECKLIST.md); does not replace automated Vitest/Playwright coverage.

# UI screen coverage sequence (empty vs populated)

**Audience:** Manual QA, release walkthroughs, founder exploratory passes.  
**Sources of truth for routes:** `archlucid-ui/src/lib/*-nav-group-builder.ts`, App Router under `archlucid-ui/src/app/`.  
**Related:** [`MANUAL_QA_CHECKLIST.md`](./MANUAL_QA_CHECKLIST.md) (judgment + release clearance), [Navigation from home](./MANUAL_QA_CHECKLIST.md#navigation-from-home-click-through-guide) (sidebar click paths), [`LIVE_E2E_WORD_QA_COMPANION.md`](./LIVE_E2E_WORD_QA_COMPANION.md), [`docs/library/OPERATOR_ATLAS.md`](../library/OPERATOR_ATLAS.md).

**Principle:** Visit each list/hub once with **no tenant work** (Pass A), create at least one finalized architecture package (Phase 2), then revisit the same routes (Pass B). Use an **Admin** principal (and Internal nav when enabled) so every sidebar group is visible.

Mark each row **A** (empty) / **B** (populated) / **N/A** as you go.

---

## How to get empty vs populated

| Pass | Goal | How |
|------|------|-----|
| **A — Empty** | Lists, hubs, and detail shells with no tenant work | Fresh tenant / DB with no reviews, or a workspace that has never finalized a review. Do **not** open sample/demo packages yet. |
| **B — Populated** | Same routes with real rows | Finish **Phase 2** (create → run → finalize at least one review), optionally a second review for compare, then seed governance/integrations as noted below. |
| **Demo / marketing populated** | Anonymous showcase chrome | Marketing `/see-it`, `/demo/preview`, `/showcase/{runId}` — separate from tenant empty/populated. |

**Suggested session order**

1. Phase 0 — marketing & auth  
2. Phase 1 Pass A — empty operator shell  
3. Phase 2 — lifecycle (populate)  
4. Phase 1 Pass B — revisit hubs  
5. Phase 3 — ID satellites  
6. Phase 4 — Reader / Execute spot-check  

---

## Phase 0 — Auth and marketing (outside operator nav)

Do once. Variants are mostly static or form-state, not inventory empty/full.

| Done | Route | Notes |
|:----:|-------|-------|
| [ ] | `/welcome` | Marketing home |
| [ ] | `/why` | |
| [ ] | `/pricing` | |
| [ ] | `/faq` | |
| [ ] | `/privacy` | |
| [ ] | `/accessibility` | |
| [ ] | `/trust` | Trust Center |
| [ ] | `/security-trust` | Public security & trust |
| [ ] | `/compliance-journey` | |
| [ ] | `/get-started` | |
| [ ] | `/try` | |
| [ ] | `/quick-scan` | |
| [ ] | `/live-demo` | |
| [ ] | `/see-it` | Demo preview spine |
| [ ] | `/demo/preview` | |
| [ ] | `/example-roi-bulletin` | |
| [ ] | `/signup` | |
| [ ] | `/signup/verify` | |
| [ ] | `/showcase/{runId}` | Static sample when published |
| [ ] | `/auth/signin` | Sign in |
| [ ] | `/auth/session-expired` | |
| [ ] | `/auth/invite` | Needs invite token when available |
| [ ] | `/403` | Open an Admin URL as Reader |

---

## Phase 1 — Operator shell by nav group

Sign in as **Admin**. Complete the table in **Pass A**, then again in **Pass B** after Phase 2.

### Review work (`pilot`)

| # | Route | Empty (A) | Populated (B) | A | B |
|---|-------|-----------|---------------|:-:|:-:|
| 1 | `/` Home | Checklist / “start first review” | Next steps, recent activity | [ ] | [ ] |
| 2 | `/architecture/architectures` | Empty list | Draft + linked architectures | [ ] | [ ] |
| 3 | `/architecture/architectures/new` | Blank create form | — | [ ] | — |
| 4 | `/architecture/reviews` | Empty inventory (or drafts, no runs) | Package table | [ ] | [ ] |
| 5 | `/architecture/sponsor-dashboard` | Empty KPIs | Metrics after finalize | [ ] | [ ] |
| 6 | Same URL `#workspace-health` | Empty posture | Populated KPIs | [ ] | [ ] |
| 7 | `/architecture/first-review-guide` | Hub status + deep links | Status after first finalize | [ ] | [ ] |
| 8 | `/architecture/digests?tab=get-started` | Empty browse | Generated digests | [ ] | [ ] |
| 9 | `/architecture/digests?tab=subscriptions` | Empty subscriptions | Rows after create | [ ] | [ ] |
| 10 | `/architecture/digests?tab=schedule` | Unconfigured / paused | Saved cadence + recipients | [ ] | [ ] |
| 11 | `/architecture/architecture-intelligence` | Empty / no closed-loop | After Execute workflows | [ ] | [ ] |

### Analysis (`operate-analysis`)

| # | Route | Empty (A) | Populated (B) | A | B |
|---|-------|-----------|---------------|:-:|:-:|
| 12 | `/insights/evidence-graph` | No graph / pick a review | Graph for finalized run | [ ] | [ ] |
| 13 | `/insights/ask-review-questions` | Empty thread / no run | Thread with answers | [ ] | [ ] |
| 14 | `/insights/search-review-evidence` | Empty results | Hits after index | [ ] | [ ] |
| 15 | `/insights/compare-two-reviews` | Need two runs | Diff after 2+ finalizes | [ ] | [ ] |
| 16 | `/insights/impact-preview` | Empty candidates | Simulation results | [ ] | [ ] |
| 17 | `/insights/improvement-planning` | Empty themes/plans | Plan list | [ ] | [ ] |
| 18 | `/insights/architecture-scorecard` | Empty scorecard | Metrics after finalize | [ ] | [ ] |
| 19 | `/insights/patterns` | Empty or catalog-only | Adoption signals | [ ] | [ ] |
| 20 | `/insights/sponsor-summary` | Empty / no report | Sponsor summary + exports | [ ] | [ ] |
| 21 | `/insights/pilot-outcomes` | Empty outcomes | Pilot metrics | [ ] | [ ] |
| 22 | `/insights/roi-summary` | Empty ROI | Hours / severity estimate | [ ] | [ ] |

### Governance (`operate-governance`)

| # | Route | Empty (A) | Populated (B) | A | B |
|---|-------|-----------|---------------|:-:|:-:|
| 23 | `/governance/approval-queue` | Empty queue | Pending approvals | [ ] | [ ] |
| 24 | `/governance/findings` | Empty risk queue | Owned findings | [ ] | [ ] |
| 25 | `/governance/exceptions` | No waivers | Active exceptions | [ ] | [ ] |
| 26 | `/governance/policy-packs` | Empty or defaults only | Assigned packs | [ ] | [ ] |
| 27 | `/governance/policy-packs/{id}` | Detail shell | Scoped assignment | [ ] | [ ] |
| 28 | `/governance/standards-and-rules` | Empty diagnosis | Conflict / precedence | [ ] | [ ] |
| 29 | `/governance/decision-register` | Empty dispositions | Signed decisions | [ ] | [ ] |
| 30 | `/governance/signed-records` | Empty | Manifests after finalize | [ ] | [ ] |
| 31 | `/governance/advisory-scans?tab=scans` | Empty scans | Scan results | [ ] | [ ] |
| 32 | `/governance/advisory-scans?tab=schedules` | Empty schedules | CRUD schedules (Execute) | [ ] | [ ] |
| 33 | `/governance/audit` | Empty audit table | Events after actions | [ ] | [ ] |
| 34 | `/governance/alerts` | Empty inbox | Open / ack alerts | [ ] | [ ] |
| 35 | `/governance/alert-rules` | Empty rules | Configured rules | [ ] | [ ] |
| 36 | `/governance/recurrence-schedules` | Empty recurrence | Follow-up schedules | [ ] | [ ] |
| 37 | `/governance/setup` | Setup guide status | Completion status | [ ] | [ ] |

### Integrations (`operate-integrations`)

| # | Route | Empty (A) | Populated (B) | A | B |
|---|-------|-----------|---------------|:-:|:-:|
| 38 | `/integrations/cloud-connections` | No providers | Connected providers | [ ] | [ ] |
| 39 | `…/cloud-connections/azure` | Disconnected form | Connected + health | [ ] | [ ] |
| 40 | `…/cloud-connections/aws` | Disconnected form | Connected + health | [ ] | [ ] |
| 41 | `…/cloud-connections/gcp` | Disconnected form | Connected + health | [ ] | [ ] |
| 42 | `/integrations/jira` | Not configured | Configured | [ ] | [ ] |
| 43 | `/integrations/azure-boards` | Not configured | Configured | [ ] | [ ] |
| 44 | `/integrations/servicenow` | Not configured | Configured | [ ] | [ ] |
| 45 | `/integrations/teams` | Not configured | Configured | [ ] | [ ] |
| 46 | `/integrations/slack` | Not configured | Configured | [ ] | [ ] |
| 47 | `/integrations/webhooks` | Not configured | Configured | [ ] | [ ] |

### Administration (`operator-admin`)

| # | Route | Empty / configured notes | A | B |
|---|-------|--------------------------|:-:|:-:|
| 48 | `/administration` | Settings index (link inventory) | [ ] | [ ] |
| 49 | `/administration/tenant` | Trial / cost / scope unset vs set | [ ] | [ ] |
| 50 | `/administration/users` + `?tab=users\|roles\|keys` | Empty directory vs invited users | [ ] | [ ] |
| 51 | `/administration/users/invite-reviewer` | Invite form | [ ] | — |
| 52 | `/administration/identity-providers` | Catalog vs IdP configured | [ ] | [ ] |
| 53 | `…/identity-providers/oidc` | | [ ] | [ ] |
| 54 | `…/identity-providers/saml` | | [ ] | [ ] |
| 55 | `…/identity-providers/role-mapping` | | [ ] | [ ] |
| 56 | `…/identity-providers/diagnostics` | | [ ] | [ ] |
| 57 | `/administration/identity/sso-wizard` | Incomplete vs complete wizard | [ ] | [ ] |
| 58 | `/administration/api-keys` | No keys vs list | [ ] | [ ] |
| 59 | `/administration/scim-provisioning` | Token unset vs verified | [ ] | [ ] |
| 60 | `/administration/billing` | Plan packaging | [ ] | [ ] |
| 61 | `/administration/ai-usage` | Zero spend vs trends | [ ] | [ ] |
| 62 | `/administration/security-trust` | Links / assessment status | [ ] | [ ] |
| 63 | `/administration/tenant/recycle-bin` | Empty bin vs soft-deleted projects | [ ] | [ ] |
| 64 | `/administration/connection-status` | Disconnected vs ready | [ ] | [ ] |
| 65 | `/administration/system-health` | Ready vs degraded | [ ] | [ ] |
| 66 | `/administration/support` | Support bundle download | [ ] | [ ] |
| 67 | `/administration/preferences` | Account menu — self settings | [ ] | — |
| 68 | `/administration/account-security` | Account menu | [ ] | — |
| 69 | `/administration/baseline` | Via Settings index | [ ] | [ ] |
| 70 | `/administration/model-governance` | Via Settings index | [ ] | [ ] |
| 71 | `/administration/extract-upload` | Via Settings index | [ ] | [ ] |
| 72 | `/administration/developer` | Via Settings index | [ ] | [ ] |
| 73 | `/administration/auth-domains` | Via Settings index | [ ] | [ ] |

### Internal (`operator-system-admin`)

Requires host / `features.showSystemAdministrationNav`. Walk once empty, once after fleet or demo activity.

| Done A | Done B | Route |
|:------:|:------:|-------|
| [ ] | [ ] | `/internal/pricing-quote-aging` |
| [ ] | [ ] | `/internal/trial-funnel` |
| [ ] | [ ] | `/internal/fleet-llm-cogs` |
| [ ] | [ ] | `/internal/tenant-health` |
| [ ] | [ ] | `/internal/tenants` |
| [ ] | [ ] | `/internal/health` |
| [ ] | [ ] | `/internal/deployment-status` |
| [ ] | [ ] | `/internal/rag-health` |
| [ ] | [ ] | `/internal/configuration` |
| [ ] | [ ] | `/internal/failed-integration-messages` |
| [ ] | [ ] | `/internal/evidence-proposals` |
| [ ] | [ ] | `/internal/validate-route` |
| [ ] | [ ] | `/internal/recommendation-learning` |
| [ ] | [ ] | `/internal/product-learning` |
| [ ] | [ ] | `/internal/demo-readiness` |
| [ ] | [ ] | `/internal/integrations/itsm` |

### Help and misc operator

| Done | Route | Notes |
|:----:|-------|-------|
| [ ] | `/help` | Guides + Troubleshooting tabs |
| [ ] | `/help/{topic}` | Open every topic listed under Guides and Troubleshooting (including digests, glossary, users-and-roles, scope, troubleshooting, CLI when linked) |
| [ ] | `/why-archlucid` | |
| [ ] | `/demo/explain` | Demo seed present vs missing |

---

## Phase 2 — Create lifecycle variants (populate pass)

Do once; unlocks almost every populated and multi-state review screen.

| Done | Step |
|:----:|------|
| [ ] | Start from Home, **Architectures → New**, or `/architecture/reviews/new` |
| [ ] | Wizard: evidence-only / **No cloud** |
| [ ] | Wizard: cloud target selected (even if not connected) |
| [ ] | Wizard: with file uploads vs empty evidence |
| [ ] | Wizard: validation-blocked CTA vs ready-to-submit |
| [ ] | Submit → `/architecture/reviews/{runId}` |
| [ ] | Visit every run-detail **tab** (package / findings / activity / graph-related) |
| [ ] | State: **In progress** |
| [ ] | State: **Ready to finalize** |
| [ ] | State: **Needs attention** (if blockers) |
| [ ] | State: **Finalized** (after Finalize) |
| [ ] | Finding detail `/architecture/reviews/{runId}/findings/{findingId}` |
| [ ] | Evidence trace `…/findings/{findingId}/evidence-trace` |
| [ ] | Provenance `/architecture/reviews/{runId}/provenance` |
| [ ] | Signed record `/governance/signed-records/{manifestId}` (+ artifact leaf if offered) |
| [ ] | Second review → finalize (unlocks Compare and richer digests/ROI) |
| [ ] | Optional: digest subscription + enable schedule |
| [ ] | Optional: alert rule → inbox row |
| [ ] | Optional: advisory scan + one schedule |
| [ ] | Optional: approve/waive one finding |
| [ ] | Optional: connect one integration |
| [ ] | Optional: invite one user |

Then **re-run Phase 1 as Pass B**.

---

## Phase 3 — Satellite screens (need IDs)

| Done | Screen | How |
|:----:|--------|-----|
| [ ] | `/architecture/architectures/{architectureId}` | Architectures list |
| [ ] | `/insights/improvement-planning/plans/{planId}` | Planning after a plan exists |
| [ ] | `/insights/patterns/{patternKey}` | Patterns list |
| [ ] | `/governance/approval-requests/{id}/lineage` | Approval queue item |
| [ ] | Policy pack / signed-record / artifact leaves | From list rows |

---

## Phase 4 — Authority and shell variants

| Done | Check |
|:----:|-------|
| [ ] | As **Reader**: Admin/Internal nav hidden; mutation CTAs disabled (approval, digest subscriptions, support bundle, admin integrations) |
| [ ] | As **Execute**: governance mutations + digest subscription CRUD; no Users/SSO/Internal |
| [ ] | Operator ↔ Sponsor shell toggle (if exposed) lands on portfolio overview |
| [ ] | Before vs after first finalize: **First review guide** nav position / demotion (TB-524) |

---

## Highest-variance screens (extra time)

Spend more time here; most other pages are mainly empty vs list:

| Screen | Variants to force |
|--------|-------------------|
| Review detail | Pipeline states + each tab + findings / evidence / provenance + exports before vs after finalize |
| Reviews hub | No drafts; drafts only; runs present |
| Digests / Advisory | Each `?tab=` empty and with rows |
| Compare | 0 / 1 / 2+ finalized runs |
| Integrations + cloud | Disconnected form vs connected health |
| SSO wizard / IdP | Incomplete vs complete |
| Home / First review guide | Pre-first-finalize vs post-finalize |

---

## Document maintenance

When sidebar nav or App Router pages change:

1. Update route tables from `archlucid-ui/src/lib/*-nav-group-builder.ts` and `archlucid-ui/src/app/**/page.tsx`.
2. Sync release checklist rows in [`MANUAL_QA_CHECKLIST.md`](./MANUAL_QA_CHECKLIST.md) **UI release clearance tracker** and **Navigation from home**.
3. Prefer canonical `/architecture/*`, `/insights/*`, `/governance/*`, `/integrations/*`, `/administration/*`, `/internal/*` paths — do not reintroduce retired top-level bookmarks except as redirect notes.

| Date | Change |
|------|--------|
| 2026-08-10 | Initial empty-vs-populated full-screen coverage sequence. |
