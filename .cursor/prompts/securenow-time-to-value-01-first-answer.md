# SN-TTV-01 — Name the first useful answer

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-TTV prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE66_COMPOSER_PROMPTS.md`

## Goal

A short note that says when a SecureNow review has produced its first useful answer. The answer is three facts already visible in the product. It is not a duration.

## Why

Time-to-Value is **66** (weight 7). `docs/securenow/FIRST_HOUR.md` stops the operator before verification, and it never says which visible facts count as the first useful answer. There is no earlier SN-TTV paste set.

## Read first

- `docs/securenow/FIRST_HOUR.md`
- `archlucid-ui/src/lib/product-line/securenow-first-hour-copy.ts`
- `docs/securenow/COGNITIVE_LOAD_TERMINOLOGY.md` (nouns only; do not edit it)

## What to build

1. Branch `sn-ttv/01-first-answer` from current `master`.
2. Add `docs/securenow/FIRST_USEFUL_ANSWER.md`.
3. First line is a Scope blockquote: the first useful SecureNow answer. Not a timer. Not a minutes claim. Include the exact sentence `This is not a timed SLA.` Not customer evidence. Beta remains **NO_GO**.
4. One sentence under the title: the first useful answer is present when collection status, one ranked path in Path inspect, and one review question on Diagrams are all visible. A missing or stale capture still counts as collection status.
5. A table with columns `Fact`, `Where`, `Honest limit`. **Exactly 3 data rows:**
    - Collection status — SecureNow Home environment line and [`/integrations/cloud-connections`](/integrations/cloud-connections) — a missing or stale capture is a gap, not a clean bill of health.
    - One ranked path — [`/security/remediation-factory`](/security/remediation-factory), then Path inspect — a ranked path is not proof of an exploit. SecureNow does not change Azure.
    - Review question — the question queue on [`/infrastructure/diagrams`](/infrastructure/diagrams) — an open question is not sponsor packaging and not verification.
6. A section `## What this note does not do`. State that it does not time the review, does not run the **M-90** cohort, does not time **M-308**, and does not fill `EXECUTIVE_PROOF_PACKET_TEMPLATE.md`.
7. Link [`FIRST_HOUR.md`](FIRST_HOUR.md).

## Tests

No UI test in this session. Read the new file and confirm it contains `NO_GO`, `Path inspect`, `/infrastructure/diagrams`, and `/security/remediation-factory`, and that it contains no phrase `minutes to value`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add a clock, a wizard, or a new route.
- Do not commit.

## Done when

`docs/securenow/FIRST_USEFUL_ANSWER.md` names the three facts, keeps a gap visible as status, and does not state a duration.
