# SN-STICK-01 — SecureNow return reasons

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-STICK prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_STICKINESS_COMPOSER_PROMPTS.md`

## Goal

A short internal note that names the four reasons an operator reopens SecureNow after the first review. Each reason points at work the product already tracks.

## Why

Stickiness scored **58** on the 31 October 2026 desk pass. Home already counts assigned findings, critical exposure, recent changes, and awaiting verification. Diagrams already show open subscription questions. The pilot-decision page already holds sponsor follow-ups. Nothing says those are the reasons to come back.

## Read first

- `archlucid-ui/src/components/product-line/SecureNowHomeWorkSummary.tsx`
- `docs/securenow/PILOT_DECISION_RECORD.md`
- `docs/securenow/DECISION_PATH_ONE_PAGER.md`
- `docs/securenow/CONTROLLED_PILOT_OFFER.md` (stage 5 verification and stage 6 sponsor readout only)

## What to build

1. Branch `sn-stick/01-return-reasons` from current `master`.
2. Add `docs/securenow/RETURN_REASONS.md`.
3. First line is a Scope blockquote: SecureNow return reasons. Internal operator note. Not a reminder service. Not a customer usage claim. Beta remains NO_GO.
4. One sentence under the title: reopen SecureNow when one of these four conditions is still open. Do not invent a return date.
5. A table with columns `Reason`, `What is still open`, `Where to look`. **Exactly 4 data rows:**

| Reason | What is still open | Where to look |
|---|---|---|
| Awaiting verification | A later capture has not yet confirmed or rejected the condition. | Remediation instances |
| Recent changes | A newer collection differs from the previous collection. | Snapshots and drift |
| Open questions | A diagram question still needs a human answer. | Infrastructure diagrams |
| Sponsor follow-up | A named owner still owes an objection, a decision, or a review date. | Pilot decision preparation |

6. A short section `## What this note does not do`. State that it does not send email, that it does not score engagement, that it does not claim a customer returned, and that it does not fill `PILOT_DECISION_RECORD.md`.
7. Add a README bullet under Commercial engineering that links the note and says it names four reopen reasons, not a reminder product.
8. Add the prompt-index row to the SecureNow folder-index table only if `SECURENOW_STICKINESS_COMPOSER_PROMPTS.md` is not already linked there.

## Tests

Read the new file and confirm the four reason labels, `NO_GO`, and `does not send email`. Confirm `PILOT_DECISION_RECORD.md` still contains **NOT COLLECTED**.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add a route, a Home section, an email job, or a notification preference.
- Do not edit `PILOT_DECISION_RECORD.md` or `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`.
- Do not commit.

## Done when

The note lists the four reasons, refuses email and engagement scoring, and the decision record is unchanged.
