# SN-IT-03 — Infrastructure spine copy modules

**Wave:** SecureNow Azure inventory terminology (**SN-IT**). **Depends on:** SN-IT-01.

## Goal

Align SecureNow infrastructure hub, resource explorer, diagrams, diagram-reconcile, extract-upload, and nav reshape copy with **Azure inventory capture** terminology (lead with **Azure inventory** where space allows).

## Read first

- `archlucid-ui/src/lib/product-line/securenow-infrastructure-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-nav-reshape.ts`
- Related governance infrastructure page leads under `archlucid-ui/src/lib/governance/`
- `.cursor/prompts/securenow-help-10-infrastructure-overview.md` (reference only)

## What to build

1. Replace bare **snapshot** / **inventory snapshots** phrases in SecureNow infrastructure copy modules with helper constants from SN-IT-01.
2. Prefer **Azure inventory capture** in hub summaries; use **inventory capture** only when the sentence already names Azure.
3. Update matching Vitest files (`securenow-infrastructure-*-route.test.ts`, nav tests) for locked strings.

## Do not

- Change route paths or `snapshotId` query param names in URLs.
- Rewrite Architecture infrastructure copy without a `product-line` branch.

## Done when

SecureNow infrastructure spine strings consistently say Azure inventory capture; no new bare **snapshot** on listed modules.
