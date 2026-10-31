# SN-MKT-03 — Six-beat fixture storyboard

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-MKT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md`

## Goal

A facilitator can walk a buyer through six beats without improvising a customer result. Each beat names the screen, what to point at, the sentence to say, and the sentence not to say. The storage-account example stays labeled as an invented fixture.

## Why

`docs/securenow/BUYER_PROOF_DEMO.md` already has the six beats and the refusal list. It is an internal script. A storyboard puts the same beats in the order a person would show them, with the live screen names, so a conversation does not turn a fixture into a breach story.

## Read first

- `docs/securenow/BUYER_PROOF_DEMO.md`
- `archlucid-ui/src/lib/product-line/securenow-nav-labels.ts`
- `archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts`
- `docs/securenow/README.md` (add one link under Commercial engineering)

## What to build

1. Branch `sn-mkt/03-fixture-storyboard` from current `master`.
2. Create `docs/securenow/FIXTURE_STORYBOARD.md`.
3. Line 1 is a scope blockquote: `> **Scope:** Facilitator storyboard for a SecureNow fixture demo. Not customer evidence, not a production validation, and not approved buyer communication.`
4. Under the title, one sentence: "Every beat below is a fixture. Substitute a real capture before any sponsor claim."
5. Six beats, in this order, each with **Screen**, **Point at**, **Say**, and **Do not say**:

| Beat | Screen |
|---|---|
| 1. Scope and freshness | SecureNow Home |
| 2. Find and inspect | Priorities & waves, then Path inspect |
| 3. Advisory cut point | Path inspect |
| 4. Engineer action | Remediation tracker |
| 5. Verify or fail honestly | Remediation tracker, later capture |
| 6. Audit trail | Audit evidence |

6. Beat 4 says the engineer changes Azure outside SecureNow. Beat 5 allows the outcome "not verified" when the later capture, the attestation, or the postcondition is missing.
7. Include the invented storage-account example from the buyer demo as its own short section titled "Invented fixture". Say that no live system is changed and that an incomplete capture is not closure.
8. Close with the same refusals as the buyer demo: no breach prevention, no observed exploit, no compliance certification, no autonomous Azure change, no guaranteed savings, no claim that the fixture proves production detection.
9. In `docs/securenow/README.md`, under Commercial engineering, add one bullet linking `FIXTURE_STORYBOARD.md` and stating that it is a fixture script, not customer traction.

## Tests

No UI test. After writing, confirm the file contains "fixture", "not verified", "outside SecureNow", and "Not customer evidence". Confirm it contains no `$` and no SKU id (`SN-EVAL`, `SN-ANNUAL`, `SN-SUB-ADD`, `SN-SNAP-4`).

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Do not generate screenshots, and do not embed images.
- Do not edit `BUYER_PROOF_DEMO.md`, the pilot checklist, the private quote sheet, or the support commitment.
- Do not add a route.
- Do not commit.

## Done when

A facilitator can read `FIXTURE_STORYBOARD.md` aloud through six beats, and the invented storage account cannot be mistaken for a customer outcome.
