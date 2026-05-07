> **Scope:** Independent cognitive-load solution quality assessment for ArchLucid V1; excludes V1.1/V2 deferred items; does not assess general security, scalability, or procurement readiness.

# Cognitive Load Solution Quality Assessment — 75.62%

**Date:** 2026-05-07 | **Method:** Fresh independent code and document inspection. No subagents. No reference to prior assessments.

---

## Weighted Score

| Pillar | Weight | Raw | Weighted |
|--------|--------|-----|----------|
| First-session path and task framing | 25% | 73 | 18.25 |
| Output comprehension and explainability | 20% | 76 | 15.20 |
| Navigation information architecture | 20% | 81 | 16.20 |
| Failure recovery and confidence under friction | 12% | 78 | 9.36 |
| Docs-to-product coherence | 10% | 67 | 6.70 |
| Measurement and feedback loops | 8% | 77 | 6.16 |
| Accessibility and help discoverability | 5% | 75 | 3.75 |
| **Total** | **100%** | | **75.62** |

**Assessment summary:** The product has made concrete structural advances in error recovery, navigation gating, and funnel telemetry. The primitive set is sound. The remaining commercial weakness is that first-session copy still packs internal product vocabulary and run-model language into first-impression surfaces that buyers haven't earned yet. The inspection-first explainability contract is still missing. These are high-leverage fixes, not polish.

---

## 1. First-Session Path and Task Framing

**Weight: 25% | Raw: 73 | Weighted gap: 6.75 points | Largest gap in this assessment.**

### What is working

- `/onboarding` is canonical. Legacy aliases (`/getting-started`, `/onboarding/start`, `/onboard`) redirect via `buildOnboardingRedirectPath`, preserving query strings. The code and docs agree.
- The committed-architecture-review gate (`nav-committed-architecture-review-gate.ts`) correctly narrows the entire operator shell to three links (`/`, `/reviews/new`, `/reviews?projectId=default`) until the tenant has at least one committed review. This is the right primitive: restrict first, expand on achievement.
- The four-step checklist in `OperatorFirstRunWorkflowPanel` is well-constructed: server-synced progress, local storage fallback, auto-expand of the first undone step, milestone rail, graduation state.
- The heading copy is buyer-facing: `CORE_PILOT_FIRST_REVIEW_HEADING = "Create a governed architecture review package"`.

### What is broken

**H1 on the onboarding page is "Onboarding".** The page sets `<h1>Onboarding</h1>` at line 25. A buyer arriving at `/onboarding` for the first time reads a process label, not a goal. The heading does not say what outcome they are about to achieve.

**`CORE_PILOT_FIRST_SESSION_GUIDANCE` is 140 words of inline fine print using internal vocabulary.** It is rendered as `text-xs text-neutral-500` (12px, low contrast). The paragraph contains:
- "pipeline runs" — technical
- "manifest summary" — persisted model name, not a buyer outcome
- "Proof sendability" — an internal product concept from `pilot-proof-readiness.ts`
- "buyer-safe gate section" — internal product concept not visible at this step

A first-session operator landing here is already reading four step titles, a summary line, a co-architect kicker, and this paragraph before seeing any action. The paragraph adds seven new concepts. Most users will ignore it; the few who try to parse it will be confused.

**Graduated "What's next" section** shows three pill links: Compare, Replay, Graph. No description of what they do or why to use them. Compare and Replay are especially opaque without context.

**Score rationale:** The gate mechanism and checklist are strong enough to earn 73. The H1 and guidance paragraph are first-impression surfaces that are within one focused edit of being correct. The gap is editorial, not architectural.

---

## 2. Output Comprehension and Explainability

**Weight: 20% | Raw: 76 | Weighted gap: 4.80 points.**

### What is working

