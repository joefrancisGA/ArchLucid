# ABQ-37 — CI escape job-map + human paste path

**After ABQ-30 (shipped).** Do not git-push the escape log. Do not create `PD-###`. Do not hunt. Do not fail CI because the escape log is empty.

## Goal

Red default-branch CI can already emit `ci-escape-candidate.jsonl` (artifact, dry-run). Two leftover holes: (1) `scripts/agent/al-bug-ci-test-to-paths.json` maps only a couple of job names, so most red jobs skip as “no production paths”; (2) nothing tells a human how to **paste** a mapped candidate into `docs/library/AL_BUG_ESCAPE_LOG.jsonl`. Expand the job map from **real** `ci.yml` job/check names that compile production code, and add a print/paste helper. Recursion guard stays: do **not** map `azure-extractor-pester` or this ingest workflow.

## Why

ABQ-19’s picker penalty only moves when the escape log grows. ABQ-30’s workflow is honest about dry-run, but a two-entry map plus an undownloaded artifact is a dead letter. Expanding the map is the cheapest ungameable input still missing. Auto-push remains an index **won’t-do**.

## Context

- `.github/workflows/al-bug-ci-escape-candidate.yml`
- `scripts/agent/al-bug-ingest-ci-escape.py` — `--dry-run`, skip unknown jobs (not `unzoned`)
- `scripts/agent/al-bug-ci-test-to-paths.json`
- `scripts/tests/test_al_bug_ingest_ci_escape.py`
- `.github/workflows/ci.yml` — job `name:` strings (the check names `gh` returns)
- `.cursor/commands/al-defect.md` — CI `source: ci` is not a PD
- `docs/library/AL_BUG_HUNT_LEDGER.md` § Escape rate

Do **not** parse logs or stack traces. `ref` stays run URL + check name.

## What to build

1. **Job map:** add production-path prefixes for default-branch jobs that actually compile product code (examples to consider if those names exist: OpenAPI snapshot, `dotnet-fast-core` shards, Api.Tests, Persistence, UI typecheck → `archlucid-ui/src`). Skip docs-only, warn-only, and hunt-tooling jobs. Missing map entry → skip (current behavior).

2. **Paste helper** (flag on the ingest script or a sibling): given a candidate JSONL file, print the lines a human would append **only** when `zoneId` is a real zone (not skipped). Do not write the escape log unless `--apply` **and** the operator named the file — default remains dry-run.

3. **Docs:** ledger How-to + `/al-defect` one sentence: after a red `master` CI, download artifact `ci-escape-candidate` and paste mapped lines; still no `PD-###` from CI.

4. Tests:

```text
python3 scripts/tests/test_al_bug_ingest_ci_escape.py
```

Cover: (a) unknown job still skips (not `unzoned`); (b) a newly mapped job name recovers a production path under an existing zone; (c) dry-run / paste helper does not write the log; (d) `azure-extractor-pester` is still unmapped.

## Acceptance criteria

- Job map has more than the original two keys **or** the PR lists every `ci.yml` production job considered and why it was skipped.
- No git-push from the workflow. Empty escape log still valid.
- Closed class enum unchanged. No English-phrase validity signals.

## Constraints

- Do not auto-push JSONL from CI (index won’t-do).
- Do not run `/al-bug`. Do not invent `PD-###` / `TB-###`.
- Do not reopen TB-135/TB-136 or GTM cohort rows.
- Working-tree safety. Check nulls.
