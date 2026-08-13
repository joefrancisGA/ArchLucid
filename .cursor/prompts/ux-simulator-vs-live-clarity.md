# UX: Unmistakable Simulator-vs-Live Clarity + Determinism Statement

## Goal
Eliminate the #1 CTO objection — "how do I know live is as good as what you're showing?" — by making simulator vs live mode permanently legible at the create step and by adding a determinism statement to every signed manifest. Addresses SAQ-008 (simulator/live divergence confusion) from the current assessment.

## Context
- Current state: `CtoDemoSimulatorTrustBadge` exists but its placement and prominence are inconsistent. The signed manifest does not state that the same inputs produce the same signed result.
- Key files:
  - `archlucid-ui/src/components/cto-demo/CtoDemoSimulatorTrustBadge.tsx`
  - `archlucid-ui/src/components/cto-demo/CtoDemoDataSourceBadge.tsx`
  - `archlucid-ui/src/app/(operator)/reviews/new/` — intake wizard
  - `archlucid-ui/src/app/(operator)/manifests/[manifestId]/` — manifest detail page
  - `archlucid-ui/src/lib/showcase-static-demo.ts` — `SHOWCASE_STATIC_DEMO_RUN_ID`
  - `archlucid-ui/src/lib/buyer-polish-copy.ts` — copy constants

## What to build

### 1. Permanent mode badge at the create step
In `QuickReviewWizard.tsx` (and `CtoDemoFastCreatePanel.tsx`), add a sticky one-line callout **above the submit button** that reads differently based on mode:

**Simulator mode:**
> "Simulator mode — deterministic, instant results using a sandboxed pipeline. Switch to live mode for Azure OpenAI inference."

**Live mode:**
> "Live mode — uses your Azure OpenAI deployment. Same pipeline, same policy packs, same signed output format as the showcase."

Rules:
- Use a `<StatusTag kind="needs-attention">` chip for simulator, `<StatusTag kind="ready">` for live — not freeform colored text.
- Do not put this in the overlay; it must be on-page so the audience sees it.
- This callout must render regardless of whether the CTO demo tour is active.

### 2. Side-by-side simulator-vs-live toggle on the create step
Below the mode badge, add a two-option toggle row (radio buttons styled as chips, using existing design-token classes):

```
[Simulator — faster]   [Live — Azure OpenAI]
```

- Simulator is the default for demo/buyer-polished mode.
- Switching to live updates the mode badge copy immediately.
- Persist selection in component state only (not localStorage — don't accidentally sticky live mode between sessions).

### 3. Determinism statement on signed manifests
In the manifest detail page (`archlucid-ui/src/app/(operator)/manifests/[manifestId]/`), find the section that shows the manifest hash / commit ID (likely in `ManifestDetailPageView.tsx` or `ManifestTopDecisionsCard.tsx`).

Add a one-line callout adjacent to the hash:
> "Deterministic: the same architecture brief and policy pack version will always produce the same signed manifest hash."

Use `OPERATOR_TYPOGRAPHY.badge` sizing, neutral text color (not amber/teal). Add `data-testid="manifest-determinism-statement"`.

This callout must render in both demo and non-demo contexts (it is always true and improves trust generally).

### 4. Update `CtoDemoSimulatorTrustBadge`
Audit current usage — ensure it appears:
- On the executive summary (Step 1) above-fold section.
- On the manifest detail (Step 2).
- On the graph / evidence trail (Step 3).
Does it currently appear on all three? If not, add it.

## Acceptance criteria
- The mode badge renders on the create step in buyer-polished mode.
- The two-chip toggle switches the badge copy without a page reload.
- The determinism statement renders on the manifest detail page with correct `data-testid`.
- `CtoDemoSimulatorTrustBadge.test.tsx` passes; add a test for the manifest determinism statement.
- No instances of "LLM", "model", "GPT", "inference" visible to the audience on these surfaces.

## Constraints
- Do not introduce new UI component libraries.
- The determinism statement must be factually accurate — only add it if the backend truly produces the same signed hash for identical inputs. If SAQ-008 is not fully resolved, phrase as: "Policy-consistent: outputs are governed by the same deterministic policy evaluation rules."
