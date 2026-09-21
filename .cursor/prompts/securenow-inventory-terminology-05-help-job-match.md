# SN-IT-05 — Help + Category-1 inventory capture wording

**Wave:** SecureNow Azure inventory terminology (**SN-IT**). **Depends on:** SN-IT-01.

## Goal

Within Security-shell help that already job-matches infrastructure pages, replace **snapshot compare** teaching with **Azure inventory capture** language. Complements **SH-26** (Azure-only account wording) without reopening full SH rewrites.

## Read first

- `archlucid-ui/src/lib/governance/governance-infrastructure-drift-help-guide-content.ts`
- `archlucid-ui/src/lib/governance/governance-infrastructure-drift-help-evidence-copy.ts`
- `archlucid-ui/src/lib/governance/governance-infrastructure-drift-rows.ts` (if present)
- Help articles under `archlucid-ui/src/app/(operator)/help/` for `governance-infrastructure-drift` topic
- `.cursor/prompts/securenow-help-26-infrastructure-drift.md`

## What to build

1. Category-1 rows for drift + infrastructure overview: what/next/empty/configure fields use **Azure inventory capture**; diff pair = baseline vs compare capture.
2. `/help/governance-infrastructure-drift` body: same terminology; keep assessment **snapshot** only where describing audit export IDs.
3. Vitest on contextual help entries and help topic tests.

## Do not

- Point Learn more at architecture-review topics.
- Rename help slug paths.

## Done when

Drift help drawer and article no longer teach bare snapshot compare for inventory drift.
