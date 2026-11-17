# SN-ROI-01 — SecureNow pilot measurement log

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-ROI prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ROI_COMPOSER_PROMPTS.md`

## Goal

A blank log a sponsor can fill during a controlled pilot. Each row is one comparable investigation. The log records minutes. It does not calculate ROI.

## Why

Proof-of-ROI Readiness scored **49** for SecureNow on the 30 October 2026 desk pass. ArchLucid scored **88**. SecureNow already has the formula in `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md`, and every input is **NOT COLLECTED**. The pilot offer already says to time comparable investigations and not invent ROI. The missing piece is the form.

## Read first

- `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md` (ROI worksheet only; do not edit)
- `docs/securenow/CONTROLLED_PILOT_OFFER.md` (investigation-effort row and the “How much will it save?” answer)
- `docs/securenow/FIXTURE_STORYBOARD.md` (claims we must not make)

## What to build

1. Branch `sn-roi/01-measurement-log` from current `master`.
2. Add `docs/securenow/PILOT_MEASUREMENT_LOG.md`.
3. First line is a Scope blockquote: SecureNow pilot measurement log. Blank instrument. Not a customer ROI result. Not an approved offer. Beta remains NO_GO.
4. One sentence under the title: time one comparable investigation per row. Leave the row blank until a person records the minutes.
5. A short section `## What counts as comparable`. State that the before and after tasks share the same question, the same Azure scope, and the same definition of done. A removed path is not a minute.
6. A table with columns `Task`, `Scope`, `Timer`, `Baseline minutes (B)`, `Pilot minutes (A)`, `Sample note`, `Capacity or cash`. **Exactly 3 data rows.** Every cell in those rows is `BLANK`. Above the table, one line: **Status: NOT MEASURED**.
7. A short section `## Capacity or cash`. Say capacity means analyst time still on payroll, and cash means a cost the sponsor can show was not spent. The timer chooses one label per row.
8. A short section `## What this log does not do`. State that it does not fill `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`, that it does not convert a path count into dollars, and that it does not claim avoided breaches.
9. Add a README bullet under Commercial engineering that links the log and says it is a blank timing instrument, not a savings claim.

## Tests

Read the new file and confirm three `BLANK` rows and the line **NOT MEASURED**. Confirm `EXECUTIVE_PROOF_PACKET_TEMPLATE.md` still says **ROI not calculated**.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`.
- Do not copy figures from `docs/go-to-market/ROI_MODEL.md`.
- Do not add a product route or a time field in the UI.
- Do not commit.

## Done when

The log has three blank rows, says **NOT MEASURED**, and the executive proof packet is unchanged.