- `FindingExplainabilityDialog` gates language via `isBuyerPolishedOperatorShellEnv()`. In buyer-polished mode, the subtitle is "Structured reasoning captured when this finding was produced" rather than "Deterministic trace from the run pipeline."
- Evidence section is visually separated (sky-100 background, sky-200 border) and includes rule id, conclusion, evidence refs, and alternative paths — a defensible technical foundation.
- Trace completeness renders as a progress bar with percentage. Missing fields render in an amber warning section. This is genuinely useful.
- `findingId` and `severity` appear as badges immediately after the dialog opens.

### What is broken

**No inspect-first summary layer.** The dialog renders all technical data at the same visual weight in a flat vertical list:

```
[finding ID badge] [severity badge] [engine type]
[title]
[evidence section — sky-100 box]
[trace completeness bar]
[missing fields — amber box]
[narrative text]
[rules applied]
[decisions taken]
[graph nodes examined — UUID badges]
[alternative paths]
[notes]
[FindingExplainPanel]
```

Graph node IDs are displayed as UUID monospace badges inline with narrative content. A buyer or operator evaluating a finding must scroll past raw internal identifiers before they see the narrative. The three questions a buyer needs answered — "What matters most?", "Why should I trust this?", "What do I do next?" — are not answered in that order.

**No recommended next action field.** The dialog shows everything about how the finding was produced but nothing about what to do with it. Severity is present (as a badge), but there is no mapping from severity to action.

**Score rationale:** The explainability infrastructure is good. The failure is sequencing and missing top-level summary. 76 reflects the strong technical foundation with a concrete UX gap.

---

## 3. Navigation Information Architecture

**Weight: 20% | Raw: 81 | Weighted gap: 3.80 points.**

### What is working

- The committed-review gate (described in §1) is the most impactful nav improvement in the current codebase. Before first commit: three links max, regardless of disclosure flags or role. This eliminates the "map before journey" problem for new tenants.
- Progressive disclosure tiers (essential → extended → advanced) are well-tested in `nav-shell-visibility.test.ts` with 20+ cases covering rank × tier combinations.
- Demo mode hides admin, alerts, and audit while keeping Security & trust. Demo mode allowlist (`DEMO_MODE_ADVANCED_NAV_ALLOWLIST`) for Graph and Ask is deliberate.
- `countSidebarLinksHiddenByCollapsedPilot` test confirms the collapsed filter enforces ≤8 visible links for a default Reader shell. This is a real cognitive-load ceiling.
- Preset system (`full`, `pilot_operator`, `governance_reviewer`, `analytics_investigator`) exists with correct prefix-rule filtering tested.

### What is broken

**Default preset is `full`.** The first entry in `OPERATOR_SHELL_PRESET_ORDER` is `"full"`, and if no stored value exists, the shell defaults to the full preset. After the committed-review gate lifts (first commit), the operator immediately sees the unrestricted nav unless they manually switch. The gate restores the pilot shell until first commit; the preset does not. A user who has just committed their first review should continue in pilot context, not be dumped into the full nav.

**Graduated "What's next" pills are uncontextualised** (see §1). This affects navigation decision-making immediately post-graduation.

**Score rationale:** The gate mechanism is a genuine structural win. Default preset gap is a one-line change with measurable first-session impact.

---

## 4. Docs-to-Product Coherence

**Weight: 10% | Raw: 67 | Weighted gap: 3.30 points.**

### What is working

- Route redirect code and docs now agree: `/onboarding` is canonical, legacy aliases redirect.
- `cognitive-load-docs-drift.test.ts` verifies that every `HELP_TOPICS` entry's `docPath` resolves to a file under the repo root.
- `contextual-help-content.test.ts` verifies every `<ContextualHelp>` key has a defined entry under 200 chars, and that no orphaned index entries exist.
- `getDocHref` strips and normalizes paths; falls back to public GitHub blob URL when `NEXT_PUBLIC_DOCS_BASE_URL` is unset.

### What is broken

