# Branch protection (one-time GitHub setup)

GitHub cannot enforce required checks from a file in the repo. After this workflow has produced at least one **green** run on your default branch, apply the following in the UI (or via org automation).

## Where to configure

**Repository:** Settings → Branches → Add branch protection rule (or **Rulesets** → New branch ruleset).

Target: `main` and/or `master` (match both if you use either).

## Recommended settings

- Require a pull request before merging (optional but typical).
- Require status checks to pass before merging: **enabled**.
- Require branches to be up to date before merging: optional (stricter).

### Status checks to require

Use **exact** names as they appear on a completed run (Settings shows autocomplete after one green build). Typical names for this repository:

| Check name |
|------------|
| `Security: gitleaks (secret scan)` |
| `Terraform: validate private stack (no backend)` |
| `Terraform: validate main / edge / entra (no backend) (infra/terraform)` |
| `Terraform: validate main / edge / entra (no backend) (infra/terraform-edge)` |
| `Terraform: validate main / edge / entra (no backend) (infra/terraform-entra)` |
| `.NET: fast core (corset)` |
| `.NET: full regression (SQL)` |
| `Operator UI: unit (Vitest)` |
| `Operator UI: e2e smoke (Playwright)` |
| `Containers: Docker build smoke` |
| `CodeQL (csharp)` |
| `CodeQL (javascript)` |
| `PR: coverage comment` — safe to require: passes on push (no-op); posts a sticky comment on same-repo PRs only |

**Note:** Matrix Terraform jobs publish **one check per matrix value**; include each leg you care about.

### If you use Rulesets

Create a ruleset targeting your default branch, enable **Require status checks**, and add the same check names. Rulesets can target multiple branches in one place.

## Automatic staging deploy (supplements branch protection)

The workflow **CD staging on merge** (`.github/workflows/cd-staging-on-merge.yml`) runs only after the **CI** workflow completes successfully (`workflow_run` with `conclusion == success`). It further requires:

- `AUTO_DEPLOY_STAGING_MERGE` repository variable set to `true`
- The triggering CI run was a **push** to `main` or `master` (not a PR-only green build)
- The CI run’s `head_repository` matches this repository (excludes fork PRs whose branch is named `main`)
- Checkout uses the same commit as CI (`workflow_run.head_sha`)

So even if branch protection were misconfigured, staging is not deployed from a failing main merge: **CI must finish green first**. There is a short delay (typically tens of seconds) after CI completes before staging starts.

Keep required status checks enabled in branch protection so merges to main are blocked when CI fails; the staging workflow adds a second, workflow-level gate.

## Why this matters

Without required checks, a green CI on the PR is informative only; merge can still proceed with failing jobs. Tying merge to `dotnet-full-regression` and `gitleaks` matches the tiered safety model described in `docs/TEST_EXECUTION_MODEL.md`.
