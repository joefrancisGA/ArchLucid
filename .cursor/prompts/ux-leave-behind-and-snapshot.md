# UX: Prospect Leave-Behind PDF + Shareable Read-Only Snapshot

## Goal
At the end of the 30-minute demo, give the CTO something to circulate internally: (1) a branded one-page recap PDF they can forward to their board and (2) a shareable read-only link to exactly what was shown that their architect can poke at.

## Context
- The demo closes at Step 5 (Audit trail) with `CtoDemoRecapCard` and `CtoDemoAuditClosingBeat`. These are the right surfaces to extend.
- `jspdf` and `html2canvas` are already in `package.json` — use them, no new PDF libraries.
- Existing files:
  - `archlucid-ui/src/components/cto-demo/CtoDemoRecapCard.tsx`
  - `archlucid-ui/src/components/cto-demo/CtoDemoAuditClosingBeat.tsx`
  - `archlucid-ui/src/components/cto-demo/CtoDemoAuditIntegrityExportButton.tsx` — existing export button (extend, don't replace)
  - `archlucid-ui/src/lib/buyer-cto-demo-recap.ts` — recap data helpers
  - `archlucid-ui/src/app/(marketing)/showcase/[runId]/page.tsx` — anonymous read-only showcase route (this is the snapshot mechanism)

## What to build

### 1. `CtoDemoLeaveBehindExportButton` component
New component `archlucid-ui/src/components/cto-demo/CtoDemoLeaveBehindExportButton.tsx`:

- Button label: `"Download recap (PDF)"`, with a `Download` icon.
- On click: generates a one-page PDF using `jspdf` + `html2canvas`.

The PDF must include:
- ArchLucid product name (no logo raster required — use text).
- Review package name: "Claims Intake Modernization".
- Verdict: "Signed and committed" with date.
- Top 3 findings (severity + plain-English title — from `CtoDemoRecapCard` data).
- Top 3 decisions / governance approvals.
- Audit trail event count and date range.
- One-line trust statement: "All findings are derived from policy packs applied to your architecture brief. Audit log is append-only."
- Footer: "Generated from ArchLucid showcase · archlucid.com" + today's date.

Implementation notes:
- Render a hidden `<div id="cto-demo-leave-behind-print-target">` containing the above layout using Tailwind classes.
- Use `html2canvas` to raster it, then `jspdf` to embed the canvas as a page.
- Set PDF filename: `ArchLucid-Claims-Intake-Review-{YYYY-MM-DD}.pdf`.
- Show a loading state on the button while generating ("Generating…").
- Show a toast (using existing `sonner`) on success: "PDF downloaded."

### 2. `CtoDemoShareSnapshotButton` component
New component `archlucid-ui/src/components/cto-demo/CtoDemoShareSnapshotButton.tsx`:

- Button label: `"Share read-only view"`, with a `Share2` icon (Lucide, already in dependencies).
- On click: copies to clipboard the URL `/showcase/claims-intake-modernization` (the existing anonymous read-only marketing showcase route). Use `navigator.clipboard.writeText(url)`.
- Show a toast: "Link copied — anyone with this link can view the showcase."
- The URL must be absolute: prepend `window.location.origin`.

If the current host is `localhost`, prepend a note in the toast: "Note: this link only works on localhost in your current session. Use the hosted demo URL for sharing."

### 3. Wire into `CtoDemoRecapCard`
In `CtoDemoRecapCard.tsx`, add both buttons in a `flex gap-2 flex-wrap` row below the existing recap content:

```tsx
<CtoDemoLeaveBehindExportButton />
<CtoDemoShareSnapshotButton />
```

Also add them to `CtoDemoAuditClosingBeat.tsx` (Step 5 closing beat) as secondary CTAs.

### 4. Wire into tour overlay Step 5
In `BuyerCtoDemoTourOverlay.tsx`, the `navigation.stepIndex === 4` block already renders `<CtoDemoRecapCard />`. No change needed — the buttons will appear via the card.

## Acceptance criteria
- Clicking "Download recap (PDF)" generates and downloads a PDF with all required fields.
- The PDF filename matches the `ArchLucid-Claims-Intake-Review-{date}` pattern.
- Clicking "Share read-only view" copies an absolute URL to clipboard and shows a toast.
- Both buttons render at Step 5 of the tour inside `CtoDemoRecapCard`.
- Unit tests: `CtoDemoShareSnapshotButton` copies the correct URL format. `CtoDemoLeaveBehindExportButton` calls `html2canvas` and `jspdf` (mock both in tests).
- The PDF generation must not block the main thread for more than 300ms (use async/await already provided by both libraries).

## Constraints
- Do not add new npm dependencies (use existing `jspdf`, `html2canvas`, `sonner`, `lucide-react`).
- The hidden print target div must have `aria-hidden="true"` and `className="sr-only"` while not printing.
- No hardcoded prospect name — the PDF says "Claims Intake Modernization" (the showcase run label).
