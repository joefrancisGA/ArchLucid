# Internal operations and admin leakage audit

**Date:** 2026-06-29  
**Scope:** Debug panels · Admin monitoring surfaces · Implementation vocabulary in user-facing UI · Demo/static fallback labels · DevOps terminology  
**Constraint:** No new features. Hide or rename; don't add new surfaces.  
**Backlog cross-reference:** TB-545–TB-552

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| P0 | 2 | Debug toggle + internal telemetry panel visible to all operators |
| P1 | 4 | DevOps env defaults, deployment toast, trace IDs, pipeline CTA |
| P2 | 2 | Demo version string in submit form, "approval quickstart" exposes scaffolding |
| **Total** | **8** | |

**Key pattern:** Two distinct leakage categories: (1) DevOps/infrastructure monitoring concepts surfaced in product UX (`FindingInspectContextDebugPanel`, `OperatorCorePilotDiagnosticsChecklist`), and (2) deployment pipeline vocabulary bleeding into governance and finding UIs (`promoteManifest`, "dev"/"test" env defaults, "artifacts & graph" CTA). The first category is a trust risk; the second is a copy/vocabulary issue.

**Existing protection:** `demo-leak-scan.test.tsx` guards against fixture IDs, hash placeholders, and specific forbidden tokens — but does not cover the debug toggle label or the diagnostics section copy.

---

## Section 1. Internal-leakage diagnosis

### L01 · `FindingInspectContextDebugPanel` — "Debug: View Raw Context" toggle (P0) · TB-545

**Component:** `archlucid-ui/src/components/findings/FindingInspectContextDebugPanel.tsx`  
**Visible on:** `/reviews/[runId]/findings/[findingId]` (all operators)

**Current issue**  
The toggle label is literally `"Debug: View Raw Context"`. The description explains: `"Shows cited evidence excerpts, provenance context steps, and the redacted LLM user prompt the model saw."`

An enterprise buyer, CTO, or external auditor opening a finding will see a "Debug" toggle and read about "LLM user prompts." This:
- Signals an immature, engineering-facing product to governance reviewers.
- Confirms LLM is used to generate findings — before the buyer has had a chance to understand the product's AI trust model.
- The word "Debug" in a buyer/operator-facing UI is an unconditional trust penalty.

**Should be:**  
Either (a) renamed to "Evidence trace detail" and gated to `AdminAuthority` rank, or (b) converted to a product-polished "Traceability detail" disclosure available to all operators but with buyer-appropriate copy.

**Recommended fix**  
- Rename label: `"Evidence trace"` (or `"Traceability detail"`)  
- Rename description: `"Shows the evidence excerpts and analysis context used to produce this finding."`  
- Gate behind `AdminAuthority` authority rank OR expose to all operators under the renamed label.

---

### L02 · `OperatorCorePilotDiagnosticsChecklist` — internal DevOps telemetry panel (P0) · TB-546

**Component:** `archlucid-ui/src/components/operator/OperatorCorePilotDiagnosticsChecklist.tsx`  
**Visible on:** Operator home page, `fullOperatorShell === true`

**Current issue**  
This section exposes:
- Section heading: `"Server-tracked onboarding signals (this deployment)"`
- Body: `"These counters are process-lifetime for this deployment and reset when the API host restarts."`
- `"Registration/session signal: recorded / not recorded"`
- `"Finalization signal: ≥1 finalized review / waiting"`
- `"Steps (storage + inferred from finalize counters)"`
- `"Completed via finalize counter — update the sidebar checklist to match when you're ready."`
- `"checkbox progress is stored locally; finalization milestones also appear in server counters above once the pipeline persists"`

This is an **internal deployment health / telemetry monitoring panel** — essentially a DevOps diagnostic for the ArchLucid team to verify that onboarding signals are reaching the server. It is visible to every operator in the full shell on the home page.

**Why it matters**  
An enterprise IT leader opening the home page and expanding "Advanced guidance" sees monitoring terminology that describes the ArchLucid server's internal health, not their own setup progress. This is the most significant leakage item in the codebase.

**Recommended fix**  
- **Option A (preferred):** Gate the entire `OperatorCorePilotDiagnosticsChecklist` behind `AdminAuthority` rank (it is currently shown for `fullOperatorShell === true` without an authority check). Admin-rank operators already have access to `/admin/health`; this panel would be appropriate there.  
- **Option B:** Rewrite as a purely user-facing first-review milestone card ("Your first review progress") using only the step completion data, removing all deployment/pipeline/counter language.

