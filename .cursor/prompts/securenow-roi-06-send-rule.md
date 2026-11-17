# SN-ROI-06 — Investigation-effort send rule

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-ROI prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ROI_COMPOSER_PROMPTS.md`

## Goal

`docs/securenow/ROI_SEND_RULE.md` states when a person may share a quantified investigation-effort figure. The file does not contain that figure.

## Why

The fixture worksheet shows arithmetic on made-up inputs. The executive packet says **ROI not calculated**. Nothing tells a sponsor which gates have to pass before a number leaves the room. ArchLucid’s send rule is a different product. This file is the SecureNow gate.

## Read first

- `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md` (release claim gate; do not edit it)
- `docs/securenow/PILOT_MEASUREMENT_LOG.md` (do not edit it)
- `docs/securenow/ROI_COST_INPUT.md` (do not edit it)
- `docs/securenow/ROI_FIXTURE_WORKSHEET.md` (do not edit it)
- `docs/securenow/PRIVATE_PRICE_SHEET.md` (do not open it; do not copy it)

## What to build

1. Branch `sn-roi/06-send-rule` from current `master` after SN-ROI-05 is present.
2. Add `docs/securenow/ROI_SEND_RULE.md`.
3. First line is a scope line: when a quantified investigation-effort figure may be shared. Not a savings claim. Not an approved offer. Beta remains **NO_GO**.
4. Heading: `SecureNow investigation-effort send rule`.
5. One lead sentence: a person may share a quantified effort figure only when every gate below is true. Otherwise the figure stays internal.
6. A numbered list of these gates, as sentences, with no markdown checkboxes:
   - **B** and **A** were written by a person from real, non-synthetic comparable investigations. The tasks share the same question, the same Azure scope, and the same definition of done. Minutes were divided by 60 only after the minutes existed. Synthetic fixture rehearsal timings, including those recorded in the measurement log, remain internal and do not satisfy this gate.
   - **N** is the sponsor’s count of those investigations for a year. **N** is not a path count.
   - **R** is the sponsor’s fully loaded hourly rate. SecureNow does not supply a default rate.
   - **C** includes the owner-approved private quote and a collected customer operating cost. When operating cost is **NOT COLLECTED**, or the sponsor declined to give it, **C** is not ready and the figure stays internal.
   - `ROI_FIXTURE_WORKSHEET.md` is not the source. That worksheet stays labeled **FIXTURE**.
   - The sponsor approved the figure for this audience.
   - `EXECUTIVE_PROOF_PACKET_TEMPLATE.md` stays **ROI not calculated** until a person fills a private copy from these inputs. This rule does not fill the packet.
7. A closing paragraph: do not convert a removed path, a finding count, or an avoided breach into money. Do not copy a fee amount out of `PRIVATE_PRICE_SHEET.md`. Do not reuse a percent from `docs/go-to-market/ROI_MODEL.md`.
8. Add one README bullet under the ROI fixture worksheet bullet. Say this file is the gate for sharing a quantified effort figure. It is not a calculated ROI and not a public price.

## Tests

Read the new file. Confirm `NO_GO`, `NOT COLLECTED`, `FIXTURE`, `ROI not calculated`, `sponsor approved`, and no `$`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit the executive packet, the measurement log, the cost card, the fixture worksheet, or the private price sheet.
- Do not add a `$`, a fee, or a checked box.
- Do not commit.

## Done when

`ROI_SEND_RULE.md` lists the gates and does not itself contain an effort figure or a fee.
