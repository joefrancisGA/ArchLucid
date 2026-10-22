# Follow-up: re-check Operator UI extended-matrix shards 2/4 and 3/4 after the decision-trace fix

> Run this prompt **after**
> `.cursor/prompts/fix-ci-run-2529-live-api-extended-shard2-decision-trace-reuse-collision.md` has been
> implemented and merged, and a fresh CI run of the extended-matrix job has completed on `RC7`. Its
> only job is to decide whether the two older, never-implemented tenant-isolation prompts are still
> needed — **not** to re-run the full forensic log analysis from scratch.
>
> Shard 3/4 in run **2529** hit the same decision-trace bug (90m timeout, job `85651988168`) — see
> `.cursor/prompts/fix-ci-run-2529-live-api-extended-shard3-decision-trace-timeout.md` for shard-3
> forensics. One production fix (`SkipPersistingPipelineArtifacts`, commit `dcbbb4542d`) should green
> both shards; evaluate both in steps 1–4 below.

## What to do

1. Identify the most recent completed `CI` workflow run on `RC7` (via `gh run list --workflow=CI
   --limit 5 --json databaseId,number,conclusion,status`) that includes the
   `Operator UI: e2e live API + SQL (extended matrix; warn-only) [shard 2/4]` and `[shard 3/4]` jobs.
   If neither shard has run since the decision-trace fix merged, trigger a `workflow_dispatch` run (or
   ask the user to) and wait for it — do not evaluate against a stale pre-fix run.
2. For each shard, download `ui-e2e-live-extended-api-log-{N}` and `ui-e2e-live-extended-test-results-{N}`
   (`gh run download <run-id> -n <artifact-name> -D <dir>`) and check:
   - Does `unique-key violation without reconcilable manifest` still appear anywhere in the log? If
     yes, the fix did not fully land or missed a code path — stop and report back with the new
     evidence (do not re-attempt the old tenant-purge fix on top of a still-broken decision-trace
     path; re-open the decision-trace prompt instead).
   - If that log line is gone: check the final Playwright summary line (`N failed`, `N passed`) for
     each shard. Note which specific tests (if any) still fail, and for each one, read the actual
     error/log excerpt for that test rather than assuming it's the old tenant-purge issue.
3. For any test that **still** fails, only now consider whether it matches the tenant-purge shape
   described in the old prompts — i.e. look for an actual
   `Sample run purge completed: {N} rows removed (trigger=first_real_commit, ...)` log line
   (`ArchLucid.Application/Runs/Sample/SampleRunPurgeService.cs:89-90`) at some point *before* that
   test's failure, and/or a 404 on a pinned demo-workspace run id
   (`live-api-buyer-golden-path.spec.ts` / `live-api-core-pilot-path.spec.ts`'s seeded Workspace
   A/B runs). Only if you find that concrete evidence should you pick up
   `.cursor/prompts/fix-ci-run-2526-live-api-extended-shard2-sample-purge.md` and
   `.cursor/prompts/fix-ci-run-28828296262-live-api-extended-shard3-sample-purge.md`'s fixes — and even
   then, re-verify their Step 0 assumptions against the current codebase first, since three days have
   passed and other code may have changed.
4. If both shards are fully green (or only failing on genuinely new/unrelated issues), report that the
   old tenant-purge theory was superseded by the decision-trace bug and the two old prompts can be
   archived/closed without implementation. Do not implement them speculatively "just in case."

## Output expected from this prompt

- Which CI run/job ids were checked (with links).
- Whether `unique-key violation without reconcilable manifest` is gone.
- Pass/fail count per shard, and for any remaining failures, the actual observed error (not an assumed
  one).
- An explicit recommendation: close the two old tenant-purge prompts, or reopen them with fresh
  evidence — not both, and not neither.