---

### L03 · Governance submit form — "dev"/"test" environment defaults (P1) · TB-547

**Component:** `archlucid-ui/src/app/(operator)/governance/_sections/GovernanceWorkflowPageContent.tsx`  
**Visible on:** `/governance` (full architect workspace, non-buyer)

**Current issue**  
```typescript
const [submitSource, setSubmitSource] = useState<string>("dev");
const [submitTarget, setSubmitTarget] = useState<string>("test");
```

The approval request form pre-fills "Source environment" with `"dev"` and "Target environment" with `"test"`. An operator filling in their first governance approval form will see these DevOps environment names pre-filled, establishing that the governance workflow is about deployment pipeline promotion — not architecture review sign-off.

**Recommended fix**  
Remove the default values (use empty string `""`). Use placeholder text `e.g. source-environment` and `e.g. target-environment`. Or replace free-text fields with a configurable list driven by a workspace settings API.

---

### L04 · Governance toast — "Review package promoted." (P1) · TB-548

**Component:** `archlucid-ui/src/app/(operator)/governance/_sections/GovernanceWorkflowPageContent.tsx`  
**Visible on:** `/governance` (all operators)

**Current issue**  
On successful `promoteManifest` API call: `setToast({ kind: "ok", message: "Review package promoted." })`

"Promoted" is a deployment pipeline verb (e.g., "promote to production"). In the governance context, the action the user took is getting an architecture package approved for the next step — not deploying software.

**Recommended fix**  
Change to: `"Approval recorded — architecture package approved for release."` or `"Architecture package advanced to target environment."`

---

### L05 · `RunTraceViewerLink` — raw trace IDs in architect workspace (P1) · TB-549

**Component:** `archlucid-ui/src/components/runs/RunTraceViewerLink.tsx`  
**Visible on:** Finding inspect view and error surfaces

**Current issue**  
This component renders:
- A truncated hex trace ID (`e.g. 4a7f3b2c…`) in monospace
- A "View trace" external link to an internal observability backend (Jaeger/Tempo/etc.)
- A "Copy full trace ID" button

Visible to all operators on the finding inspect view. Enterprise governance reviewers, auditors, and IT leaders do not need access to distributed tracing infrastructure. This looks like internal DevOps tooling surfaced in a product UI.

**Recommended fix**  
- Add a `"Support reference:"` label prefix to make clear this is for support escalations only.
- Gate `RunTraceViewerLink` visibility behind `AdminAuthority` rank, or move it to an expandable "Technical details (for support)" disclosure.
- The "View trace" link to internal infrastructure should never be visible to non-admin operators.

---

### L06 · `FindingInspectFindingBody` — "artifacts & graph" CTA label (P1) · TB-550

**Component:** `archlucid-ui/src/app/(operator)/reviews/[runId]/findings/[findingId]/FindingInspectFindingBody.tsx`

See Visual Audit TB-537 — same issue, dual-tracked.

---

### L07 · Governance submit form — demo manifest version `"3.4.1"` pre-filled (P2) · TB-551

**Component:** `archlucid-ui/src/app/(operator)/governance/_sections/GovernanceWorkflowPageContent.tsx`

**Current issue**  
In demo mode: `setSubmitManifestVersion(isDemoShell ? "3.4.1" : "")`. The raw internal version string `"3.4.1"` appears as a pre-filled value in the "Review record version" field — even in the non-static-demo buyer-polished shell that initializes with this value.

**Recommended fix**  
Use a descriptive demo placeholder: `"3.4.1 (Claims Intake)"` and ensure it's only pre-filled when `isStaticDemoPayloadFallbackEnabled()` is true, not for the buyer-polished shell.

---

### L08 · Governance "Approval workflow quickstart" — exposes scaffolding-like API tutorial (P2) · TB-552

**Component:** `archlucid-ui/src/app/(operator)/governance/_sections/GovernanceWorkflowPageContent.tsx`  
**Visible on:** `/governance` (non-buyer-polished shell via `AdvancedOptionsAccordion`)

**Current issue**  
The "Approval workflow quickstart" accordion exposes `GovernanceInteractiveQuickstartCard` which walks users through: "submit request → promote manifest → activate environment" as an interactive guide. The step-by-step nature and verb choices ("promote manifest", "activate environment") make it read like a developer tutorial for directly calling APIs.

