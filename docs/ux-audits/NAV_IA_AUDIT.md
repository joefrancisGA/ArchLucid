# Navigation and information architecture audit

**Date:** 2026-06-28  
**Scope:** Left nav groups · Route names · Page titles · Breadcrumbs · CTAs · Cross-links between review, evidence, governance, and audit views  
**Golden path audited:** Home → Reviews list → Review detail → Executive summary → Signed review record → Evidence graph → Governance → Audit trail  
**Constraint:** No new features. Prefer structural fixes over rewrites.  
**Backlog cross-reference:** TB-516–TB-534. No conflicts with TB-431–455 — all new findings operate at the nav-structure layer.

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| P0 | 2 | Dead ends — home page not in nav; governance group hidden after first commit |
| P1 | 6 | Golden-path breaks — evidence graph order/group, missing forward CTA to governance, executive view not in nav, duplicate roles destinations |
| P2 | 8 | Confusion — label ambiguity, breadcrumb gaps, overlapping dashboard pages, group misclassification |
| P3 | 3 | Polish — minor naming precision and structural tidiness |
| **Total** | **19** | |

**Key pattern:** The stated golden path (Home → Reviews → Review detail → Executive → Governance → Audit) crosses three nav groups and includes two destinations not represented in the sidebar at all. The navigation model reflects how the product was built, not how a governance reviewer uses it.

---

## Section 1. Navigation diagnosis

### P0 findings

#### N01 · Left nav — home page missing (P0) · TB-516

**Current issue**  
No nav item links to `/` (the home page). The logo is the only return path. The `i18n` key `home: "Overview"` exists but is never added to any nav group builder.

**Why it matters**  
Any user who navigates to Reviews, Governance, or Settings has no visible way back to home. Dead end for the most common recovery pattern.

**Recommended fix**  
Add an "Overview" link (`href: "/"`) as the first item in `PilotNavGroupBuilder` at tier `"essential"`. Icon: `Home` from lucide-react.

**Fix type:** IA  
**Files:** `archlucid-ui/src/lib/pilot-nav-group-builder.ts`

---

#### N02 · Governance group — hidden from committed users (P0) · TB-517

**Current issue**  
The entire "Governance" nav group — including the Audit trail — is hidden until `operateNavUnlockPhase >= 2`. Users who have committed a review have NO nav path to governance approval or the audit trail.

**Why it matters**  
A senior IT leader who has just committed their first review and needs governance sign-off sees no governance option in the sidebar. The product looks incomplete.

**Recommended fix**  
Phase 1 (first finalized architecture package): show Governance workflow + Audit trail as visible links, or unlock them at phase 1. Keep Risk register, Policy packs, Risk exceptions at phase 2. Phase 0 → 1 transition is already gated by `hasCommittedArchitectureReview`.

**Fix type:** Behavior  
**Files:** `archlucid-ui/src/lib/nav-shell-visibility.ts`

---

### P1 findings

#### N03 · Review Work group — Evidence graph position (P1) · TB-518

**Current issue**  
"Evidence graph" (`/graph`) is the second nav item in Review Work — before "Review packages." Nav order: New review → Evidence graph → Review packages → Portfolio overview → Getting started.

**Why it matters**  
A first-time user reads the nav top-to-bottom. Seeing "Evidence graph" before "Review packages" implies the graph is a primary task, not a deep-dive tool. Users will click it first and find an empty state.

**Recommended fix**  
Reorder Review Work to: Overview → New review → Review packages → Portfolio overview → Getting started. Move Evidence graph to the Insights group (see N04).

**Fix type:** IA  
**Files:** `archlucid-ui/src/lib/pilot-nav-group-builder.ts`

---

#### N04 · Review Work group — Evidence graph in wrong group (P1) · TB-519

**Current issue**  
"Evidence graph" (`/graph`) appears in the "Review Work" group alongside workflow tasks (create, list, portfolio) but is an analytical deep-dive tool. It overlaps with the "Analysis" group which contains Ask, Search, and Compare.

**Why it matters**  
The boundary between "Review Work" (workflow tasks) and "Analysis" (exploratory tools) is broken. Users must discover they should look in two different groups for related analytical tasks.

**Recommended fix**  
Move Evidence graph from Review Work into the Analysis group. Rename the Analysis group label to "Insights" for clarity.

**Fix type:** IA  
**Files:** `archlucid-ui/src/lib/pilot-nav-group-builder.ts`, `archlucid-ui/src/lib/operate-analysis-nav-group-builder.ts`, `archlucid-ui/src/lib/i18n.ts`

