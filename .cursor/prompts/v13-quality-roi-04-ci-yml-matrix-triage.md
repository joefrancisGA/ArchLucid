# V13-04 — `ci.yml` matrix triage (after V13-01 and V13-02 are on default)

**One prompt per chat.** Branch: `cursor/v13-04-ci-yml-matrix-triage-97a4`. Model: **Composer 2.5 slow**.

---

## Goal

After **V13-01** (typecheck) and **V13-02** (audit-matrix shares) are on default, classify remaining **`ci.yml`** reds on `origin/master` into **(a)** merge-queue flake, **(b)** still-red real product, **(c)** docs/assert drift. Produce `docs/engineering/CI_YML_MATRIX_TRIAGE_2026-09-10.md` (or today’s date) with job → class → next prompt. **Do not** disable checks.

## Why this is fourth (token ROI)

v13 Runtime is **68** even after 01+02 because **full `ci.yml` on `origin/master` is still red** (merge queue `enforcement: evaluate`, UI typecheck, audit-matrix). Once 01+02 land, this prompt **isolates** remaining reds so the next coding agent does not spend tokens on queue flake. Expected: **Runtime 78→81** after 01+02, **(A) → ~84.95%**. See `docs/architecture/V13_QUALITY_ROI_COMPOSER_PROMPTS.md`.

## Context

- Predecessor: `.cursor/prompts/v12-quality-roi-03-ci-yml-matrix-triage.md` and `docs/engineering/CI_YML_MATRIX_TRIAGE_2026-09-10.md` (may already exist from V12 — **update**, do not duplicate a second file if today’s date is the same).
- Merge queue: `.github/workflows/merge-queue-required-status.yml` — `enforcement: evaluate`.
- **Do not** start this prompt until V13-01 and V13-02 are merged (or you merge those PRs first in this chat if they are still OPEN and green).

## What to build

1. `gh run list --branch master --workflow ci.yml --limit 15`. For the latest complete run, list **failed job names**.
2. For each failed job: (a) queue-only / evaluate, (b) product still red (name the test), (c) docs/assert. **Typecheck and audit-matrix must be (c) resolved** if 01+02 merged — if they are still red, stop and finish 01/02 first.
3. Write/update the triage markdown. One follow-up prompt per **(b)** row only.
4. **Do not** “fix CI” by skipping tests.

## Acceptance

- Triage doc merged. Every red job classified.
- No workflow `if: false` / continue-on-error on required jobs.
- Commit + PR. Do not push `master`.

## Constraints

- **Do not** implement V13-03 (No-anchor) in this PR unless a (b) row is exactly that and you split a second PR.
- No `git add -A`.
