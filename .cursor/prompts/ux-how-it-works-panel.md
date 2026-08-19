# UX: One-Screen "How It Works / What Leaves Your Tenant" Panel

## Goal
Build an in-product, presenter-openable panel that answers the CTO's top security question — "what does this system actually do with our architecture data?" — without leaving the demo or opening a browser tab.

## Context
- This is the #1 security objection in a CTO demo. Currently the answer lives only in external docs.
- The panel must be accurate and verifiable, not marketing copy.
- Key files:
  - `archlucid-ui/src/components/BuyerCtoDemoTourOverlay.tsx` — add trigger button here
  - `archlucid-ui/src/app/(operator)/help/[topic]/page.tsx` — existing help topic renderer
  - `archlucid-ui/src/lib/product-documentation-registry.ts` — add a new help topic registration
  - `archlucid-ui/src/components/ui/` — dialog, button primitives available

## What to build

### 1. New help topic: `how-it-works`
Register `"how-it-works"` in `product-documentation-registry.ts`. The markdown content (see below) renders via the existing `HelpTopicMarkdownView`. Route: `/help/how-it-works`.

Markdown content to include:
- **What ArchLucid does:** takes your architecture brief (text/diagram), applies policy packs, produces a signed architecture package. No code execution. No write access to your systems.
- **What leaves your tenant:** the architecture brief text and any evidence context you provide is sent to Azure OpenAI (your tenant's deployment if configured). No source code, secrets, or credentials are sent.
- **What stays in your tenant:** all findings, decisions, manifests, audit logs, and governance approvals are stored in your ArchLucid tenant database. ArchLucid does not retain copies.
- **Isolation:** each tenant has a dedicated database. No cross-tenant data access is possible by design (append-only audit log; database-per-tenant isolation).
- **Audit trail:** every AI inference that contributed to a finding is recorded in the append-only audit log — you can see exactly what input produced each output.
- **Data portability:** download a signed export ZIP at any time from the run detail page — you own everything.

Do NOT use marketing superlatives. Use plain factual statements. Include one sentence caveat where relevant (e.g., "review the Azure OpenAI data processing agreement for inference data retention").

### 2. `CtoDemoHowItWorksTrigger` component
New component `archlucid-ui/src/components/cto-demo/CtoDemoHowItWorksTrigger.tsx`:
- Renders a `<Button variant="ghost" size="sm">` labeled `"How it works"` with a shield icon.
- On click: opens a `<Dialog>` (using existing Radix Dialog primitive) that renders the `how-it-works` help topic inline — do NOT navigate away.
- The dialog title: `"What ArchLucid does with your data"`.
- Dialog max-width: `max-w-2xl`, scrollable content.

### 3. Wire into `BuyerCtoDemoTourOverlay`
In the control strip of `BuyerCtoDemoTourOverlay.tsx` (the row with Compact / Collapse / Explore buttons):
- Add `<CtoDemoHowItWorksTrigger />` as a ghost button.
- Visible in all steps, not just step 0.

### 4. Wire into executive landing (Step 1)
In `archlucid-ui/src/components/executive/CtoDemoExecutiveAboveFold.tsx` (or wherever the executive step above-fold CTA strip is):
- Add a secondary link: `"How we handle your data →"` that opens the same dialog.

## Acceptance criteria
- The panel opens as a dialog without page navigation.
- The content matches the factual points above — no unsupported marketing claims.
- The dialog is keyboard-navigable and has a visible close button.
- The trigger appears in the tour overlay on all five steps.
- A unit test confirms the dialog renders with the expected headings.
- `/help/how-it-works` route also works standalone (for external sharing).

## Constraints
- Use the existing Radix `@radix-ui/react-dialog` already in `package.json`.
- Do not add new dependencies.
- Content must survive a legal/security review — use hedged, factual language. No "never", "impossible", "100%."