---

#### N05 · Reports group — "First 30 days" misclassified (P1) · TB-520

**Current issue**  
"First 30 days (governance)" (`/governance/first-30-days`) is in the Reports nav group. Its tooltip says "minimal governance operating preset after evaluation." It is a governance setup guide, not a report.

**Why it matters**  
Enterprise IT leaders looking for a governance setup guide will look in Governance, not Reports. "After evaluation" reinforces pilot/pre-sales language.

**Recommended fix**  
Move to Governance group. Rename to "Governance setup guide." Remove "after evaluation" from its tooltip.

**Fix type:** Copy + IA  
**Files:** `archlucid-ui/src/lib/operate-reports-nav-group-builder.ts`, `archlucid-ui/src/lib/operate-governance-nav-group-builder.ts`  
**Adjacent TB:** TB-441 (same area, different issue — complement not conflict)

---

#### N06 · Review detail — missing forward CTA to governance (P1) · TB-521

**Current issue**  
When a review is ready for governance approval, there is no persistent forward-path CTA from the review detail page to `/governance`. `RunDetailGovernanceAlerts` shows when warnings exist, but there is no "Next: Submit for governance approval" button in the primary flow.

**Why it matters**  
The golden path is Reviews → Review detail → Governance. The step from review detail to governance is invisible. Users either stumble onto the Governance nav item or miss this step entirely.

**Recommended fix**  
When a review has a `manifestId` and no governance decision yet, render a "Submit for governance approval →" CTA card between the outcome cards and the deliverables section. Route to `/governance?runId={runId}`.

**Fix type:** IA  
**Files:** `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailPageView.tsx`

---

#### N07 · Administration — duplicate roles destinations (P1) · TB-522

**Current issue**  
Admin group has two overlapping nav items: "Users & roles" (`/settings/users`) and "Role management" (`/settings/roles`). A first-time admin cannot distinguish them from labels alone.

**Why it matters**  
An admin trying to invite a reviewer or change permissions sees two links with similar names and has to guess. Creates friction at a sensitive administration surface.

**Recommended fix**  
Consolidate to one nav item "Users & roles" pointing to a tabbed page (Users tab and Roles tab). Remove the duplicate nav entry.

**Fix type:** IA  
**Files:** `archlucid-ui/src/lib/operator/operator-admin-nav-group-builder.ts`

---

#### N08 · Executive summary — not in nav (P1) · TB-523

**Current issue**  
The executive summary (`/executive/reviews/[runId]`) is not in the left nav at all. It is reachable only from a CTA card on the review detail page. After navigating away, users have no return path.

**Why it matters**  
Executive summary is step 3 of the golden path and the primary output for sponsor handoff. Hiding it entirely from the nav makes the product feel like a dead-end after running a review.

**Recommended fix**  
Add "Executive summary" as a deep-link destination visible when a finalized architecture package is selected, or as a persistent tab on the review detail page with a stable anchor in the breadcrumb.

**Fix type:** IA

---

### P2 findings

#### N09 · Getting started — permanent essential nav item (P2) · TB-524

**Current issue**  
"Onboarding" (TB-434 renames to "Getting started") is tier `"essential"` and `defaultVisibleInCollapsedSidebar: true` — permanently shown in the top 5 nav items alongside New review, Review packages, and Portfolio overview.

**Why it matters**  
After a customer has completed setup and committed their first review, "Getting started" permanently occupies prime nav real estate. It signals the product is still being set up, not running.

**Recommended fix**  
Demote to tier `"extended"` after the first review is committed. Use the existing `hasCommittedArchitectureReview` gate.

**Fix type:** Behavior  
**Files:** `archlucid-ui/src/lib/pilot-nav-group-builder.ts`  
**Adjacent TB:** TB-434 renames the label — coordinate changes in the same PR.

---

#### N10 · Nav group label — "Analysis" vs "Insights" (P2) · TB-525

**Current issue**  
"Analysis" is the nav group label for `/ask`, `/search`, `/compare`, `/evolution-review`, `/advisory`. "Analysis" is a generic term that does not communicate what these tools do for a governance reviewer.

**Recommended fix**  
Rename the Analysis nav group to "Insights" with caption: "Explore evidence, findings, and decisions across reviews."

**Fix type:** Copy  
**Files:** `archlucid-ui/src/lib/i18n.ts`

---

#### N11 · Governance group — internal first-link repetition (P2) · TB-526

