# SN-SELF-01 — SecureNow stuck-state note

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-SELF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SELF_SUFFICIENCY_COMPOSER_PROMPTS.md`

## Goal

`docs/securenow/SELF_SERVICE.md` tells a SecureNow operator what to check before emailing. Four situations. The email address is the existing ArchLucid mailbox. The note does not download a diagnostics ZIP and does not open the ArchLucid support page.

## Why

Customer Self-Sufficiency is **62** (weight 1) on the 31 October 2026 desk pass. ArchLucid’s in-product support page is `/administration/support`, and the product-line catalog keeps that path on the architecture line only. A SecureNow operator who is stuck has founder email and no ordered checks. This note is those checks.

## Read first

- `docs/securenow/FIRST_HOUR.md` (vocabulary only; do not edit it)
- `docs/securenow/SUPPORT_COMMITMENT.md` (mailbox and non-SLA posture; do not edit it)
- `docs/securenow/ENGINEER_ANALYST_HANDOFF.md` (not-verified meaning; do not edit it)
- `archlucid-ui/src/lib/product-line/product-line-catalog.ts` (confirm `/administration/support` stays `architecture`)

## What to build

1. Branch `sn-self/01-stuck-note` from current `master`.
2. Add `docs/securenow/SELF_SERVICE.md`.
3. First line is a scope line: internal operator note, not a support SLA, not a diagnostics package, beta remains **NO_GO**.
4. Heading: `SecureNow when you are stuck`.
5. One lead sentence: check these four situations before you email. A missing capture is a gap, not a clean bill of health.
6. A table with these four rows, in this order:

| Situation | What it means | Where |
| --- | --- | --- |
| Collection missing or stale | A gap is a coverage limitation. It is not proof the environment is clean. | `/integrations/cloud-connections` |
| Connector will not finish | Read the connector status. A failed connector is not a completed capture. | `/administration/connection-status` |
| No ranked path, or not verified | An empty ranking is not proof you are secure. **Not verified** means a later capture, your attestation, completed analysis, or the postcondition is missing. SecureNow does not change Azure. | `/security/remediation-factory` and `/security/remediation-instances` |
| Still stuck | Email `support@archlucid.net` with subject `SecureNow`. Include tenant, workspace, subscription, collection time, and path id when you have one. Do not paste secrets, tokens, or connection strings. | `mailto:support@archlucid.net?subject=SecureNow` |

7. A short closing paragraph: this note does not promise a timed response, a hired rotation, or a fix applied by SecureNow. Acknowledgement targets stay in `SUPPORT_COMMITMENT.md`.
8. Add one bullet to `docs/securenow/README.md` under the existing support-commitment bullet: this note is the operator check before email. It is not a support SLA and not the ArchLucid support bundle.

## Tests

No UI test in this session. Read the new file and confirm it contains `NO_GO`, the four situation titles, both in-product paths for the third row, the mailto, and no `$`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `SUPPORT_COMMITMENT.md`, `PRIVATE_PRICE_SHEET.md`, or `CONTROLLED_PILOT_OFFER.md`.
- Do not assign `/administration/support` to the security product line.
- Do not add a new mailbox.
- Do not commit.

## Done when

`docs/securenow/SELF_SERVICE.md` lists the four situations and points email at `support@archlucid.net`.
