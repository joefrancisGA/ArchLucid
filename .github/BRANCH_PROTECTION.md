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
| `CI: prompt-injection regression (strict + block layer)` |
| `CI: agent offline regression (eval corpus + prompt JSON baseline)` |
| `Go-to-market: demo workspace pins (manifest vs docs + seeds)` |
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
| `cohort-real-llm-gate` — when **`vars.ARCHLUCID_GOLDEN_COHORT_REAL_LLM`** is **`true`**; see [`docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`](docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md) |
| `PR: coverage comment` — optional on **full CI** (`workflow_dispatch`): posts only on same-repo **pull_request** events when wired that way; trimmed PR runs skip merged coverage so this job does not apply on PR |

**Note:** Matrix Terraform jobs publish **one check per matrix value**; include each leg you care about.

Checks from **`.NET: full regression (SQL)`** through **`Containers: Docker build smoke`** (and **`PR: coverage comment`**) run only on **full CI** (`workflow_dispatch`), not on trimmed **pull_request** runs.

### If you use Rulesets

Create a ruleset targeting your default branch, enable **Require status checks**, and add the same check names. Rulesets can target multiple branches in one place.

**PR vs full CI:** On **pull_request** (into `main`/`master`), `.github/workflows/ci.yml` runs jobs **before** `.NET: fast core (corset)` plus a **trimmed** corset (same check name; skips CycloneDX SBOM, coverlet/ReportGenerator, and the finding-engine template test). Everything **after** corset—including `.NET: full regression`, UI/Docker/k6/ZAP/Schemathesis—runs only on **Actions → CI → Run workflow** (`workflow_dispatch`).

## Automatic staging deploy (supplements branch protection)

The workflow **CD staging on merge** (`.github/workflows/cd-staging-on-merge.yml`) runs only after the **CI** workflow completes successfully (`workflow_run` with `conclusion == success`). It further requires:

- `AUTO_DEPLOY_STAGING_MERGE` repository variable set to `true`
- The triggering CI run was a **push** or **workflow_dispatch** to `main` or `master` (not a PR-only green build)
- The CI run’s `head_repository` matches this repository (excludes fork PRs whose branch is named `main`)
- Checkout uses the same commit as CI (`workflow_run.head_sha`)

So even if branch protection were misconfigured, staging is not deployed from a failing main merge: **CI must finish green first**. There is a short delay (typically tens of seconds) after CI completes before staging starts.

Keep required status checks enabled in branch protection so merges to main are blocked when CI fails; the staging workflow adds a second, workflow-level gate.

## Why this matters

Without required checks, a green CI on the PR is informative only; merge can still proceed with failing jobs. Tying merge to `dotnet-full-regression` and `gitleaks` matches the tiered safety model described in `docs/TEST_EXECUTION_MODEL.md`.