**Current issue**  
The "Governance" nav group's first link is labeled "Governance workflow." Group = Governance; first link = Governance workflow. The repetition makes it look like two levels of governance.

**Recommended fix**  
Rename the first link to "Approval queue" or "Approve findings." This clarifies what the page does without repeating the group name.

**Fix type:** Copy  
**Files:** `archlucid-ui/src/lib/operate-governance-nav-group-builder.ts`, `archlucid-ui/src/lib/i18n.ts`

---

#### N12 · Portfolio overview vs home page (P2) · TB-527

**Current issue**  
"Portfolio overview" in the nav goes to `/dashboard` (Executive ROI dashboard). The home page `/` also shows a "Workspace overview" heading after first review. Two dashboard-like destinations with overlapping names and purposes.

**Recommended fix**  
Rename the nav item "Portfolio overview" → "Executive dashboard" (matching its page purpose: ROI KPIs, savings trends, board pack). Rename the home page section "Workspace overview" → "Recent activity" to differentiate.

**Fix type:** Copy  
**Files:** `archlucid-ui/src/lib/pilot-nav-group-builder.ts`, `archlucid-ui/src/lib/i18n.ts`

---

#### N13 · Breadcrumbs — missing downstream of review detail (P2) · TB-528

**Current issue**  
The review detail breadcrumb shows only "Review packages · [review title]". There is no breadcrumb on the executive view or governance pages downstream.

**Why it matters**  
A user navigating the golden path (review detail → executive → governance → audit) loses location context after the first hop. Each downstream page has no breadcrumb back to the review.

**Recommended fix**  
Add breadcrumbs to:
1. `/executive/reviews/[runId]` — "Review packages · [title] · Executive summary"
2. `/governance` when `?runId` is present — "Reviews · [title] · Governance"
3. `/governance/audit` — "Governance · Audit trail"

**Fix type:** IA

---

#### N14 · "Architecture advisory" label (P2) · TB-529

**Current issue**  
"Architecture advisory" (`/advisory`) in the Analysis group sounds like a professional services offering, not an automated scan scheduling feature.

**Recommended fix**  
Rename to "Advisory scans" or "Scheduled scans."

**Fix type:** Copy  
**Files:** `archlucid-ui/src/lib/operate-analysis-nav-group-builder.ts`, `archlucid-ui/src/lib/i18n.ts`

---

#### N15 · "Integration readiness" label (P2) · TB-530

**Current issue**  
"Integration readiness" (`/integrations/readiness`) is the first Integrations item. The label sounds like a prerequisites checklist, not a connector health dashboard.

**Recommended fix**  
Rename to "Connection status" or "Connector health."

**Fix type:** Copy  
**Files:** `archlucid-ui/src/lib/operate-integrations-nav-group-builder.ts`, `archlucid-ui/src/lib/i18n.ts`

---

#### N16 · "Policy resolution" label (P2) · TB-531

**Current issue**  
"Policy resolution" (`/governance/resolution`) uses the internal technical term for conflict resolution between policy packs. Enterprise reviewers call these "standards" or "compliance rules."

**Recommended fix**  
Rename nav label to "Standards & rules."

**Fix type:** Copy  
**Files:** `archlucid-ui/src/lib/operate-governance-nav-group-builder.ts`, `archlucid-ui/src/lib/i18n.ts`

---

#### N17 · No governance progress nudge after first commit (P2) · TB-532

**Current issue**  
After the first review is committed, the "Review Work" nav group shows no prompt to progress to governance or audit. There is no affordance in the nav indicating that governance features exist and are now unlocked.

**Recommended fix**  
When `hasCommittedArchitectureReview` is `true` AND `operateNavUnlockPhase < 2`: show a "Governance available" call-to-action strip below the Review Work group (a progress nudge, not a nav item).

**Fix type:** Behavior  
**Files:** Operator shell sidebar component

---

### P3 findings

#### N18 · Recurrence schedules placement (P3) · TB-533

**Current issue**  
"Recurrence schedules" (`/governance/recurrence-schedules`) is in the Governance nav group. It is a scheduling configuration tool, not a governance decision workflow.

**Recommended fix**  
Move to Integrations group or Settings. If retained in Governance, add visible separation from the approval workflow items.

**Fix type:** IA  
**Files:** `archlucid-ui/src/lib/operate-governance-nav-group-builder.ts`

---

#### N19 · "Change simulation" label (P3) · TB-534

**Current issue**  
"Change simulation" (`/evolution-review`) in the Analysis group does not communicate governance context.

**Recommended fix**  
Rename to "Impact preview" with title "Preview expected impact of proposed architecture changes on governance posture."