**The drift guard is minimal.** `cognitive-load-docs-drift.test.ts` checks file existence (10 lines). It does not check:
- That the canonical route `/onboarding` is the target of all legacy redirect handlers — if a future maintainer adds a new legacy alias that redirects wrong, the test does not catch it.
- That buyer-facing noun strings in first-session copy (`CORE_PILOT_STEPS`, `CORE_PILOT_FIRST_REVIEW_HEADING`, checklist copy) do not re-introduce `manifest`, `run`, or `authority chain` as first-order terms in V1 UI strings.
- That `HELP_TOPICS` doc path targets match what `CORE_PILOT_STEPS` link to.

The guard exists — the implementation risk is that future edits regress first-session coherence silently.

**Score rationale:** 67 reflects the right infrastructure but a thin guard perimeter. The improvement is adding assertions that are already conceptually described in the existing test file.

---

## 5. Failure Recovery and Confidence Under Friction

**Weight: 12% | Raw: 78 | Weighted gap: 2.64 points.**

### What is working

- `OnboardingStartClient` now has full recovery copy for 401/403, 404, 429, ≥500, and network error. Each recovery state has a structured headline, detail, and multiple action buttons (Retry, Start new review request, Open onboarding checklist, Operator home). This is commercially usable.
- `api-problem-copy.ts` maps stable `errorCode` values to operator-readable headings and remediation hints. `DATABASE_TIMEOUT`, `CIRCUIT_BREAKER_OPEN`, `INVALID_RUN_STATE`, `COMPARISON_VERIFICATION_FAILED` all have specific actionable copy. The 429 case surfaces `Retry-After` seconds when available.
- `OperatorApiProblem` and `operatorCopyForProblem` are reusable across surfaces.

### What is broken

**Recovery quality for the review-creation wizard submission and finalization is unverified.** `OnboardingStartClient` is one surface. The new-review wizard (`NewRunWizardClient`) and the review-detail finalization path are separate components. From inspection of the error infrastructure, the generic `OperatorApiProblem` is available, but there is no evidence of task-specific recovery copy that tells a user "You tried to finalize but the pipeline hasn't completed — wait and retry from the review detail page."

**Score rationale:** 78 reflects the strong onboarding error surface and the generic `api-problem-copy` infrastructure, with a gap on task-specific wizard and finalization recovery.

---

## 6. Measurement and Feedback Loops

**Weight: 8% | Raw: 77 | Weighted gap: 1.84 points.**

### What is working

- Funnel events exist and are tested: `signup`, `tour_opt_in`, `first_run_started`, `first_run_committed`, `first_finding_viewed`, `thirty_minute_milestone`.
- Thirty-minute milestone fires at most once per browser (de-duplicated via localStorage).
- Events post to `/api/proxy/v1/diagnostics/first-tenant-funnel`. Tenant ID is inferred server-side; the request body does not expose it.
- Tests cover timing logic, milestone firing conditions, and de-duplication.

### What is broken

**Gap events missing.** The funnel tracks signup → first_finding_viewed, but skips two commercially important moments: "first finalization attempted" (did they get to commit?) and "artifact or export opened" (did they extract value?). Without these, the funnel breaks exactly where the product is most likely to lose users — at finalization and first export.

**Milestone is local-only.** `thirty_minute_milestone` fires from browser localStorage timing. If the user switches devices or clears storage, the milestone is lost. This is acceptable for V1 but limits the signal's durability.

---

## 7. Accessibility and Help Discoverability

**Weight: 5% | Raw: 75 | Weighted gap: 1.25 points.**

### What is working

- `role="alert"` on the trial-status error section.
- `aria-live="polite"` on the step-count paragraph in the checklist.
- `aria-expanded` and `aria-controls` on expand/collapse buttons.
- `aria-label` on checkboxes: "Mark step N done: {title}".
- Contextual help index is validated: all keys defined, all texts under 200 chars, no orphaned entries.
- `ContextualHelp` keys are extracted from source and cross-matched — no missing index entries.

### What is broken

