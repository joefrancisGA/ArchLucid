# Visual consistency and product polish audit

**Date:** 2026-06-29  
**Scope:** Typography · Spacing · Card design · Badges/severity · Empty/loading/error states · CTA hierarchy · Shell consistency  
**Golden path audited:** Home → Reviews list → Review detail → Sponsor view → Evidence graph → Governance → Audit  
**Constraint:** No new features. Prefer token-level and copy fixes over rewrites.  
**Backlog cross-reference:** TB-535–TB-544

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| P0 | 0 | — |
| P1 | 4 | Severity badge overlap, graph loading state copy, CTA jargon, unknown severity label |
| P2 | 6 | Deprecated token aliases, KPI tile typography, toast duplication, planning table import, card padding inconsistency, disclosure component mismatch |
| **Total** | **10** | |

**Key pattern:** The design token system (`design-tokens.ts`) is well-structured with canonical typography, spacing, card, table, badge, and severity tokens. The primary issues are local bypasses of those tokens — ad hoc Tailwind overrides that produce near-identical results visually but will drift when tokens change — plus a few copy-level issues where loading/fallback states or severity labels undermine trust.

---

## Section 1. Overall visual-polish diagnosis

The ArchLucid architect workspace has a coherent enterprise design language: IBM Carbon-inspired typography scale (`OPERATOR_TYPE_SCALE`), a systematic status badge system (`EnterpriseStatusKind`, `FindingSeverityKind`), token-driven card chrome (`OPERATOR_CARD`), and table tokens (`DESIGN_TOKENS.table`). The buyer-polished shell surfaces are visibly more polished than the full architect workspace.

**Main consistency gaps:**

1. The severity scale has a collision: `warning`/`medium` produces an amber badge with a white background and direct Tailwind classes while `error`/`high` uses the semantic amber token — visually near-identical but maintaining via different paths.
2. The `GraphStaticFallback` loading state uses "Sample evidence trail" copy — mixing demo/sample language into what fires as a production graph-loading skeleton.
3. Three deprecated aliases remain in `OPERATOR_TYPOGRAPHY` (`title`, `section`, `meta`) with active consumers.
4. The governance page inline toast constructs its styles by concatenating both inline utility classes and the semantic callout token, creating redundant class declarations.
5. `FirstWeekRouteGuidance` on the home variant uses a native `<details>`/`<summary>` while all peer expandable sections use `OperatorHomeDisclosureSection` — creates a visual and behavioral mismatch.

---

## Section 2. Top consistency issues

### V01 · Severity badge visual overlap — `warning`/`medium` bypasses semantic token (P1) · TB-535

**Current issue**  
`severityTagClass("warning")` and `severityTagClass("medium")` render `border-amber-600/40 bg-al-surface-raised text-al-text-primary` directly in Tailwind. `severityTagClass("error")` and `severityTagClass("high")` render `bg-[var(--al-status-warn-bg)] text-[var(--al-status-warn-fg)]` — the semantic token.

The visual output is nearly identical amber — but warning/medium uses a white (raised) background while error/high uses the token tint. Enterprise reviewers see "Warning" and "Error" side by side with almost identical color treatment; the severity gradient collapses.

**Recommended fix**  
For `warning`/`medium`: use `bg-al-surface-raised border-amber-500/50 text-amber-800` to create a visible 1-step lighter treatment than `error`/`high` — or introduce a new CSS variable `--al-status-warn-secondary-bg/fg` for this tier.

**Files:** `archlucid-ui/src/lib/design-tokens.ts`

---

### V02 · `GraphStaticFallback` — "Sample evidence trail" copy in production loading state (P1) · TB-536

**Current issue**  
`GraphStaticFallback` renders: `"Sample evidence trail — the interactive graph appears here when the viewer finishes loading."` This component fires during normal React Flow initialization in production, not only in demo/screenshot paths.

**Why it matters**  
An enterprise architect waiting for their real graph to load sees "Sample evidence trail." They may assume the graph is showing demo data, not their architecture.

**Recommended fix**  
Change body copy to: `"Evidence trail — loading interactive graph…"` Remove "Sample" entirely. The `aria-label` should also drop "Sample": → `"Evidence trail: context, finding, decisions, and signed architecture package."`

**Files:** `archlucid-ui/src/components/GraphStaticFallback.tsx`

---

### V03 · `FindingInspectFindingBody` — CTA label uses pipeline jargon (P1) · TB-537

**Current issue**  
For non-demo runs: `reviewContextLabel = "Open review detail (artifacts & graph)"`.

**Why it matters**  
"artifacts & graph" is pipeline vocabulary in a buyer/operator-visible call-to-action on the finding inspect view. A governance reviewer or external auditor reading findings should see `"Open review summary"` not `"(artifacts & graph)"`.

**Recommended fix**  
Change to `"Open review summary"` unconditionally. The demo variant already uses the better `"Open cited evidence"` — unify to a single product-facing label.