**Fix type:** Copy  
**Files:** `archlucid-ui/src/lib/operate-analysis-nav-group-builder.ts`, `archlucid-ui/src/lib/i18n.ts`

---

## Section 2. Recommended primary navigation model

One group per conceptual domain. Progressive disclosure preserved — advanced tiers still collapse behind "Show more."

| Group | Always/gated | Contents |
|-------|-------------|----------|
| **Reviews** | Always visible | Overview (`/`) · New review · Review packages |
| **Insights** | After first finalized architecture package | Executive dashboard · Evidence graph · Ask · Compare · [advanced] Search · [advanced] Impact preview · [advanced] Advisory scans |
| **Governance** | Unlocked at phase 1 (first commit) | Approval queue · Risk register · Decision register · Audit trail · [extended] Risk exceptions · [extended] Standards · [extended] Standards & rules · [extended] Governance setup guide · [extended] Alerts |
| **Reports** | After first finalized architecture package | Scorecard · Value report |
| **Integrations** | When configured | Connection status · Cloud connections · Jira · ServiceNow · Microsoft Teams · Slack · Webhooks |
| **Administration** | Admin rank | Workspace settings · Users & roles (consolidated) · Billing & plans · [extended] AI usage · [extended] Security & Trust · [extended] Support |

---

## Section 3. Recommended golden-path links and CTAs

| Step | Destination | Nav location | Forward CTA | Gap status |
|------|-------------|-------------|-------------|------------|
| 1 | Overview `/` | Reviews group | "Start architecture review" | **Missing nav item (N01/TB-516)** |
| 2 | New review `/reviews/new` | Reviews group | "Start architecture review" | CTA label inconsistency (TB-437) |
| 3 | Review packages `/reviews` | Reviews group | "Open review →" | Subtitle implies finalized only (TB-449) |
| 4 | Review detail `/reviews/[runId]` | via Reviews list | "Open executive summary" | **Governance CTA missing when ready (N06/TB-521)** |
| 5 | Executive summary `/executive/reviews/[runId]` | **NOT IN NAV** | "View signed record →" | **No nav entry; no return breadcrumb (N08/TB-523, N13/TB-528)** |
| 6 | Signed review record `#manifest-summary` | Section on review detail | "Submit for governance approval →" | Not a route; CTA missing (N06/TB-521) |
| 7 | Evidence graph `/graph?runId=…` | Review Work — wrong position (N03/TB-518) | "View governance record →" | Position wrong; no forward CTA |
| 8 | Governance approval `/governance` | **Hidden until phase 2 (N02/TB-517)** | "View audit trail →" | **Governance group locked (N02/TB-517)** |
| 9 | Audit trail `/governance/audit` | **Hidden until phase 2 (N02/TB-517)** | "Download governance evidence" | **Audit hidden; no breadcrumb from governance (N13/TB-528)** |

---

## Section 4. Routes and labels to rename

| Type | Current | Recommended |
|------|---------|-------------|
| Nav item | "Onboarding" (pilot nav) | "Getting started" (per TB-434; demote to extended after first commit) |
| Nav group | "Analysis" | "Insights" |
| Nav item | "Governance workflow" (first link in Governance group) | "Approval queue" |
| Nav item | "Portfolio overview" (nav link label) | "Executive dashboard" |
| Nav item | "Integration readiness" | "Connection status" |
| Nav item | "Architecture advisory" | "Advisory scans" |
| Nav item | "Policy resolution" | "Standards & rules" |
| Nav item | "Change simulation" | "Impact preview" |
| Nav item | "First 30 days (governance)" | "Governance setup guide" (+ move to Governance group) |
| Page title | "Governance workflow" (`/governance`) | "Approval queue" |
| Page title | "Portfolio overview" (`/dashboard`) | "Executive dashboard" |
| Section heading | "Workspace overview" (home, post-commit) | "Recent activity" |

---

## Section 5. Routes and pages to hide, demote, or consolidate

| Action | Target | Recommendation |
|--------|--------|----------------|
| Consolidate | `/settings/users` + `/settings/roles` | Single "Users & roles" page with tabs; remove duplicate nav entry |
| Move | `/governance/first-30-days` out of Reports | Move to Governance group as "Governance setup guide" |
| Move | Evidence graph out of Review Work | Move to Insights/Analysis group |
| Demote | "Getting started" nav item after first commit | Change tier from `essential` → `extended` when `hasCommittedArchitectureReview = true` |
| Move | "Recurrence schedules" out of Governance | Move to Integrations or Settings |
| Unlock | Governance + Audit trail when `operateNavUnlockPhase < 2` | Show at phase 1 (after first commit); keep Risk exceptions/Policy packs at phase 2 |

