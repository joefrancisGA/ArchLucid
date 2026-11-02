# SN-COG-02 — Align the SecureNow first-review vocabulary

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-COG prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE64_COMPOSER_PROMPTS.md`

## Goal

Make the SecureNow first-review path use the same buyer-facing nouns and state labels across Home, the first-hour page, Priorities & waves, Path inspect, Question queue, and Remediation tracker.

## Read first

- `docs/securenow/FIRST_HOUR.md`
- `archlucid-ui/src/lib/product-line/securenow-first-hour-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-first-hour-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts`
- the SecureNow Home, Priorities & waves, Question queue, and Remediation tracker copy modules
- `docs/library/UI_DESIGN_SYSTEM.md`

## What to build

1. Branch `sn-cog/02-terminology` from current `master` after SN-COG-01 is present.
2. Create `docs/securenow/COGNITIVE_LOAD_TERMINOLOGY.md` with a small table: canonical noun, meaning, and surfaces where it appears. Include at least `capture`, `ranked path`, `Path inspect`, `cut point`, `question`, `verification`, and `sponsor packaging`.
3. Correct only inconsistent or misleading SecureNow copy found by the audit. Preserve honest state labels such as `NO_GO`, `NOT VERIFIED`, missing, stale, and blocked.
4. Do not rename API contracts, route segments, persisted fields, or shared architecture-review vocabulary in this session.
5. Add focused copy assertions for every changed term. Keep the change limited to SecureNow surfaces.

## Tests

Run the nearest focused Vitest files for each changed copy module. Also read the terminology table and confirm every linked source exists.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not collapse workspace tabs or add a More menu.
- Do not add a wizard, timed SLA, auto-apply action, or customer claim.
- Do not commit.

## Done when

The terminology table documents the first-review nouns, inconsistent SecureNow copy is corrected with focused tests, and missing or unverified evidence remains visibly unresolved.
