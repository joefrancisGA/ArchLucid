> **Scope:** Contributor-reference — composer prompt set for authenticated operator home copy and hierarchy polish (not buyer-facing runtime docs).

# Home page polish — composer prompt set

**Goal:** Copy and hierarchy cleanup only. No new features, no layout changes, no behavior changes.
**Surface:** Authenticated architect home (`/`) — both buyer-polished and full architect workspace variants.

Each prompt is independent and can be run individually. Run them in order if doing them in one session so the copy stays consistent.

---

## Prompt 1 — Standardize primary CTA to "Start architecture review"

> **Scope:** `archlucid-ui/src/lib/buyer/buyer-polish-copy.ts` and
> `archlucid-ui/src/components/operator-home/OperatorHomeFirstReviewEmptyState.tsx`
>
> **What and why:** Three different strings are used for the same action (navigate to `/reviews/new`):
> "Start review" (hero card), "Begin architecture review" (empty state), and "Start new review"
> (guidance section). Unifying them removes decision friction for the buyer during a live demo.

**Changes — `buyer-polish-copy.ts`:**

1. Change `PILOT_COMMAND_CENTER_PRIMARY_CTA` from `"Start review"` to `"Start architecture review"`.
2. Change `PILOT_COMMAND_CENTER_HEADING` from `"Start your first review"` to `"Start architecture review"`.
   - This heading is the `<h2>` inside `PilotCommandCenterCard` and the `aria-label` on
     `BuyerPolishedHomeHeroSection`. Both derive from this constant, so one edit is enough.

**Changes — `OperatorHomeFirstReviewEmptyState.tsx`:**

3. In the `<Link href="/reviews/new">` primary button, change the button label from
   `"Begin architecture review"` to `"Start architecture review"`.
   - The button currently imports `FileSearch` from lucide-react and renders:
     `<FileSearch …/>Begin architecture review`. Keep the icon, change only the text.

No layout or behavior changes. Do not touch routes, imports, or any other copy constants.

---

## Prompt 2 — Rename "What ArchLucid found in the example review" to "Example findings"

> **Scope:** `archlucid-ui/src/components/operator-home/OperatorHomeSampleReviewPreview.tsx`
>
> **What and why:** The current heading is verbose and product-branded in a way that adds no
> information. "Example findings" is shorter, scans faster in a demo context, and matches the
> buyer's mental model (they are looking at findings from an example).

**Change:**

In `OperatorHomeSampleReviewPreview.tsx`, on the `<h3>` element with
`id="operator-home-sample-review-preview-heading"`, change the text content from:

```
What ArchLucid found in the example review
```

to:

```
Example findings
```

The subtitle below the heading (`{SHOWCASE_BUYER_REVIEW_TITLE} — representative findings from the
static showcase package.`) is accurate and provides the context that was previously in the heading.
Leave it unchanged.

The `"Open full example review"` button on this card is a secondary action and intentionally
preserved — do not rename it here.

No other changes.

---

## Prompt 3 — Simplify the three-step hero labels

> **Scope:** `archlucid-ui/src/lib/buyer/buyer-polish-copy.ts`
>
> **What and why:** The `PILOT_PATH_PREVIEW_STEPS` array drives the step stepper rendered inside
> `PilotCommandCenterCard` (via `PilotPathPreviewStepper`). The current labels are verbose
> ("Connect environment or upload evidence", "Execute review analysis"). Shorter, verb-first labels
> read faster during a live demo and align with the requested canonical flow:
> Provide evidence → Run analysis → Review findings.

**Change in `buyer-polish-copy.ts` — update `PILOT_PATH_PREVIEW_STEPS`:**

```ts
export const PILOT_PATH_PREVIEW_STEPS = [
  { id: "connect", label: "Provide evidence" },
  { id: "analyze", label: "Run analysis" },
  { id: "review", label: "Review findings" },
] as const;
```

The ids (`"connect"`, `"analyze"`, `"review"`) must remain unchanged — they are used as React
`key` props and potentially as test selectors.