**Recommended fix**  
Rename to `"How governance approval works"`. Revise the card to describe the governance workflow in product terms ("submit for approval → reviewer approves → package available for architecture decision support") rather than API operation terms.

---

## Section 2. Top exposed implementation details

| Detail | Location | Exposure level |
|--------|----------|----------------|
| "Debug: View Raw Context" toggle | Finding inspect page — all operators | P0 |
| "Server-tracked onboarding signals (this deployment)" | Operator home — all `fullOperatorShell` users | P0 |
| "process-lifetime for this deployment and reset when API host restarts" | Operator home — all `fullOperatorShell` users | P0 |
| "dev" / "test" env defaults in approval form | Governance page — all operators | P1 |
| "Review package promoted." toast | Governance page — all operators on promote action | P1 |
| Raw hex trace IDs + "View trace" external link | Finding inspect + error surfaces — all operators | P1 |
| `"3.4.1"` version pre-fill in demo mode | Governance submit form | P2 |

---

## Section 3. What should be hidden entirely

- The "View trace" external link to internal observability infrastructure (gate to `AdminAuthority` or remove entirely from non-admin surfaces)
- The `"process-lifetime for this deployment"` / `"reset when API host restarts"` copy
- `"Registration/session signal"` and `"Finalization signal"` operational metrics

## Section 4. What should move to admin/operator tooling

- `OperatorCorePilotDiagnosticsChecklist` entire section → `/admin/health` or behind `AdminAuthority` gate
- `RunTraceViewerLink` → operator support panel or admin-only surface

## Section 5. What should be renamed into product language

| Internal term | Product-language replacement |
|---------------|------------------------------|
| "Debug: View Raw Context" | "Evidence trace detail" |
| "promoted" (toast) | "approved for release" |
| "dev" / "test" env defaults | Remove defaults; use placeholders |
| "activate environment" | "record go-live" or "mark active" |
| "promote manifest" (quickstart) | "approve and release architecture package" |
| "artifacts & graph" CTA | "Open review summary" |

---

## Section 6. P0 issues before trusted-user UAT

1. **TB-545** — "Debug: View Raw Context" toggle visible to all operators on finding inspect.
2. **TB-546** — `OperatorCorePilotDiagnosticsChecklist` entire DevOps telemetry panel visible on operator home.

---

## Section 7. Cursor-ready patch instructions

### TB-545 — Rename FindingInspectContextDebugPanel label

**File:** `archlucid-ui/src/components/findings/FindingInspectContextDebugPanel.tsx`

```tsx
// Change label:
"Debug: View Raw Context"
// To:
"Evidence trace detail"

// Change description:
"Shows cited evidence excerpts, provenance context steps, and the redacted LLM user prompt the model saw."
// To:
"Shows the evidence excerpts, provenance context steps, and analysis inputs used to produce this finding."
```

Optionally, add authority gate:
```tsx
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

const { callerAuthorityRank } = useOperatorNavAuthority();
if (callerAuthorityRank < AUTHORITY_RANK.AdminAuthority) {
  return null;
}
```

---

### TB-546 — Gate OperatorCorePilotDiagnosticsChecklist to AdminAuthority

**File:** `archlucid-ui/src/components/operator/OperatorCorePilotDiagnosticsChecklist.tsx`

Add at the top of the component function:

```tsx
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

const { callerAuthorityRank } = useOperatorNavAuthority();

if (callerAuthorityRank < AUTHORITY_RANK.AdminAuthority) {
  return null;
}
```

Alternatively, move the entire component to `/admin/health` page view.

---

### TB-547 — Remove governance submit form env defaults

**File:** `archlucid-ui/src/app/(operator)/governance/_sections/GovernanceWorkflowPageContent.tsx`

```typescript
// Change:
const [submitSource, setSubmitSource] = useState<string>("dev");
const [submitTarget, setSubmitTarget] = useState<string>("test");
// To:
const [submitSource, setSubmitSource] = useState<string>("");
const [submitTarget, setSubmitTarget] = useState<string>("");
```

Add placeholder attributes to the corresponding `<input>` fields:
```
placeholder="e.g. source-env"
placeholder="e.g. target-env"
```

---

### TB-548 — Rename "promoted" governance toast

**File:** `archlucid-ui/src/app/(operator)/governance/_sections/GovernanceWorkflowPageContent.tsx`

```typescript
// Change:
setToast({ kind: "ok", message: "Review package promoted." });
// To:
setToast({ kind: "ok", message: "Review package approved for release." });
```
