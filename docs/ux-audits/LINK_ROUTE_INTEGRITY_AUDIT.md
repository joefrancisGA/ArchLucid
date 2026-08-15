# Link integrity, route integrity, and dead-end audit

**Date:** 2026-06-29  
**Scope:** Home CTAs · Review list links · Review detail · Sponsor summary · Governance → Audit · Empty states · Error recovery · Breadcrumbs · Back links  
**Golden path:** Home → Reviews list → Review detail → Sponsor view → Manifest summary → Evidence graph → Governance → Audit  
**Constraint:** No new features. Fix routing logic and copy. No architectural changes.  
**Backlog cross-reference:** TB-553–TB-559

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| P0 | 0 | — |
| P1 | 3 | Inconsistent finding-to-review CTA, governance empty state has no audit link, error boundary silently redirects to demo data |
| P2 | 4 | Marketing route in operator error state, unverified in-page anchor, environment field confusion, demo version pre-fill |
| **Total** | **7** | |

**Key pattern:** The golden path has no structural broken routes, but three specific junctions produce either misleading destinations or silent dead-ends: (1) finding-to-review CTA uses different labels in demo vs. live creating inconsistency, (2) the governance page empty state has no forward link to the audit trail, and (3) the review-detail error boundary silently links to hardcoded demo data without disclosure.

---

## Section 1. Route/link integrity diagnosis

The golden path (Home → Reviews → Review detail → Sponsor → Evidence graph → Governance → Audit) is structurally intact — all routes exist and are reachable. However, three junction points have integrity issues:

1. **Finding inspect → review context**: The CTA label differs between demo and live environments, producing an inconsistent user experience with no semantic justification.
2. **Governance → audit trail**: In the full architect workspace with no loaded review, the governance page shows an empty state with no link to the audit trail. Users who arrive at governance first (e.g., from the nav) have no obvious next step.
3. **Review detail error recovery**: In static-demo or buyer-polished mode, the error boundary links to a hardcoded demo manifest ID without any "this is sample data" disclosure.

---

## Section 2. Broken or suspicious links/routes

### R01 · `FindingInspectFindingBody` — inconsistent `reviewContextLabel` across demo and live (P1) · TB-553

**Component:** `archlucid-ui/src/app/(operator)/reviews/[runId]/findings/[findingId]/FindingInspectFindingBody.tsx`

**Current issue**  
```typescript
const reviewContextLabel =
  surface === "sponsor"
    ? "Open risk review"
    : isDemoRunIdEligibleForStaticFallback(runId)
      ? "Open cited evidence"      // demo path
      : "Open review detail (artifacts & graph)";  // live path
```

Two different labels for the same navigation action depending on runtime mode:
- Demo: `"Open cited evidence"` (clear, buyer-safe)
- Live: `"Open review detail (artifacts & graph)"` (internal jargon)

A user switching between a demo run and their own real run will see different CTA text for the same action.

**Recommended fix**  
Unify to `"Open review summary"` unconditionally. The `surface === "sponsor"` variant can remain `"Open risk review"` if there is semantic justification.

---

### R02 · Governance empty state — no forward link to audit trail (P1) · TB-554

**Component:** `archlucid-ui/src/app/(operator)/governance/_sections/GovernanceWorkflowPageContent.tsx`

**Current issue**  
When `activeRunId === null` (no review loaded), the governance page renders `GOVERNANCE_WORKFLOW_IDLE` or `GOVERNANCE_WORKFLOW_IDLE_READER` empty state. These empty states do not include a link to the audit trail (`/governance/audit`).

A user who arrives at governance from the nav (not from a review detail page CTA) has no forward path to the audit trail if they are in read-only mode or have not yet loaded a review.

**Why it matters**  
The governance → audit trail link is step 8 → 9 of the golden path. Breaking this step means the audit trail is unreachable for read-only reviewers who do not know to look in the nav.

**Recommended fix**  
Add a secondary CTA to both `GOVERNANCE_WORKFLOW_IDLE` and `GOVERNANCE_WORKFLOW_IDLE_READER` presets:

