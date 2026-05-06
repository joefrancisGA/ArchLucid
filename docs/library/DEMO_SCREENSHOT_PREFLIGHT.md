# Demo Screenshot Preflight Checklist

Before capturing any buyer-facing screenshots or producing a demo video, verify **every item** below.
A single failing item can produce a screenshot that contradicts the product story.

## Environment flags (must be set before starting the browser)

| Variable | Required value | Purpose |
|---|---|---|
| `NEXT_PUBLIC_DEMO_MODE` | `true` | Hides internal chrome (sidebar layout, preset shaping, show-all-features buttons) |
| `NEXT_PUBLIC_BUYER_POLISHED_SHELL` | `true` | Hides technical labels, suppresses debug copy, polishes scope switcher |

Both flags together activate `isBuyerPolishedOperatorShellEnv()` and all associated guards.

## Static demo data spine

These IDs must resolve. If any are missing, the corresponding page will show an error or empty state.

| Resource | Expected ID / value |
|---|---|
| Sample run | `claims-intake-modernization` |
| Sample manifest | `a1c2e3f4-a5b6-7890-abcd-ef1234567890` |
| Primary PHI finding | `phi-minimization-risk` |
| Graph (provenance-full) | 6 nodes / 5 edges visible after auto-load |

## Per-route checklist

### Home (`/`)

- [ ] `SampleFirstReviewPackageCard` shows "Claims Intake Modernization Review" with 9 findings / 12 decisions
- [ ] `RunsDashboardPanel` "Latest in workspace" shows the Claims Intake sample row (not the empty state)
- [ ] `ValueRealizationDashboard` shows no `NaN`, no `~$0` — if metrics are zero, the ROI block is hidden
- [ ] `OperatorNextActionsCard` shows a skeleton or nothing — no "Loading…" text

### Reviews (`/reviews`)

- [ ] Claims Intake Modernization sample row is visible
- [ ] Row description is "Claims Intake Modernization Review" (not a raw run ID)

### Review detail (`/reviews/claims-intake-modernization`)

- [ ] Page loads the static demo payload (manifest summary, artifacts, timeline)
- [ ] If the review detail fails, the error page shows "Sample review unavailable" and "Open sample manifest" as primary CTA — not "Retry" or "This architecture review could not be loaded"

### Manifest (`/manifests/a1c2e3f4-a5b6-7890-abcd-ef1234567890`)

- [ ] Manifest page renders the Claims Intake summary
- [ ] Artifact table shows clean labels: "Sponsor Brief", "Decision Record", "System Diagram" — no MIME type strings visible
- [ ] Format column shows "Markdown", "JSON", "Plain text" — not `text/markdown`, `application/json`

### Graph (`/graph`)

- [ ] Graph auto-loads the Claims Intake provenance graph on page open
- [ ] Canvas renders SVG/canvas nodes — wait for `data-testid="graph-canvas-ready"` before screenshot
- [ ] Page title shows "Claims Intake Evidence Graph" in the idle legend
- [ ] No "Refresh graph" button visible after auto-load

### Ask (`/ask`)

- [ ] Conversation list shows "Sample conversation" labels — no raw "Jan 14, 2026" dates
- [ ] Prompt chips populate the text box on click
- [ ] "Compare against another review" section is hidden

### Governance (`/governance`)

- [ ] Page shows the workflow for `claims-intake-modernization` by name (not raw ID)
- [ ] Workflow language reads "Submit → Approve → Promote" (not "activate")
- [ ] If user cannot submit, the permission note is soft ("does not have submission rights")
- [ ] No "Load a run" language — should be "Load a review"
- [ ] "Advanced options" accordion is collapsed by default

### Governance Findings (`/governance/findings`)

- [ ] PHI minimization risk finding row is visible
- [ ] No "No findings in queue yet" empty state (findings come from static spine)

### Audit (`/audit`)

- [ ] Correlation ID field is inside "Advanced filters" collapsible — not in the default form
- [ ] CSV export section is hidden if there are zero events
- [ ] No "200 rows per request" or "role-gated on the API" copy visible

### Alerts (`/alerts`)

- [ ] Only the "Inbox" tab is visible — Rules, Routing, Composite, and Simulation tabs are hidden
- [ ] No keyboard shortcut hints visible in the main content area

### Scope switcher (top bar)

- [ ] Shows workspace name only — no "W: Workspace / P: Default" fixture-state labels

## Screenshot timing guidance

- For the graph page: wait for `[data-testid="graph-canvas-ready"]` to appear in the DOM before snapping.
- For pages with API calls: wait for the loading spinner to disappear (or for `[role="status"]` text to settle) before capturing.
- Playwright example: `await page.waitForSelector('[data-testid="graph-canvas-ready"]');`

## When something is missing

1. Check that both env flags above are set.
2. Confirm the static demo spine constants in `src/lib/showcase-static-demo.ts` match the values expected by any API seed script.
3. If the API is seeded, the static fallback won't fire — verify `NEXT_PUBLIC_DEMO_STATIC_OPERATOR=true` or `NEXT_PUBLIC_DEMO_MODE=true` to force static payloads.