**No step-aware help mode.** When a user is on `/onboarding` or `/reviews/new` with no finalized review, the help drawer opens the full guide and search. It does not pin the current Core Pilot step, the next action, or a single fallback link above the general content. The help drawer answers "what is everything?" rather than "what is next?"

---

## Eight Best Improvements

Ordered by weighted impact: highest gap pillar first, then sub-area impact within that pillar.

---

### Improvement 1 — Replace Wall-of-Text Guidance with Three Action Bullets

**Pillar:** First-session path (25% weight). **Impact:** Removes ~7 unexplained concepts from fine print.

`CORE_PILOT_FIRST_SESSION_GUIDANCE` in `core-pilot-first-review-copy.ts` is a 140-word, 12px, low-contrast paragraph that references "pipeline runs," "manifest summary," "Proof sendability," and "buyer-safe gate" — concepts not yet established at this point in the session. Replace with three short action bullets visible at reading weight.

```
Cursor prompt:
Rewrite `CORE_PILOT_FIRST_SESSION_GUIDANCE` in
`archlucid-ui/src/lib/core-pilot-first-review-copy.ts`.
The replacement must be three action-oriented bullet points (not a paragraph),
each under 20 words, using only buyer-facing vocabulary. Remove references to
"pipeline runs", "manifest summary", "Proof sendability", and "buyer-safe gate"
— those terms are not yet established at first session.

Bullet targets:
1. Start one architecture review now (link to wizard).
2. Let the pipeline finish, then finalize it.
3. Export your review package when ready to share.

In `OperatorFirstRunWorkflowPanel`, render the guidance as a `<ul>` with three
`<li>` items at `text-xs` normal-weight (not `text-neutral-500` — use
`text-neutral-700 dark:text-neutral-300`). Remove the `leading-snug` and
`text-neutral-500` styling that currently makes this paragraph read as a
footnote. Update the snapshot test or any tests that assert the exact
`CORE_PILOT_FIRST_SESSION_GUIDANCE` string.
```

---

### Improvement 2 — Change Onboarding Page H1 to a Buyer Outcome Statement

**Pillar:** First-session path (25% weight). **Impact:** First thing a buyer sees is their goal, not a process label.

`archlucid-ui/src/app/(operator)/onboarding/page.tsx` line 25 sets `<h1>Onboarding</h1>`. This is a process label. A buyer or evaluator arriving here should read their goal immediately.

```
Cursor prompt:
Change the `<h1>` on the operator onboarding page
(`archlucid-ui/src/app/(operator)/onboarding/page.tsx`)
from "Onboarding" to "Your first architecture review package".

Also update the `<p>` that follows (currently "Follow the checklist below…")
to start with the outcome: "Complete four steps to produce your first finalized,
exportable architecture review package." Remove the phrase "For the full home
overview, go to Home" — that link is available in the sidebar and is not a
cognitive-load priority on this page.

Update the page `<title>` metadata if it currently exposes "Onboarding" as
the document title (check `generateMetadata` or `metadata` export in the same
file or a parent layout).

Do not change any API routes, server actions, or redirect logic.
```

---

### Improvement 3 — Add Inspect-First Summary to FindingExplainabilityDialog

**Pillar:** Output comprehension (20% weight). **Impact:** Answers "what matters?" before "how was it produced?"

`FindingExplainabilityDialog.tsx` currently renders all data at one level. A buyer reads UUID graph node badges before seeing a narrative sentence. Add a structured summary block at the top.

