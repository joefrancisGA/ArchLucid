# Private-beta frozen branch — point-in-time smoke

Use this branch when `master` merge churn keeps cancelling `private-beta-access-on-push` mid-Playwright.

## Policy

| Rule | Detail |
| --- | --- |
| **Branch** | `cursor/al-beta-private-beta-frozen-7730` |
| **Do not merge `master` into this branch** until the current smoke run finishes and you have triaged results |
| **Do not open PRs targeting this branch** except to refresh the pin (see below) |
| **Concurrency** | `private-beta-access-smoke-branch` workflow uses `cancel-in-progress: false` |

The branch is a **snapshot** of trunk at a known SHA (see `scripts/ci/private_beta_frozen_branch.sha`). It is intentionally stale relative to `master` so CI can finish.

The beta-readiness guard runs `scripts/ci/check_private_beta_frozen_branch_pin.py` when
`origin/RC34` is available. A stale pin emits a warning only; it does not refresh or
force-push the frozen branch while a smoke run may still be in flight.

## Cut-freeze checklist

Before pushing a frozen-branch smoke:

1. Confirm the pinned SHA is the intended `master`/`RC34` cut and record it in the
   smoke ticket.
2. Confirm no smoke run is in flight for the branch.
3. Push only access-path, compile, or test-fixture fixes until the witness finishes;
   defer unrelated feature and copy changes.
4. Do not interpret a frozen-branch result as current-trunk health. Re-run the
   witness after refreshing the pin.
5. Preserve the run id and failed-job artifact paths in the triage record, even
   when the result is green.

## Start a run

```bash
# One-shot push (already done when the pin was created):
git push -u origin cursor/al-beta-private-beta-frozen-7730

# Or re-dispatch without pushing:
bash scripts/ci/retrigger_private_beta_smoke_branch.sh cursor/al-beta-private-beta-frozen-7730
```

## Refresh the pin (new point-in-time)

When you need a newer trunk snapshot:

```bash
git fetch origin master
git checkout cursor/al-beta-private-beta-frozen-7730
git reset --hard origin/master   # only when no smoke run is in flight
# Update scripts/ci/private_beta_frozen_branch.sha with the new HEAD
git add scripts/ci/private_beta_frozen_branch.sha
git commit -m "chore(ci): refresh private-beta frozen branch pin"
git push origin cursor/al-beta-private-beta-frozen-7730
```

## Artifacts

Same as [PRIVATE_BETA_TRUNK_SMOKE.md](./PRIVATE_BETA_TRUNK_SMOKE.md) smoke-branch section (`-smoke-branch` suffix).

```bash
# After the workflow finishes (success or failure):
bash scripts/ci/fetch_private_beta_smoke_artifacts.sh <run-id> ./frozen-triage --lane smoke-branch
```