**Files:** `archlucid-ui/src/app/(operator)/reviews/[runId]/findings/[findingId]/FindingInspectFindingBody.tsx`

---

### V04 · Unknown severity badge — visually identical to neutral (P1) · TB-544

**Current issue**  
`severityTagClass("unknown")` returns `border-neutral-300 bg-al-surface-raised text-al-text-secondary` — the same visual treatment as `enterpriseStatusTagClass("neutral")`. Buyers and reviewers see "Unknown" severity in findings tables with no visual distinction from a missing-data state.

**Recommended fix**  
Use a distinct treatment: `border-neutral-400/70 bg-neutral-100 text-neutral-600` or a dashed border to signal "data gap" visually. Change the label from "Unknown" to "Unclassified" (less alarming, more accurate).

**Files:** `archlucid-ui/src/lib/design-tokens.ts`

---

## Section 3. Component/system-level fixes

### V05 · Remove deprecated `OPERATOR_TYPOGRAPHY` aliases (P2) · TB-538

**Current issue**  
Lines 133–138 of `design-tokens.ts` declare:
- `title: "text-xl font-semibold…"` (deprecated alias for `pageTitle`)
- `section: "text-lg font-semibold…"` (deprecated alias for `sectionTitle`)
- `meta: "text-xs font-normal…"` (deprecated alias for `helper`)

Consumers importing `OPERATOR_TYPOGRAPHY.meta` or `.title` receive the correct class but bypass TypeScript enforcement of the canonical name, and will silently diverge if the canonical token changes.

**Recommended fix**  
Run a codebase grep for `OPERATOR_TYPOGRAPHY.title`, `.section`, and `.meta` consumers. Migrate each to the canonical name. Then remove the deprecated entries (or mark `@deprecated` with TypeScript `@ts-deprecated` decorator to force compile warnings).

**Files:** `archlucid-ui/src/lib/design-tokens.ts` + all consumers

---

### V06 · `OperatorCorePilotDiagnosticsChecklist` KPI tiles — ad hoc `text-lg font-bold` bypasses metric scale (P2) · TB-539

**Current issue**  
Metric `<dd>` elements render `text-lg font-bold text-neutral-900` inline. The token system provides `OPERATOR_TYPOGRAPHY.kpiValue` (`font-mono text-4xl font-semibold tabular-nums`) and `OPERATOR_TYPOGRAPHY.executiveDashboardMetric` (`text-2xl font-semibold tabular-nums`) for tile metrics.

The inline size (`text-lg`) is smaller and uses `font-bold` instead of `font-semibold` — visually distinct from all other metric tiles in the product.

**Recommended fix**  
Use `OPERATOR_TYPOGRAPHY.executiveDashboardMetric` for the metric `<dd>` elements. Adjust tile size to accommodate the larger type if needed.

**Files:** `archlucid-ui/src/components/operator/OperatorCorePilotDiagnosticsChecklist.tsx`

---

### V07 · Governance page inline toast — double style concatenation (P2) · TB-540

**Current issue**  
The governance page toast renders:
```tsx
"rounded-lg px-4 py-3 shadow-lg"  // inline base
+ OPERATOR_TYPOGRAPHY.body
+ (toast.kind === "ok" 
  ? "rounded-md border border-emerald-700/40 bg-al-surface-raised px-3 py-2 ... border"
  : "rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 ... border")
```

This produces: duplicate `rounded-*` and `px-*/py-*` classes (e.g., `px-4` from the base and `px-3` from the callout token), and a trailing bare `border` class after the full border declaration.

**Recommended fix**  
Drop the inline base string. Use `DESIGN_TOKENS.callout.success` / `DESIGN_TOKENS.callout.blocked` plus `fixed bottom-6 right-6 z-50 max-w-sm shadow-lg` as a toast position wrapper only.

**Files:** `archlucid-ui/src/app/(operator)/governance/_sections/GovernanceWorkflowPageContent.tsx`

---

### V08 · `OperatorCorePilotDiagnosticsChecklist` metric tiles — ad hoc `px-2 py-2` instead of `OPERATOR_CARD.nested` (P2) · TB-542

**Current issue**  
Metric tile `<div>` elements use inline `px-2 py-2` padding. The token system provides `OPERATOR_CARD.nested = "p-3"` for exactly this use case: "Nested raised surface inside a card (metrics, run rows, empty states)."

**Recommended fix**  
Replace `px-2 py-2` with `OPERATOR_CARD.nested`.

**Files:** `archlucid-ui/src/components/operator/OperatorCorePilotDiagnosticsChecklist.tsx`

---

### V09 · `FirstWeekRouteGuidance` home variant — native `<details>/<summary>` instead of `OperatorHomeDisclosureSection` (P2) · TB-543

**Current issue**  
The `"home"` variant of `FirstWeekRouteGuidance` renders a native `<details>/<summary>` element. All peer expandable guidance sections on the operator home page use `OperatorHomeDisclosureSection` which provides consistent header styling, expand/collapse animation, and storage-backed open state.

