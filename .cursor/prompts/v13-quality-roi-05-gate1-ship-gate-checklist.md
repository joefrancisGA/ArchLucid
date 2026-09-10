# V13-05 — Gate 1: first-review create→commit evidence (owner executes)

**One prompt per chat.** Branch: `cursor/v13-05-gate1-ship-gate-checklist-97a4` **only if** the CLI path is broken. If the CLI already works, **do not** open a coding PR — execute the runbook and paste the `--run-id` into `docs/assessments/LATEST_GPT55.md`. Model: **Composer 2.5 slow**.

---

## Goal

Turn Gate 1 from **UNKNOWN** to **PASS** using a **real** `archlucid pilot ship-gate-evidence --run-id <guid>` on a tenant the operator owns. **Do not** write a synthetic PASS into the assessment.

## Why this is fifth (token ROI)

v13 Gate 1 is **UNKNOWN** (owner-executed). Coding agents **cannot** mint a tenant. Expected if the run is green: **TTV 83→85**, **Runtime 81→83** after 01–04, **(A) → ~85.29%**, Gate 1 **UNKNOWN→PASS**. If the CLI is broken, this prompt is the **coding** half (fix the CLI, then stop). See `docs/architecture/V13_QUALITY_ROI_COMPOSER_PROMPTS.md`.

## Context

- Runbook (do **not** rewrite from scratch): `docs/engineering/GATE1_SHIP_GATE_EVIDENCE_RUNBOOK.md`.
- Assessment: `docs/assessments/LATEST_GPT55.md` Gate 1.
- Predecessor: `.cursor/prompts/v12-quality-roi-04-gate1-ship-gate-checklist.md`.

## What to build (coding agent, only if CLI is broken)

1. Verify `archlucid-cli` still exposes `pilot ship-gate-evidence`. If the verb is missing or the runbook’s flags 404, fix the CLI to match the runbook — **then stop**. Do not invent a bypass.
2. Confirm the path **requires bind before execute**. Do not weaken that.

## What the owner does (not a coding agent)

1. Follow `docs/engineering/GATE1_SHIP_GATE_EVIDENCE_RUNBOOK.md`.
2. Run `archlucid pilot ship-gate-evidence --run-id <guid>` on a real tenant.
3. Paste the run id + outcome into the next assessment. **Do not** ask a coding agent to mark Gate 1 PASS without that id.

## Acceptance (coding half)

- CLI verb matches the runbook **or** this prompt is skipped because the CLI already works.
- No fabricated assessment PASS.
- If you changed code: commit + PR. Do not push `master`.

## Constraints

- **Do not** implement V13-01–04 in this PR.
- **Do not** mark Gate 1 PASS in `LATEST_GPT55.md` without a real `--run-id`.
- No `git add -A`.
