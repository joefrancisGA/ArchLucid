# ABQ-30 — Auto-ingest CI failures into the escape log (ABQ-19 follow-on)

**After ABQ-19 (shipped).** Do not create `PD-###` rows. Do not fail CI because the escape log is empty. Do not hunt.

## Goal

When **`master`** (or the repo default branch) goes **red** on a job that maps to production code, a CI step can append **one** escape-log JSONL line (`source: ci`) with zone id, implicated paths, and `huntedInPriorDays`. `/al-defect` remains the only PD intake. Empty escape log stays valid.

## Why

ABQ-19’s escape log is **manual** (`/al-defect` Step 2/4). The picker penalty (`escapeCount90d` → `−1` when ≥ 1) therefore only moves when a human remembers. Red CI on a production path is already an escaped defect relative to `/al-bug` yield. Wiring that signal is the cheapest ungameable input ABQ-19 still lacks.

## Context

Reuse:

- `docs/library/AL_BUG_ESCAPE_LOG.jsonl` — schema (`at`, `source`, `zoneId`, `paths`, `ref`, `huntedInPriorDays`); `source` already allows `ci`
- `scripts/agent/al_bug_escape_log.py` — `EscapeEntry`, `map_paths_to_zone_ids`, `validate_escape_log`
- `scripts/agent/al-bug-lint-escape-log.py` — CI already `continue-on-error: true` in `azure-extractor-pester`
- `scripts/agent/al_bug_ledger.py` — `parse_zones`
- `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl` — last hunt per zone for `huntedInPriorDays` (`-1` if never)
- `.github/workflows/ci.yml` — do **not** add this ingest to every PR job (noise). Prefer a **dedicated workflow** on `failure()` of selected **default-branch** jobs, or a step that only runs `if: github.ref == 'refs/heads/master' && failure()`.
- `scripts/tests/test_al_bug_escape_log.py`

Do **not** parse customer logs. Do **not** store stack traces. `ref` = workflow run URL + check name only.

## What to build

1. **Ingest script** (`scripts/agent/al-bug-ingest-ci-escape.py` or extend `al_bug_escape_log.py`):

   - Inputs: `--check-name`, `--run-url`, `--paths` (repeatable) **or** `--trx` / `--test-filter` mapping file.
   - Map paths → zone ids via existing `map_paths_to_zone_ids`. Multiple zones → **one JSONL line per zone** (not a blended zone). No path match → `zoneId: unzoned`.
   - Compute `huntedInPriorDays` from the run log (reuse picker/escape helper if one exists; otherwise a small function next to `al_bug_escape_log.py`).
   - Append line(s). **Idempotency:** same `ref` + `zoneId` on the same UTC day → do not duplicate (lint-friendly).
   - `--dry-run` prints the line(s) and exits 0 without writing.

2. **Path recovery from a failing test (best-effort):** optional mapper: TRX / logger output / a static `scripts/agent/al-bug-ci-test-to-paths.json` for a **short** list of flaky-noisy jobs you explicitly include. If you cannot recover a production path, write `unzoned` with `paths: []` **or skip the append** — pick **skip** when path is unknown so the picker is not spammed with unzoned noise. Document the choice in the script docstring.

3. **Workflow:** only on the default branch, only on failure of jobs that compile/test **product** code (not markdown-link, not `azure-extractor-pester` itself — avoid recursion). Use `continue-on-error: true` on the ingest step. **Do not** `git commit` the JSONL from CI unless the repo already has a bot-commit pattern you can reuse honestly — **prefer** uploading the would-be line as a workflow artifact named `ci-escape-candidate.jsonl` **and** documenting that an agent / owner appends it with `/al-defect` or a follow-up PR. If the repo **does** already commit generated JSONL from CI, match that pattern; otherwise **do not invent a push-from-CI bot**.

   Honest v1 (recommended): **artifact + dry-run in CI** + a documented `pwsh`/`python3` one-liner for the owner to append locally. Auto-push is out of scope unless already standard.

4. **Docs:** `/al-defect` and ledger How-to: CI can propose escape lines; humans still own PD ids. Picker penalty unchanged (ABQ-19). Empty log remains valid.

5. Tests:

```text
python3 scripts/tests/test_al_bug_escape_log.py
python3 scripts/tests/test_al_bug_ingest_ci_escape.py
```

Cover: (a) path under `topology-proposal-merge` (or whatever the fixture ledger uses) → that `zoneId`; (b) unknown path → skip **or** `unzoned` per your documented rule; (c) duplicate `ref`+`zoneId`+day → no second line; (d) `--dry-run` does not write; (e) malformed JSONL still fails the existing lint.

## Acceptance criteria

- No `PD-###` created. `source` is `ci`.
- Ingest is dry-run/artifact on CI unless a pre-existing bot-commit path is reused.
- Picker scoring formula unchanged. Escape lint still allows empty file.
- Recursion: ingest job failure does not ingest itself.

## Constraints

- Do not fail `azure-extractor-pester` because ingest found nothing.
- Do not add English-phrase signals to the validity audit.
- Do not run `/al-bug` or `/al-defect` except as doc edits.
- Do not reopen TB-135/TB-136 or GTM cohort rows.
- Working-tree safety. Pester 5 only if you add a wrapper. Check nulls.