No other changes. Do not touch `PILOT_COMMAND_CENTER_STEPS_HEADING` ("3 steps") or any other
constants. Do not change the `FIRST_RUN_STEPS` array in `OperatorHomeFirstReviewEmptyState.tsx`
— that array is being replaced by Prompt 4.

---

## Prompt 4 — Replace the duplicate "Recent reviews" empty state with a minimal true empty state

> **Scope:** `archlucid-ui/src/components/operator-home/OperatorHomeFirstReviewEmptyState.tsx`
>
> **What and why:** When no reviews exist, `RunsDashboardPanel` renders
> `OperatorHomeFirstReviewEmptyState` inside the "Recent reviews" zone. This component currently
> repeats a full 3-step guide ("Start your first architecture review" heading + detailed step list)
> that duplicates what the hero card at the top of the page already shows.
>
> The "Recent reviews" zone should be a true empty state — minimal message, single primary CTA —
> not a second onboarding rail. Removing the duplicate reduces cognitive load and makes the
> first action unmistakable.

**Rewrite `OperatorHomeFirstReviewEmptyState.tsx`:**

Remove:
- The local `FIRST_RUN_STEPS` constant and its type annotation.
- The `<div className={OPERATOR_LAYOUT.sectionHeadingStack}>` block that renders the
  "Start your first architecture review" heading and its supporting copy paragraph.
- The `<ol>` list that renders the numbered steps.

Keep:
- The outer container `<div>` (preserve `data-testid="operator-home-first-review-empty-state"`
  and its existing Tailwind classes).
- A single short empty-state message replacing the removed heading block:
  ```tsx
  <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
    No reviews yet.
  </p>
  ```
- The CTA button row (`<div className={cn("flex flex-wrap items-center …")}>`) with all three
  existing buttons:
  1. Primary button "Start architecture review" → `/reviews/new` (already updated by Prompt 1)
  2. Outline button using `{BUYER_HOME_PRIMARY_CTA}` → showcase review href (keep as-is)
  3. Outline button "How it works" → `/help` (keep as-is)

Remove unused imports after the edit (`OPERATOR_LAYOUT.sectionHeadingStack` if no longer
referenced, and the `FIRST_RUN_STEPS` type if declared inline). Keep `ShieldCheck`, `FileSearch`,
`Button`, `Link`, `BUYER_HOME_PRIMARY_CTA`, `OPERATOR_CARD`, `OPERATOR_LAYOUT`, `cn`, and
`SHOWCASE_STATIC_DEMO_RUN_ID`.

Run `ReadLints` on `OperatorHomeFirstReviewEmptyState.tsx` after the edit to catch unused imports.

---

## Prompt 5 — Rename "Guided review workflow" to "Review guide" in buyer shell

> **Scope:** `archlucid-ui/src/lib/first-pilot-operating-rail-copy.ts`
>
> **What and why:** Inside `OperatorHomeAdvancedGuidanceSection` (collapsed by default) the buyer
> shell shows a panel titled "Guided review workflow". The label implies a more prescriptive
> session structure than the section actually delivers in a first demo context. "Review guide"
> is neutral, shorter, and consistent with the "guide" framing already used elsewhere in the UI.
>
> This is a copy-only rename scoped to the buyer shell variant. The full architect workspace label
> ("Full operating path") is unchanged.

**Changes in `first-pilot-operating-rail-copy.ts` — `BUYER_SHELL_COPY` object:**

1. `heading`: `"Guided review workflow"` → `"Review guide"`
2. `minimizedExpandLabel`: `"Show guided workflow"` → `"Show review guide"`
3. `hidePathLabel`: `"Hide workflow"` → `"Hide guide"`
4. `completeMessage`: replace `"Review workflow complete"` with `"Review guide complete"` at the
   start of the string. The rest of the sentence is unchanged.

`OPERATOR_SHELL_COPY` is not touched.

No other changes. Do not rename the section title `OPERATOR_HOME_ADVANCED_GUIDANCE_TITLE`
("Advanced guidance") — that top-level disclosure label is intentionally kept as-is.