```
Cursor prompt:
Add an inspect-first summary block at the top of the content section in
`archlucid-ui/src/components/FindingExplainabilityDialog.tsx`.

The summary block should appear immediately after the finding ID / severity
badge row and before the evidence section. It must include:
1. A plain-language severity label:
   Critical → "Requires immediate attention"
   High → "Should be addressed before next release"
   Medium → "Recommended for the current improvement cycle"
   Low / Informational → "Consider for a future improvement cycle"
   Unknown → omit or show nothing
   (Map from `data.severity`.)
2. Trace completeness status as plain English:
   ≥80% → "Evidence chain is complete"
   ≥50% → "Evidence chain is partially complete"
   <50% → "Evidence chain is incomplete — review narrative for context"
3. Evidence count: "N evidence references recorded" (from
   `data.evidence.evidenceRefs.length`, or 0 if no evidence).
4. The narrative text (`data.narrativeText`) moved to this block as the
   "Rationale" item, styled at normal reading weight.

Move the existing narrative section (`<section aria-labelledby=
"finding-narrative-heading">`) out of the flat list — its content appears
inside the summary block. The subsequent sections (rules applied, decisions
taken, graph nodes examined, alternative paths, notes, `FindingExplainPanel`)
should appear under a clearly labeled "Technical audit details" `<details>`
disclosure element (collapsed by default, expandable with a `<summary>` button).

Use `isBuyerPolishedOperatorShellEnv()` to gate the disclosure label:
buyer-polished → "Technical audit details"
default → "Trace audit details (pipeline internals)"

Preserve all existing authority checks, `FindingExplainPanel` usage, and
feedback controls. Add focused tests:
- summary block renders with correct severity label for Critical, High, Medium,
  Low, and unknown
- "Technical audit details" is collapsed by default
- "Technical audit details" contains graph node badges
- existing test coverage for FindingExplainPanel is unchanged
```

---

### Improvement 4 — Change Default Nav Preset from `full` to `pilot_operator`

**Pillar:** Navigation IA (20% weight). **Impact:** Post-first-commit nav matches pilot context by default.

`archlucid-ui/src/lib/operator-nav-preset.ts` places `"full"` first in `OPERATOR_SHELL_PRESET_ORDER`. The storage key reads this as the default when no stored value exists. After the committed-review gate lifts, the nav expands to `full` by default — potentially confusing for operators still focused on the Core Pilot.

```
Cursor prompt:
In `archlucid-ui/src/lib/operator-nav-preset.ts`, change the default preset
from `"full"` to `"pilot_operator"` by reordering `OPERATOR_SHELL_PRESET_ORDER`
so `"pilot_operator"` is first:

  export const OPERATOR_SHELL_PRESET_ORDER = [
    "pilot_operator",
    "full",
    "governance_reviewer",
    "analytics_investigator",
  ] as const;

Anywhere the default preset is resolved (e.g. by reading localStorage and
falling back when no value is stored), confirm the fallback returns the first
entry in `OPERATOR_SHELL_PRESET_ORDER` rather than a hardcoded `"full"` string.

Locate any component or hook that reads `OPERATOR_SHELL_PRESET_STORAGE_KEY`
and update the fallback assignment to use `OPERATOR_SHELL_PRESET_ORDER[0]`
instead of a literal. Add or update the relevant test to assert that the
no-stored-preset default is `"pilot_operator"`.

Do not change server authorization, API contracts, or any disclosure tier
defaults (`showExtended`, `showAdvanced`).
```

---

### Improvement 5 — Expand Cognitive-Load Drift Guard to Cover Routes and Buyer Terms

**Pillar:** Docs-to-product coherence (10% weight). **Impact:** Prevents silent regression of first-session coherence.

`cognitive-load-docs-drift.test.ts` checks only that `HELP_TOPICS` doc paths resolve to files. It does not verify route canonicalization or buyer-term discipline.

