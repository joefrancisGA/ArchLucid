# Risk & Tradeoffs — Step 9: UI Screen

## Context

Implement the single Risk & Tradeoffs screen described in
`docs/architecture/analyzer_component.md` §0 (rev 7). This is the demo-core
screen — everything the product shows lives here.

Prerequisites: Step 8 (API routes) must be complete and TypeScript types
regenerated (`npm run generate:api-types`).

Canonical UI standard: `docs/library/UI_DESIGN_SYSTEM.md` (IBM Carbon,
Microsoft Fluent 2 shell polish, neutral gray surfaces, teal accent for
interactive only, `StatusTag`, `SeverityTag`, `EnterpriseTable`, compact spacing).

## Route

`archlucid-ui/src/app/(operator)/reviews/[reviewRunId]/risk/page.tsx`

Add nav entry in the review detail sidebar (same level as existing review tabs).
Label: **"Risk & Tradeoffs"**.

## Screen layout (demo core — implement in this exact order)

### 1. Page header

```
Review: [Review Name]                              ● [Status]

Your architecture makes [N] tradeoffs. [X] conflict[s] with what you told us.
                             ↑ only shown if X > 0
```

If X = 0: *"No conflicts found. Here are the tradeoffs your design is making."*

### 2. Conflicting tradeoffs (⚠ section — only shown if any exist)

For each `tradeoff` where `status === "Conflicting"`, render a card:

```
⚠  CONFLICT
   [explanationArchitect — the plain-language conflict statement]

   You said:  "[conflicting requirement text]"
   You built: "[mechanism label]"

   [ see reasoning ]   [ what would satisfy this ]   [ is this requirement real? ]
   [ accept risk ]     [ change requirement ]
```

- **`[ see reasoning ]`** — expands an inline evidence chain (evidence node ids +
  finding ids, linked to existing evidence detail).
- **`[ what would satisfy this ]`** — expands the `counterfactualStatement` inline.
  This is a read-only statement. No follow-up prompt, no chat. Closed-form only.
- **`[ is this requirement real? ]`** — opens a modal: "Is [requirement text]
  validated?" with Yes / No / "It's a policy requirement" buttons. On answer,
  `POST .../smells/{requirementId}/disposition`. After disposition, the smell
  badge on this conflict is removed.
- **`[ accept risk ]`** — calls `POST .../behavior-change` with
  `actionTaken: "AcceptCounterfactual"` after confirmation. Updates disposition.
- **`[ change requirement ]`** — calls `POST .../behavior-change` with
  `actionTaken: "ChangeRequirement"` after confirmation. Shows inline
  acknowledgment.

### 3. Acknowledged / unacknowledged tradeoffs

Section title: **"Tradeoffs your design is making"**

For `Acknowledged` tradeoffs:
```
•  [mechanism label]  →  [sacrificed pillar] impact     (you accepted "[intake answer label]")
```

For `Unacknowledged` tradeoffs:
```
△  [mechanism label]  →  [sacrificed pillar] impact     (unvalidated assumption)
```

Re-sortable by Consequence / Reversibility using a column header click.
Show `Consequence` and `Reversibility` as visible dimensions (badge pair on each row).

### 4. Requirement smells

Section title: **"Requirements worth confirming"** (only if smells exist)

For each `RequirementSmell` not yet dispositioned:
```
?  [rationale text]
   [ confirm it's valid ]   [ dismiss ]
```

Buttons call `POST .../smells/{requirementId}/disposition`. After disposition,
row disappears. If no undispositioned smells: section hidden.

### 5. Suggested concerns

Section title: **"Worth a look"** with sub-label: *"AI-suggested, unverified"*

For each `SuggestedConcern`:
```
◇  [statement]
   [ why we think this ]
```

- **`[ why we think this ]`** — expands `relatedFactRefs` inline.
- No action buttons (concerns are informational; no accept/dismiss in V1).
- Section hidden entirely if `concerns` array is empty.

### 6. Zero-conflict assurance statement

If no conflicts, no smells, and no unacknowledged tradeoffs:
```
✓  We checked your design against your stated intent. Nothing contradicts.
   This statement is available as a governance artifact.
   [ export ]
```

`[ export ]` triggers governance packet download (Step 10).

## Governance packet trigger

A **"Generate governance packet"** button in the page header (visible always)
calls Step 10 and downloads the PDF/HTML artifact.

## UX rules (from design doc §9)

- Two-bucket separation must be visually clear — conflicts and tradeoffs are
  grouped separately from suggested concerns. Never mix them in a single list.
- No numeric scores, percentages, or probabilities anywhere on the screen.
- `SeverityTag` for `Consequence` values (`High` = error color, `Medium` = warning,
  `Low` = info). `StatusTag` for `TradeoffStatus`.
- Plain language only — no "WAF pillar consequence classification" in any label.
- Suggested concerns section is clearly marked as lower-trust. Use a visually
  distinct, slightly de-emphasized card style relative to evidence-backed items.
- Re-sort controls show Consequence and Reversibility as separate visible
  dimensions, not a combined score.

## State management

- Fetch snapshot on mount: `GET /api/v1/reviews/{reviewRunId}/risk`.
- Optimistic update after disposition / behavior-change POST — remove the item
  from the list without a full refetch.
- Error state: if the snapshot is not yet generated, show a "Risk analysis is
  running" spinner.

## Non-goals (do not implement in this step)

- No executive dashboard or separate exec login.
- No "why not B?" chat or follow-up prompt.
- No numeric risk score, heatmap, or probability display.
- No full risk register view.

## Acceptance criteria

- Screen renders the §0 mockup faithfully against a fixture `RiskSnapshot`.
- `[ change requirement ]` and `[ accept risk ]` fire the correct POST and
  show an inline acknowledgment.
- `[ is this requirement real? ]` disposition removes the smell badge.
- Re-sort by Consequence and Reversibility works independently.
- Suggested concerns section is absent when `concerns` is empty.
- Zero-conflict assurance statement appears only when all three conditions hold.
- `npm run lint` passes; Vitest snapshot tests updated.
