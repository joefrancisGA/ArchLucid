# UX: In-Product Finding Provenance Panel

## Goal
Add an expandable "Why this finding?" panel to every finding detail page that shows the chain: inputs → evidence collected → policy rule evaluated → conclusion reached. Turns "trust me" into "look." Closes the biggest correctness-perception gap (TB-034–056, provenance gaps).

## Context
- A CTO will click a high-severity finding and ask "where did this come from?" The current finding detail shows the verdict and risk but not the reasoning chain.
- Key files:
  - `archlucid-ui/src/app/(operator)/reviews/[runId]/findings/[findingId]/page.tsx` — finding detail route
  - `archlucid-ui/src/components/` — look for `FindingDetailPageView.tsx`, `FindingInspectView.tsx`, `FindingInspectGovernanceStickinessPanel.tsx`
  - `archlucid-ui/src/lib/showcase-static-demo.ts` — static demo payload (must work with this for the demo spine)
  - `archlucid-ui/src/lib/api/` — find or create a `getFindingProvenance(runId, findingId)` helper

## What to build

### 1. Provenance data model (UI-side)
Define a type in `archlucid-ui/src/lib/api/finding-provenance.ts`:

```typescript
export type FindingProvenanceStep = {
  readonly kind: "input" | "evidence" | "policy-check" | "conclusion";
  readonly label: string;     // e.g. "Architecture brief: Claims Intake Modernization"
  readonly detail: string;    // plain-English explanation
  readonly timestamp?: string;
};

export type FindingProvenance = {
  readonly findingId: string;
  readonly steps: readonly FindingProvenanceStep[];
};
```

Fetch from `GET /v1/architecture/review/{runId}/findings/{findingId}/provenance` if the endpoint exists; otherwise fall back to a static showcase provenance payload (see step 3).

### 2. `FindingProvenancePanel` component
New component `archlucid-ui/src/components/findings/FindingProvenancePanel.tsx`:

- Renders as a collapsible accordion section labeled **"Why this finding?"** with a `ChevronDown` icon.
- Collapsed by default; expands on click.
- When expanded, shows a vertical timeline of `FindingProvenanceStep` entries:
  - `"input"` steps: neutral chip, label "Brief / context provided"
  - `"evidence"` steps: teal-left-border card, label "Evidence collected"
  - `"policy-check"` steps: amber-left-border card, label "Policy rule evaluated"
  - `"conclusion"` steps: bold label "Conclusion" + the finding severity

Use `OPERATOR_TYPOGRAPHY` and design tokens throughout. No raw coloured `span` elements for status — use `StatusTag` or a single left-border accent.

Loading state: show three skeleton rows while fetching.
Error state: "Provenance not available for this finding" in neutral text — never an error boundary crash.

### 3. Static demo provenance payload
In `archlucid-ui/src/lib/showcase-static-demo.ts`, add provenance data for the two or three most prominent findings (the `phi-minimization-risk` finding and at least one more):

```typescript
export const SHOWCASE_FINDING_PROVENANCE: Record<string, FindingProvenance> = {
  "phi-minimization-risk": {
    findingId: "phi-minimization-risk",
    steps: [
      { kind: "input", label: "Architecture brief", detail: "Claims Intake Modernization — 847-word brief describing data flow between intake portal and claims processor." },
      { kind: "evidence", label: "Data flow identified", detail: "Patient demographics field detected in claims payload transmitted over internal API without field-level encryption." },
      { kind: "policy-check", label: "HIPAA Â§164.312(a)(2)(iv) evaluated", detail: "Policy pack rule: PHI must be minimized at data boundary. Transmission includes date-of-birth and SSN fields not required by downstream processor." },
      { kind: "conclusion", label: "High severity finding raised", detail: "Unnecessary PHI exposure at claims API boundary — recommend field-level stripping before transmission." },
    ],
  },
};
```

`getFindingProvenance` tries the API first; if unavailable and `isStaticDemoPayloadFallbackEnabled()`, returns from `SHOWCASE_FINDING_PROVENANCE`.

### 4. Wire into finding detail page
In `FindingDetailPageView.tsx` (or `FindingInspectView.tsx`), add `<FindingProvenancePanel runId={runId} findingId={findingId} />` below the finding summary card and above governance stickiness.

## Acceptance criteria
- Clicking "Why this finding?" on the `phi-minimization-risk` showcase finding shows a four-step provenance chain.
- The component renders in static demo fallback mode.
- The accordion starts collapsed so the finding summary remains above-fold.
- Error state renders gracefully when API is unavailable and no static payload exists.
- Unit tests cover: renders collapsed by default, expands on click, renders each step kind with correct styling.
- No raw `<span style="color: red">` or ad-hoc semantic fills — only design-token classes.
