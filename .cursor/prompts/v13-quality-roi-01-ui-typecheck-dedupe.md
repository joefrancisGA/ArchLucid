# V13-01 — UI typecheck: repo-wide TS2300 duplicate-import sweep

**One prompt per chat.** Branch: `cursor/v13-01-ui-typecheck-dedupe-97a4` (or finish open **#2830** on `cursor/trunk-ui-dedupe-imports-97a4`). Model: **Composer 2.5 slow**.

---

## Goal

Make `cd archlucid-ui && npm run typecheck` **exit 0** on this branch vs `origin/master`. Gate 5 of `docs/assessments/LATEST_GPT55.md` is **FAIL** because `tsc --noEmit` reports **TS2300 Duplicate identifier** on default **`origin/master`**.

## Why this is first (token ROI)

v13 `(A)` is **83.44%** with **Runtime 68** (weight 7) carrying **224** deficiency. **Gate 5 FAIL** is the only failing ship-gate with a **code** cause. One `tsc` pass unblocks the architect workspace. Expected after this prompt: **Runtime 68→77**, **Correctness 85→86**, **TTV 82→83**, **(A) → ~84.29%**, **Gate 5 FAIL→PASS**. See `docs/architecture/V13_QUALITY_ROI_COMPOSER_PROMPTS.md`.

## Context

- Assessment: `docs/assessments/LATEST_GPT55.md` (v13) Gate 5 + §6.
- PR **#2830** (`cursor/trunk-ui-dedupe-imports-97a4`) already reports **Operator UI: typecheck (blocking) SUCCESS**. **If it is still OPEN, merge `origin/master` into that branch and land it** instead of opening a second dedupe PR. If merge conflicts or new TS2300 appear (Wave 111+, OP-01–06, SecureNow SA-09–10 landed after the v13 freeze), finish those files on #2830.
- If #2830 is merged and `npm run typecheck` is still red on `origin/master`, start this branch from `origin/master` and sweep **every** remaining TS2300.
- Freeze-era files (must all be gone if they still fail): `policy-packs-api-assign.ts`, `run-coverage-api.ts`, `finding-semantic-support-band-export.ts`, `governance-stickiness-api-dispositions.ts`, `architecture-runs-lifecycle.ts`, `GovernanceFindingsBulkActions.tsx`.
- Typical cause: merge-corruption duplicate `import { X } from '…'` in the same file. Keep **one** import per binding; preserve used symbols.

## What to build

1. Run `cd archlucid-ui && npm run typecheck`. Collect **every** TS2300 (and any other typecheck error). Do not stop at the first seven files.
2. For each file: delete the extra import; keep the used name. If two imports of the same binding exist, keep one.
3. Re-run typecheck until **exit 0**.
4. If `HelpCloudConnectionsGuideView.tsx` or other files still fail after the known list, fix those too. **Done = typecheck green**, not “the listed files look clean.”

## Acceptance

- `cd archlucid-ui && npm run typecheck` **exit 0**.
- No new `any`; no deleted tests to hide errors.
- Commit + PR. Do not push `master`.

## Constraints

- **Do not** disable `strict` or skip typecheck in CI.
- **Do not** rewrite `GovernanceFindingsBulkActions` beyond the duplicate import unless typecheck still fails after the dedupe.
- **Do not** implement V13-02 (audit matrix) or V13-03 (No-anchor) in this PR.
- One class per file; no `git add -A`.