```
Cursor prompt:
Extend `archlucid-ui/src/lib/cognitive-load-docs-drift.test.ts` with two
additional test groups:

Group 1 — Route canonicalization:
Assert that `buildOnboardingRedirectPath` from `legacy-onboarding-redirect.ts`
always targets `/onboarding` as the pathname (not `/getting-started`,
`/onboarding/start`, or `/onboard`). Assert that the result preserves
arbitrary query strings. These tests already have the import available;
just add cases.

Group 2 — Buyer-term discipline in first-session copy:
Import `CORE_PILOT_FIRST_REVIEW_HEADING`, `CORE_PILOT_WORKFLOW_SUMMARY_LINE`,
`CORE_PILOT_FIRST_SESSION_GUIDANCE`, and `CORE_PILOT_FIRST_REVIEW_HEADING_COMPACT`
from `core-pilot-first-review-copy.ts`.

Assert that none of these strings contain the word "manifest" (case-insensitive)
without immediately following it with "summary" or wrapping it in parentheses
— i.e., `manifest` cannot appear as a standalone first-class noun in buyer-facing
first-session copy.

Assert that none of these strings contain "authority chain" (internal term that
has no buyer-facing meaning at session start).

Assert that `CORE_PILOT_FIRST_REVIEW_HEADING` contains "architecture review"
or "review package" (i.e., the buyer-facing framing is preserved).

Do not add a documentation crawler. Keep all tests within existing Vitest
patterns. The goal is to make regressing first-session vocabulary a CI failure.
```

---

### Improvement 6 — Add Task-Specific Recovery to Wizard Submission and Finalization

**Pillar:** Failure recovery (12% weight). **Impact:** Extends recovery quality from onboarding to the two other highest-traffic failure surfaces.

The `OnboardingStartClient` recovery pattern is complete and good. The new-review wizard and review-detail finalization should follow the same pattern.

```
Cursor prompt:
Add task-specific recovery copy to two surfaces that currently use only
generic `OperatorApiProblem`:

Surface A — New review wizard submission failure (`NewRunWizardClient.tsx`):
When the wizard POST to create a review fails, the error display must show:
- 401/403: "Sign-in or permission required — verify your account role, then
  retry from the wizard."
- 429: "Too many requests — wait a few seconds, then try again. Your inputs
  are preserved in the wizard."
- 5xx: "Server error — the request did not complete. Your inputs are
  preserved; retry or start from the reviews list."
- Generic: "Review creation failed — retry, or start from the reviews list
  to check if the review was created despite the error."
Include a "Back to reviews list" link alongside any existing Retry button.

Surface B — Review detail finalization failure (the commit action in the
review-detail page):
When the commit POST fails, the error display must show:
- `INVALID_RUN_STATE`: "The review is not ready to finalize — check the
  pipeline status above and retry when the pipeline shows complete."
- `COMMIT_FAILED`: "Finalization did not complete — retry once. If this
  continues, open a support ticket with the correlation ID below."
- 5xx: "Server error during finalization — retry in a few moments. The
  review state has not changed."
- Generic: "Finalization failed — retry or reload the page to check status."

Use `operatorCopyForProblem` from `api-problem-copy.ts` as the base for
error code mapping; add task-specific wrappers as needed rather than a
second lookup table. Add unit tests for each error code path in both surfaces.
```

---

### Improvement 7 — Add Missing Core Pilot Funnel Events (Client Side; Server Extension Needed)

**Pillar:** Measurement and feedback loops (8% weight). **Impact:** Closes the funnel gap at finalization and first export.

The current funnel (`first-tenant-funnel-telemetry.ts`) tracks through `first_finding_viewed` but stops before finalization and export — the two moments most predictive of actual value delivery.

**Note:** The client-side calls can be added immediately. The server-side `first-tenant-funnel` endpoint must accept the new event names — this requires backend owner involvement to extend the allowed event list. The Cursor prompt below covers the client side; flag the server extension as an owner task.

