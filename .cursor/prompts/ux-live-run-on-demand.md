# UX: Fast Deterministic Live Run On Demand

## Goal
Add a "Demo live run" fast-path to `/reviews/new` that fires a real (non-static) review in under 20 seconds and displays business-English progress so a CTO on stage can see real AI working, not a canned showcase.

## Context
- Current state: the entire 30-minute CTO demo shows only the pre-seeded `claims-intake-modernization` static payload. A technical CTO will ask "is any of this real?"
- Relevant files:
  - `archlucid-ui/src/app/(operator)/reviews/new/` — intake wizard
  - `archlucid-ui/src/components/CtoDemoFastCreatePanel.tsx` — existing fast-create shell (already shown during tour)
  - `archlucid-ui/src/lib/api/architecture-runs.ts` — `createArchitectureRun`, `commitArchitectureRun`
  - `archlucid-ui/src/lib/quick-review-sample-briefs.ts` — canned sample briefs (e.g. Contoso Retail)
  - `archlucid-ui/src/lib/buyer-cto-demo-tour.ts` — tour state; `readBuyerCtoDemoTourActive()`
  - `archlucid-ui/src/lib/demo-ui-env.ts` — `isBuyerPolishedOperatorShellEnv()`
  - `archlucid-ui/src/components/cto-demo/CtoDemoDataSourceBadge.tsx` — simulator/live badge

## What to build

### 1. `CtoDemoLiveRunProgressRail` component
A new component `archlucid-ui/src/components/cto-demo/CtoDemoLiveRunProgressRail.tsx` that displays named business-English pipeline stages as the run progresses:

```
Analyzing architecture brief…       âœ“  (2s)
Applying policy pack (HIPAA PII)…   âœ“  (4s)
Identifying findings…               â— running
Drafting signed decisions…          â—‹ pending
Generating audit record…            â—‹ pending
```

Rules:
- Stage labels must be plain business English — no "LLM", "agent", "model", "inference". Use product vocabulary: "architecture package", "policy pack", "finding", "signed decision record."
- Stage timings come from polling `GET /v1/architecture/review/{runId}` pipeline status (or server-sent events if available).
- Show a wall-clock elapsed time ("Elapsed: 14s") in `tabular-nums`.
- At completion, show a green "Review ready — view it" CTA that navigates to `/reviews/{runId}`.
- If the run exceeds 25s, show a reassuring "Still working — complex briefs take a moment longer" message, not a spinner freeze.

### 2. Add "Try it live" button to `CtoDemoFastCreatePanel`
When the CTO demo tour is active (`readBuyerCtoDemoTourActive() === true`) and the user is on `/reviews/new`:
- Show a prominent "Try it live (not simulated)" button alongside the existing sample-brief "Use sample brief" button.
- Clicking it pre-fills the brief with the Claims Intake Modernization brief, sets simulator mode OFF, and starts the run.
- Immediately mount `CtoDemoLiveRunProgressRail`.

### 3. Simulator-vs-live label at trigger point
At the moment the user fires the live run, render one sentence below the trigger button (using existing `CtoDemoDataSourceBadge` or an inline note):
> "Live mode uses Azure OpenAI — the same pipeline as a real review, just triggered now."

Use `OPERATOR_TYPOGRAPHY.badge` size, neutral text, not a warning color.

## Acceptance criteria
- A live run initiated from the fast-path shows named progress stages within 2s of submission.
- The run completes and navigates to the result without manual refresh.
- No "LLM", "model", "agent", "inference" text is visible to the audience.
- The component renders correctly when `isBuyerPolishedOperatorShellEnv()` is true.
- Existing `CtoDemoFastCreatePanel` tests continue to pass; add unit tests for `CtoDemoLiveRunProgressRail` stage-label mapping.

## Constraints
- Follow IBM Carbon / design-token conventions (`OPERATOR_TYPOGRAPHY`, `StatusTag`, neutral surfaces).
- Do not use heavy ORM patterns; API calls go through existing `archlucid-ui/src/lib/api/` helpers.
- Do not introduce new npm dependencies.