---

## Section 6. P0/P1 fix priority order

1. **N01/TB-516** — Add Overview (`/`) to nav. No user has a return path from any other page.
2. **N02/TB-517** — Unlock Governance and Audit trail at phase 1. Committed-review users are currently stranded.
3. **N03/TB-518 + N04/TB-519** — Reorder Review Work; move Evidence graph to Insights group.
4. **N06/TB-521** — Add forward CTA from review detail to governance when review is ready for approval.
5. **N07/TB-522** — Consolidate "Users & roles" and "Role management" into one nav item.
6. **N08/TB-523** — Add breadcrumb and nav entry for executive summary.

---

## Section 7. Cursor-ready patch instructions

### N01/TB-516 — Add Overview to nav

**File:** `archlucid-ui/src/lib/pilot-nav-group-builder.ts`

Add as the **first** link in the `build()` links array:

```typescript
{
  href: "/",
  label: OPERATOR_NAV_LINK_LABELS.home,
  title: "Workspace overview",
  icon: Home, // add to lucide-react imports at top of file
  tier: "essential",
  defaultVisibleInCollapsedSidebar: true,
},
```

`OPERATOR_NAV_LINK_LABELS.home` already resolves to `"Overview"` in `i18n.ts` — no new string needed.

---

### N02/TB-517 — Unlock Governance at phase 1

**File:** `archlucid-ui/src/lib/nav-shell-visibility.ts`

In `listNavGroupsVisibleInOperatorShell`, change the governance group phase gate to a per-link gate: keep the group visible at phase 1, but filter individual links so only Governance workflow (`/governance`) and Audit trail (`/governance/audit`) appear at phase 1. All other governance links require phase 2.

Alternatively, split the single governance group into `operate-governance-core` (workflow + audit) and `operate-governance-extended` (risk register, policy packs, etc.) and apply different phase thresholds.

---

### N03/TB-518 + N04/TB-519 — Reorder Review Work; move Evidence graph

**File:** `archlucid-ui/src/lib/pilot-nav-group-builder.ts`

Reorder links to: Overview → New review → Review packages → Portfolio overview → Getting started. Remove the Evidence graph link from this file.

**File:** `archlucid-ui/src/lib/operate-analysis-nav-group-builder.ts`

Add Evidence graph as the **first** link in the `build()` links array (before `/ask`):

```typescript
{
  href: "/graph",
  label: OPERATOR_NAV_LINK_LABELS.evidenceTrail,
  title: this.shortcutTitle("Trace evidence, findings, and decisions", "alt+y"),
  keyShortcut: "alt+y",
  icon: GitGraph, // add to imports
  tier: "essential",
  defaultVisibleInCollapsedSidebar: true,
},
```

**File:** `archlucid-ui/src/lib/i18n.ts`

```typescript
// Change:
analysis: "Analysis",
// To:
analysis: "Insights",
```

---

### N06/TB-521 — Add forward CTA from review detail to governance

**File:** `archlucid-ui/src/app/(operator)/reviews/[runId]/_sections/RunDetailPageView.tsx`

After the outcome cards section, add a new small component `RunDetailGovernanceCta` that renders conditionally:

```typescript
// Render when: manifestId is set AND no governance decision AND !buyerPolishedShell
<RunDetailGovernanceCta runId={runId} manifestId={manifestId} />
```

The CTA should link to `/governance?runId={runId}` with label "Submit for governance approval →".

---

### N07/TB-522 — Consolidate Users & roles and Role management

**File:** `archlucid-ui/src/lib/operator/operator-admin-nav-group-builder.ts`

Remove the `href: "/settings/roles"` link from the `build()` links array. Keep `href: "/settings/users"` with label `"Users & roles"`.

Update `/settings/roles` to redirect to `/settings/users?tab=roles` so existing bookmarks and deep links continue to work.

---

### N09/TB-524 — Demote Getting started after first commit

**File:** `archlucid-ui/src/lib/pilot-nav-group-builder.ts`

Pass `hasCommittedArchitectureReview` as a constructor parameter and use it to set `tier: hasCommittedArchitectureReview ? "extended" : "essential"` on the onboarding link, or add a post-build filter in `listNavGroupsVisibleInOperatorShell`. Coordinate with TB-434 (label rename) to avoid two passes over the same file.