```typescript
secondaryCta: {
  label: "View audit trail →",
  href: "/governance/audit",
}
```

Gate this CTA on `operateNavUnlockPhase >= 1` (audit trail should be visible once governance is unlocked per TB-517).

**Files:** `archlucid-ui/src/lib/empty-state-presets.ts`

---

### R03 · Review detail error boundary silently redirects to demo data (P1) · TB-555

**Component:** `archlucid-ui/src/app/(operator)/reviews/[runId]/error.tsx`

**Current issue**  
In static-demo or buyer-polished mode, when the review detail page errors:

```tsx
<Link href={`/signed-records/${encodeURIComponent(SHOWCASE_STATIC_DEMO_MANIFEST_ID)}`}>
  Open sample architecture package
</Link>
```

The `SHOWCASE_STATIC_DEMO_MANIFEST_ID` is a hardcoded internal demo record. The CTA says "Open sample architecture package" — the word "sample" is a disclosure that this is not the user's real data. However, a buyer-polished-shell user who reaches this error state while trying to open their own review will be silently redirected to a static demo record.

**Why it matters**  
A real operator error on `/reviews/[runId]` — perhaps a network timeout — redirects the user to demo data without explaining that their data is still available. This is a trust issue (TB-555).

**Recommended fix**  
Add an explicit `"(This is sample data — your reviews are at Reviews list)"` disclaimer below the CTA, or change the CTA to: `"View sample walkthrough (demo data)"` with a separate `"Back to your reviews"` primary CTA.

---

## Section 3. Dead-end pages

### R04 · Error boundary "Read-only walkthrough" link goes to marketing route `/demo/preview` (P2) · TB-556

**Component:** `archlucid-ui/src/app/(operator)/reviews/[runId]/error.tsx`

**Current issue**  
In buyer-polished mode:
```tsx
<Link href="/demo/preview">{isBuyerPolished ? "Read-only walkthrough" : "View sample walkthrough"}</Link>
```

`/demo/preview` is a marketing-surface route under `(marketing)`. Rendering it as a recovery CTA inside the architect workspace creates a context switch: the user goes from a governance/review workflow to a marketing demo page.

**Recommended fix**  
Replace with `/showcase/[SHOWCASE_STATIC_DEMO_RUN_ID]` (the operator-appropriate showcase route) or a help article. Rename CTA to `"View sample review"`.

---

### R05 · `OperatorCorePilotDiagnosticsChecklist` — `#first-run-workflow-panel` anchor may not resolve (P2) · TB-557

**Component:** `archlucid-ui/src/components/operator/OperatorCorePilotDiagnosticsChecklist.tsx`

**Current issue**  
Line 201:
```tsx
<Link href="#first-run-workflow-panel">Jump to first review checklist</Link>
```

This anchor link requires `id="first-run-workflow-panel"` to exist in the DOM. If the target section (`UnifiedFirstPilotProgressPanel` or equivalent) is not rendered on the current home page variant, clicking "Jump to first review checklist" silently does nothing (no scroll, no navigation).

**Recommended fix**  
Verify that the target element with `id="first-run-workflow-panel"` always renders when this component renders. Add a data-testid check in the existing test suite. If the target is conditionally rendered, replace the anchor with a direct route link.

---

### R06 · Governance submit form — confusing "Source environment" / "Target environment" fields (P2) · TB-558

**Component:** `archlucid-ui/src/app/(operator)/governance/_sections/GovernanceWorkflowPageContent.tsx`

**Current issue**  
The approval submit section exposes two freetext fields: "Source environment" and "Target environment" pre-filled with "dev" and "test" (covered in TB-547). Beyond the default values, the fields themselves are unlabeled in terms of what they mean for an architecture review governance workflow (as opposed to a software deployment pipeline).

**Why it matters**  
An operator submitting their first governance approval request does not know whether to put "review" and "production", "architecture-board" and "approved", or "dev" and "test". The fields have no help text or validation.