```
Cursor prompt:
Add two new event names to the Core Pilot funnel telemetry in
`archlucid-ui/src/lib/first-tenant-funnel-telemetry.ts`:
- `"first_finalization_attempted"` — fire when the operator clicks the
  finalize/commit action for the first time (before the response arrives).
- `"first_export_opened"` — fire when the operator opens any artifact
  download or export action from review detail for the first time.

Both events must follow the existing pattern: fire via `recordFirstTenantFunnelEvent`,
de-duplicate using localStorage so they fire at most once per browser session
(same pattern as `thirty_minute_milestone`). Add the de-duplication keys
`archlucid_funnel_finalization_fired` and `archlucid_funnel_export_fired`.

Call `recordFirstTenantFunnelEvent("first_finalization_attempted")` from the
commit-action handler in the review-detail page (locate by the handler that
calls the commit API endpoint). Call `recordFirstTenantFunnelEvent(
"first_export_opened")` from the artifact download or ZIP export action in
review detail.

Add unit tests for:
- Each new event fires on first call
- Each new event does not fire again on subsequent calls (de-duplication)
- Existing events are unaffected

⚠️ Owner task required: extend the server-side `/v1/diagnostics/first-tenant-funnel`
endpoint to accept `"first_finalization_attempted"` and `"first_export_opened"`
as valid event names. Until the backend is extended, new events will silently
succeed (assuming the endpoint is permissive) or return a non-breaking error.
```

---

### Improvement 8 — Add Step-Aware Help Mode for Core Pilot in the Help Drawer

**Pillar:** Accessibility and help discoverability (5% weight). **Impact:** Makes help answer "what next?" instead of "everything."

The current help drawer opens the full guide and search regardless of where the operator is in the Core Pilot flow.

```
Cursor prompt:
Add a step-aware contextual help block to the operator help drawer. When the
current pathname is one of `/`, `/onboarding`, `/reviews/new`, or
`/reviews/{id}` AND the tenant has no finalized review (use the existing
`hasCommittedManifest` signal from `fetchCorePilotCommitContext` or the
committed-review gate context if already available in the shell), render a
pinned block at the top of the help drawer above the general guide tabs.

The pinned block must:
1. Identify the current Core Pilot step by mapping the pathname:
   - `/` or `/onboarding` → Step 1 (Create)
   - `/reviews/new` → Step 1 (Create) or Step 2 (Finalize) depending on
     whether a review exists
   - `/reviews/{id}` → Step 2 (Wait for pipeline) or Step 3 (Finalize)
2. Show the step title and a one-sentence description of the next action
   (from `CORE_PILOT_STEPS` — do not duplicate copy).
3. Show one fallback link to `docs/CORE_PILOT.md` labeled "Full guide".
4. Render a "Dismiss until next session" button that hides the pinned block
   via a sessionStorage key.

Do not remove the general guide, search, or shortcuts tabs — they must remain
accessible below the pinned block.

Use `CORE_PILOT_STEPS` from `core-pilot-steps.ts` as the source of truth for
step titles and descriptions. Do not hardcode strings that duplicate that file.

Add tests for:
- Correct step identified for each pathname
- Pinned block absent when `hasCommittedManifest` is true
- Dismiss button removes the block and persists via sessionStorage
- General help tabs still render when pinned block is shown
```

---

## Tradeoffs

**Why not score higher?** The nav gate and error recovery are genuinely strong. The score is held at 75.62 because two of the highest-weight pillars (first-session copy and output comprehension) still have concrete, unaddressed gaps that affect the first 30 minutes of every new operator's experience. A well-architected product that loses first-session comprehension is still commercially fragile.

**Why not score lower?** The committed-review gate, the structured funnel telemetry, the comprehensive error recovery in `OnboardingStartClient`, and the test coverage for nav visibility are materially better than a baseline implementation. These represent real engineering investment in the right places.

---

## Pending Owner Questions

I have no questions that block the eight improvements above. The items below should be addressed when the owner has time — I will have them ready when asked.

1. **Canonical buyer noun set for V1** — Should "architecture review package" be the single canonical buyer-facing noun for the output of a run, or is there a preferred alternative? This affects copy in Improvement 1, 2, and 3.

2. **Server-side funnel event extension** — The backend `first-tenant-funnel` endpoint must be extended to accept `first_finalization_attempted` and `first_export_opened` (Improvement 7). Owner or backend engineer action required.
