# SN-FQ-04 — Lock the SecureNow findings screenshot

**Wave:** SecureNow findings queue (**SN-FQ**). **Depends on:** SN-FQ-01, SN-FQ-02, SN-FQ-03. **Branch:** `cursor/sn-fq-screenshot-ratchet`

## Goal

One test locks the 2026-09-24 failure: Security, Working mode, `/compliance/findings?architectureId=customer-intake` must not render the architecture desk. Architecture nested findings must still render the inhabited document.

## Read first

- `docs/architecture/SECURENOW_FINDINGS_QUEUE_COMPOSER_PROMPTS.md`
- `archlucid-ui/src/app/(operator)/governance/findings/GovernanceFindingsQueueClient.securenow-compliance.test.tsx`

## What to build

1. Extend or add a Vitest next to that SecureNow compliance test. Render `GovernanceFindingsQueueClient` with `productLine: "security"`, `isWorkingMode: true`, pathname `/compliance/findings`, and search `architectureId=customer-intake`. Registers resolve empty. Assert the document text does **not** contain:
   - `Afternoon document for this architecture`
   - `You inhabit this architecture on the desk`
   - `Open architecture desk`
   - `live Working recovery`
   - `Insight density demotes low-signal engines`
   - `Could not load changes since last seal`
   - `Track architecture risks`
   - `approved architecture reviews`
2. Assert the title is **Findings**, not **Architecture**, and the SecureNow subtitle from `SECURENOW_FINDINGS_HELP_PAGE_SUBTITLE` is present.
3. Assert `getArchitectureSealDelta` is not called.
4. A second case, or the existing inhabit presentation test, still expects the inhabited subtitle on Architecture pathname `/architecture/architectures/{guid}/findings` in Working mode.
5. Do not snapshot the whole page.

## Do not

- Change production behavior unless a ratchet fails because SN-FQ-01–03 left a named string. Then fix only that string’s Security branch.
- Add a Playwright run or a dev server.

## Done when

The Security render fails if any listed desk sentence returns, and the Architecture nested findings case still inhabits.
