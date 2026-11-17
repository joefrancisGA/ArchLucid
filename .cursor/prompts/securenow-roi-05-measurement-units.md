# SN-ROI-05 — Join minutes to the ROI formula

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-ROI prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ROI_COMPOSER_PROMPTS.md`

## Goal

`docs/securenow/PILOT_MEASUREMENT_LOG.md` still records minutes, and it says how a person turns those minutes into the hours the executive packet calls **B** and **A**. The three data rows stay blank.

## Why

Proof-of-ROI Readiness has the formula and a blank log. The log records minutes. The packet formula uses hours. The readout also asks for sample size, a limitation, and a selection note, and the log does not have columns for them. A later session cannot honestly multiply **B** and **A** until a person can see that join.

## Read first

- `docs/securenow/PILOT_MEASUREMENT_LOG.md`
- `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md` (formula only; do not edit it)
- `docs/securenow/SPONSOR_READOUT_OUTLINE.md` (beat 6 vocabulary; do not edit it)
- `scripts/ci/check_securenow_roi_notes.py` (do not edit it in this session)

## What to build

1. Branch `sn-roi/05-measurement-units` from current `master`.
2. Keep the status line **Status: NOT MEASURED**.
3. Keep the three data rows. Every cell in those rows stays `BLANK`.
4. Keep the existing columns. Append these three columns, in this order: `Sample size`, `Limitation`, `Selection note`.
5. Add a section `## Hours for the formula` after the table and before `## Capacity or cash`:
   - The log records minutes.
   - A person divides baseline minutes by 60 to get **B**, and pilot minutes by 60 to get **A**.
   - Write the hours only after the minutes exist.
   - Until then the hour line stays **BLANK**.
   - This log does not divide a blank row.
6. Do not write an example quotient, a currency amount, or a customer name.

## Tests

Read the file. Confirm `NOT MEASURED`, `Hours for the formula`, `Sample size`, `Limitation`, `Selection note`, three `BLANK` rows, and no `$`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`, `ROI_COST_INPUT.md`, `ROI_FIXTURE_WORKSHEET.md`, or `PRIVATE_PRICE_SHEET.md`.
- Do not fill a minute, an hour, a sample size, or an outcome.
- Do not commit.

## Done when

The measurement log still has three blank rows, names the three honesty columns, and tells a person to divide minutes by 60 only after the minutes exist.