**Recommended fix**  
Add a help tooltip or inline label clarification: `"Source and target are the review states used in your governance workflow (e.g., 'draft' → 'approved')."` Or remove the fields and default to `"source"` → `"approved"` as the standard architecture review path with an optional override via Advanced options.

---

### R07 · Demo version string pre-fill in governance submit form (P2) · TB-559

See Leakage audit TB-551. Dual-tracked here as a link/form integrity issue.

---

## Section 4. Missing CTAs

| Page / State | Missing CTA | Where to add |
|-------------|-------------|-------------|
| Governance empty state (`GOVERNANCE_WORKFLOW_IDLE`) | "View audit trail →" → `/governance/audit` | `archlucid-ui/src/lib/empty-state-presets.ts` |
| Governance empty state reader (`GOVERNANCE_WORKFLOW_IDLE_READER`) | "View audit trail →" → `/governance/audit` | `archlucid-ui/src/lib/empty-state-presets.ts` |
| Review detail error boundary (buyer mode) | "Back to your reviews" primary CTA | `/reviews/[runId]/error.tsx` |

---

## Section 5. Golden-path fixes

| Step | Gap | Fix | TB |
|------|-----|-----|-----|
| Finding → Review | Inconsistent CTA label (demo vs live) | Unify to "Open review summary" | TB-553 |
| Governance → Audit | No audit trail link in governance empty state | Add secondary CTA to empty state presets | TB-554 |
| Review error → Recovery | Silent redirect to demo data without disclosure | Add "sample data" disclosure to CTA | TB-555 |

---

## Section 6. P0 route blockers

None. All golden-path routes are structurally intact.

---

## Section 7. P1 workflow polish

1. **TB-553** — Unify finding-to-review CTA label.
2. **TB-554** — Add audit trail link to governance empty states.
3. **TB-555** — Disclose sample data in error boundary recovery CTA.

---

## Section 8. Cursor-ready patch instructions

### TB-553 — Unify FindingInspectFindingBody CTA

**File:** `archlucid-ui/src/app/(operator)/reviews/[runId]/findings/[findingId]/FindingInspectFindingBody.tsx`

```typescript
// Change:
const reviewContextLabel =
  surface === "sponsor"
    ? "Open risk review"
    : isDemoRunIdEligibleForStaticFallback(runId)
      ? "Open cited evidence"
      : "Open review detail (artifacts & graph)";
// To:
const reviewContextLabel =
  surface === "sponsor" ? "Open risk review" : "Open review summary";
```

---

### TB-554 — Add audit trail CTA to governance empty states

**File:** `archlucid-ui/src/lib/empty-state-presets.ts`

Locate `GOVERNANCE_WORKFLOW_IDLE` and `GOVERNANCE_WORKFLOW_IDLE_READER`. Add a secondary CTA property (or action link array) to each:

```typescript
export const GOVERNANCE_WORKFLOW_IDLE = {
  // ... existing properties
  secondaryAction: {
    label: "View audit trail →",
    href: "/governance/audit",
  },
} as const satisfies EmptyStatePreset;
```

Update `EmptyState` component to render the `secondaryAction` when present.

---

### TB-555 — Disclose demo data in review error boundary

**File:** `archlucid-ui/src/app/(operator)/reviews/[runId]/error.tsx`

```tsx
// In the static/buyer mode branch, add a disclaimer below the CTA group:
<p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
  The sample above uses demo data. Your reviews remain available at{" "}
  <Link href="/reviews?projectId=default" className={OPERATOR_LINK.nav}>
    Reviews list
  </Link>.
</p>
```

---

### TB-556 — Fix error boundary "Read-only walkthrough" route

**File:** `archlucid-ui/src/app/(operator)/reviews/[runId]/error.tsx`

```tsx
// Change:
<Link href="/demo/preview">{isBuyerPolished ? "Read-only walkthrough" : "View sample walkthrough"}</Link>
// To:
<Link href={`/showcase/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`}>
  View sample review
</Link>
```