**Why it matters**  
A user scanning the home page sees one collapsible section that looks and behaves differently from all others. Native `<details>` has no animation, different focus ring treatment, and different typography baseline.

**Recommended fix**  
Replace the `<details>/<summary>` wrapper with `OperatorHomeDisclosureSection` using an appropriate `storageKey`. Pass `FIRST_WEEK_ROUTE_GUIDANCE_HOME_SUMMARY` as the `title`.

**Files:** `archlucid-ui/src/components/FirstWeekRouteGuidance.tsx`

---

### V10 · `planning-table-styles.ts` — `cn()` called without visible import (P2) · TB-541

**Current issue**  
Line 2: `export const planningTableCls = (cn("mt-2 w-full border-collapse", OPERATOR_TYPOGRAPHY.body));`

`cn` is used without an import statement visible in the file. Either the import is missing (lint error) or the file relies on a side-effect barrel import that is not explicit.

**Recommended fix**  
Add `import { cn } from "@/lib/utils";` explicitly to the file header.

**Files:** `archlucid-ui/src/components/planning/planning-table-styles.ts`

---

## Section 4. Page-specific findings

| Route | Visual issue | Severity | TB |
|-------|-------------|----------|-----|
| Evidence graph `/graph` | `GraphStaticFallback` loading skeleton says "Sample evidence trail" | P1 | TB-536 |
| Finding inspect `/reviews/[runId]/findings/[findingId]` | CTA "Open review detail (artifacts & graph)" | P1 | TB-537 |
| Governance `/governance` | Inline toast style concatenation | P2 | TB-540 |
| Home `/` (operator) | `FirstWeekRouteGuidance` uses native `<details>` | P2 | TB-543 |
| Home `/` (operator) | `OperatorCorePilotDiagnosticsChecklist` KPI tiles wrong metric scale | P2 | TB-539 |
| Any finding list | "Unknown" severity badge indistinguishable from neutral | P1 | TB-544 |

---

## Section 5. P1 visual credibility issues

1. **TB-535** — Severity badge overlap: `warning` and `error` look nearly identical.
2. **TB-536** — "Sample evidence trail" in production loading skeleton.
3. **TB-537** — Pipeline vocabulary ("artifacts & graph") in buyer-visible CTA.
4. **TB-544** — "Unknown" severity badge indistinguishable from null/empty state.

---

## Section 6. P1 polish improvements

| Finding | Fix | TB |
|---------|-----|-----|
| Severity badge `warning`/`medium` bypasses semantic token | Align to token or introduce a lighter-tier amber treatment | TB-535 |
| Graph loading state: "Sample evidence trail" | Change to "Evidence trail — loading" | TB-536 |
| Finding CTA: "Open review detail (artifacts & graph)" | Change to "Open review summary" | TB-537 |

---

## Section 7. Cursor-ready patch instructions

### TB-536 — Fix GraphStaticFallback copy

**File:** `archlucid-ui/src/components/GraphStaticFallback.tsx`

```tsx
// Change:
aria-label="Sample evidence trail preview: context, primary finding, decisions, and finalized signed package"
// To:
aria-label="Evidence trail: context, primary finding, decisions, and finalized signed package"

// Change body copy:
"Sample evidence trail — the interactive graph appears here when the viewer finishes loading."
// To:
"Evidence trail — the interactive graph appears once the viewer has loaded."
```

---

### TB-537 — Fix FindingInspectFindingBody CTA label

**File:** `archlucid-ui/src/app/(operator)/reviews/[runId]/findings/[findingId]/FindingInspectFindingBody.tsx`

```tsx
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

### TB-541 — Fix planning-table-styles.ts missing import

**File:** `archlucid-ui/src/components/planning/planning-table-styles.ts`

Add at top of file:
```typescript
import { cn } from "@/lib/utils";
```

---

### TB-543 — Fix FirstWeekRouteGuidance home variant

**File:** `archlucid-ui/src/components/FirstWeekRouteGuidance.tsx`

Replace the `"home"` variant `<details>`/`<summary>` block with `OperatorHomeDisclosureSection`:

```tsx
import { OperatorHomeDisclosureSection } from "@/components/operator-home/OperatorHomeDisclosureSection";
import { OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS } from "@/lib/operator/operator-home-disclosure-storage";

// In the "home" variant branch:
return (
  <OperatorHomeDisclosureSection
    title={FIRST_WEEK_ROUTE_GUIDANCE_HOME_SUMMARY}
    titleId={`first-week-guidance-home`}
    sectionTestId={`first-week-route-guidance-home`}
    storageKey={OPERATOR_HOME_DISCLOSURE_STORAGE_KEYS.firstWeekGuidance}
    defaultExpanded={false}
  >
    <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{config.useWhen}</p>
    <GuidanceBody ... />
  </OperatorHomeDisclosureSection>
);
```
