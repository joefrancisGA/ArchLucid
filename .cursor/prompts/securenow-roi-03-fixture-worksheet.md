# SN-ROI-03 — SecureNow ROI fixture worksheet

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-ROI prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ROI_COMPOSER_PROMPTS.md`

## Goal

One worked arithmetic example of the SecureNow ROI formula, on made-up inputs, labeled **FIXTURE** on every result. The executive proof packet stays empty.

## Why

A formula with five **NOT COLLECTED** inputs is hard to read. ArchLucid’s ROI model includes a worked example. SecureNow must not reuse that example. A small fixture shows the arithmetic, including a case where the hour delta does not cover **C**.

## Read first

- `docs/securenow/EXECUTIVE_PROOF_PACKET_TEMPLATE.md` (formula only; do not edit)
- `docs/securenow/PILOT_MEASUREMENT_LOG.md`
- `docs/securenow/ROI_COST_INPUT.md`
- `docs/securenow/SYNTHETIC_DEMO_CONTRACT.md` (so you do not put ROI into the synthetic demo)

## What to build

1. Branch `sn-roi/03-fixture-worksheet` from current `master` after SN-ROI-01 and SN-ROI-02 are present.
2. Add `docs/securenow/ROI_FIXTURE_WORKSHEET.md`.
3. First line is a Scope blockquote: SecureNow ROI fixture worksheet. Made-up inputs. Not a customer result. Not an approved offer. Beta remains NO_GO.
4. One sentence under the title: every number below is a **FIXTURE**. Do not paste it into a sponsor packet.
5. Use only these inputs, each labeled **FIXTURE**:
    - **B** = 3 hours
    - **A** = 2 hours
    - **N** = 20 investigations
    - **R** = 100 currency units per hour
    - **C** = 10000 currency units
6. Show the formula from the executive template and these results, each labeled **FIXTURE**:
    - Gross annual analyst capacity value = 2000
    - Net annual value estimate = -8000
    - ROI ratio = -0.8
7. One sentence after the results: a one-hour reduction on this fixture does not cover **C**. The honest result is a negative net value, not a savings claim.
8. A short section `## What this worksheet is not`. State that it is not a customer result, that the inputs are not the private quote, that path counts were not converted into money, and that `EXECUTIVE_PROOF_PACKET_TEMPLATE.md` stays **ROI not calculated**.
9. Add one README bullet that links the worksheet and says it is fixture arithmetic, not a customer result.

## Tests

Confirm `EXECUTIVE_PROOF_PACKET_TEMPLATE.md` still contains **ROI not calculated** and at least five **NOT COLLECTED** labels. Confirm the new file contains **FIXTURE** and **-8000**.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`.
- Do not edit `scripts/ci/audit_securenow_synthetic_demo.py` or any synthetic demo JSON.
- Do not copy a figure from `docs/go-to-market/ROI_MODEL.md` or a fee from `PRIVATE_PRICE_SHEET.md`.
- Do not use a `$` character.
- Do not commit.

## Done when

The worksheet shows the negative fixture result, and the executive proof packet still says ROI is not calculated.
