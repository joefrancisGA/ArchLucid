> **Scope:** Contributor / release-engineering reference for which CI checks **block** a build vs **warn**, and how that maps to deploying to Azure. Not a customer-facing doc.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# CI release gate — block vs warn policy

**Last reviewed:** 2026-06-06

## Objective

Define the smallest set of CI checks that may **block** a build, so that fresh builds reach Azure frequently. Everything outside that set runs as **warn-only**: the failure is still visible (red step, annotations), but it does not fail the CI run, does not block merge, and does not block deployment. You then decide per-deploy whether to accept the warnings.

## First-principles criteria (block only when all hold)

A check is a **hard gate** only when its escape is **irreversible or wide blast-radius** *and* the downstream machinery (post-deploy smoke, canary, auto-rollback) cannot catch it. Concretely:

1. **Reversibility** — can the harm be undone cheaply? Leaked secret = no → block. Slow endpoint = yes (roll back the revision) → warn.
2. **Blast radius** — does it cross tenants, corrupt data, or breach security/compliance? → block. Degrades only this deploy's quality? → warn.
3. **Recoverability after deploy** — `cd.yml` / `cd-staging-on-merge.yml` already provide per-revision Container Apps, canary split, post-deploy smoke, and `CD_ROLLBACK_ON_SMOKE_FAILURE`. Runtime risks caught there do **not** need a pre-merge hard gate.
4. **Signal confidence** — deterministic and low-false-positive? A flaky perf/e2e check must never be a hard gate.

Rule of thumb: **cheap + deterministic + guards irreversible/cross-tenant harm → block. Everything else → warn.**

## How blocking actually works (GitHub Actions mechanics)

- A **job** with `continue-on-error: true` still shows red if it fails, but the **workflow run conclusion stays `success`**, and `needs.<job>.result` reports `success` so downstream jobs still run. This is how a warn-only job avoids blocking.
- The CI **run conclusion** is `failure` if and only if at least one job **without** `continue-on-error` fails. That set of strict jobs *is* the release gate.
- `cd-staging-on-merge.yml` deploys to **staging** only when the push-to-`master` CI **conclusion == success** (and `AUTO_DEPLOY_STAGING_MERGE == 'true'`). So the strict push-job set below is what gates auto-staging.
- `cd.yml` (manual `workflow_dispatch`, target dev/staging/production) has **no dependency on CI** — you can deploy a known-good commit at any time regardless of CI color. Its own gates are the Terraform plan guards (data region, SQL backup redundancy) plus post-deploy smoke and optional rollback.

## Hard gate — PR branch-protection required status checks

These run on `pull_request` and are deterministic correctness/security/build. Configure them as **required status checks** in branch protection (match the check name = the job `name:`). Use the aggregator jobs so matrix legs are covered without listing each:

| Required check (job name) | Why it blocks |
|---------------------------|---------------|
| `Security: gitleaks (secret scan)` | Secret exposure is irreversible. |
| `.NET: OpenAPI v1 contract snapshot (fail-fast)` | API contract drift breaks consumers. |
| `CI: prompt-injection regression (strict + block layer)` | Security regression (deterministic, offline). |
| `CI: agent offline regression (eval corpus + prompt JSON baseline)` | Correctness regression (deterministic, offline). |
| `Terraform: validate private stack (no backend)` | IaC must parse/validate (`fmt` is warn-only within the job). |
| `Terraform: validate main / edge / entra (no backend)` | Same; matrix over all public stacks. |
| `.NET: fast core — build` | Cannot deploy an artifact that does not build. |
| `.NET: fast core — test (<shard>)` | Core unit tests (PR-trimmed; matrix legs). |
| `.NET: fast core (corset)` | Aggregator of build + test. |

## Hard gate — additional push-to-`master` jobs (gate auto-staging / CD)

These carry `if: github.event_name != 'pull_request'`, so they do **not** run on PRs (do not add them to PR-required checks — they would sit pending and block every PR). They run on push/dispatch and gate the CI conclusion that `cd-staging-on-merge` keys off:

| Push-only gate (job name) | Why it blocks |
|---------------------------|---------------|
| `.NET: Tier 1.5 — DbUp migrations on empty catalog (Docker SQL)` | Migration safety; schema damage is irreversible. |
| `.NET: greenfield SQL boot (empty catalog)` | Deployability: API boots on a clean catalog. |
| `.NET: full regression — Api.Tests integration shard <shard> (SQL)` | Core correctness (tenant isolation, authz, data integrity). |
| `.NET: full regression — Api.Tests non-integration (SQL, …)` | Core correctness. |
| `.NET: full regression — core libraries shard (SQL, …)` | Core correctness. |
| `.NET: full regression — core shards complete (non-slow)` | Aggregator of the core regression shards. |
| `Containers: Docker build smoke` | Builds the actual deployed image + Trivy **fixable** CRITICAL/HIGH. |
| `Operator UI: unit (Vitest)` | UI core correctness (deterministic). |
| `Operator UI: Playwright mock functional (mock API)` | UI smoke against mock (deterministic). |
| `Performance: k6 API smoke (operator path)` | **Catastrophic cliff only** (p95 > 20s or > 50% failures). Drift is warn-only. |
| `Performance: k6 CI smoke (read + write baseline)` | **Catastrophic cliff only**. Drift is warn-only. |

## Warn-only (never blocks merge or deploy)

Job-level `continue-on-error: true`: doc guards (`Docs: *`), advisory/parity (`IaC: parity scan`, `IaC: hosted prod scaffold sync parity`, `Terraform: advisory snippets …`, `SaaS: Terraform roots validate`), demo/seed parity, Azure-extractor Pester, `CI: guards pre-corset (text)`, SBOM/coverage artifacts, **slow** regression shards (`… slow shard API`, `… slow shard domain`), coverage merge + PR comment, Simmy chaos, **live** Azure OpenAI post-regression, NuGet publish, all **live** Operator-UI e2e (`live API + SQL`, `ApiKey`, `JWT`), UI a11y/lint/preflight, `.NET: benchmark regression`, `Security: OWASP ZAP baseline`, `Security: Schemathesis light fuzz`.

Step-level warn (inside otherwise-strict jobs):

- `terraform fmt (check only)` — cosmetic; run `terraform fmt -recursive` to fix.
- k6 per-tag p95 **budget drift** asserts — informational; the catastrophic-cliff step in the same job still blocks.
- Trivy image scan **including not-yet-fixable** CVEs — informational; the `ignore-unfixed: true` step still blocks on fixable CRITICAL/HIGH.

## Deploying to Azure

- **Right now, any commit:** run the `CD` workflow (`cd.yml`) via *Run workflow* → choose `dev`/`staging`/`production`, set `run_terraform_apply` as needed. CI color does not gate this; post-deploy smoke + rollback are your safety net.
- **Automatic on merge to `master`:** set repo variable `AUTO_DEPLOY_STAGING_MERGE = true`. Staging deploys whenever push-to-`master` CI conclusion is `success` — i.e. when the hard-gate jobs above pass, regardless of any warn-only failures.

## Promoting or demoting a check

- **Warn → gate:** remove the job-level `continue-on-error: true` (or the step-level one), and add the job name to branch-protection required checks if it runs on PRs.
- **Gate → warn:** add `continue-on-error: true` at the job level (or to the specific step) and remove it from required checks. Prefer step-level when only one step is noisy.

## References

- `.github/workflows/ci.yml` (job classification), `.github/workflows/cd.yml`, `.github/workflows/cd-staging-on-merge.yml`
- [`PRODUCTION_DEPLOYMENT.md`](PRODUCTION_DEPLOYMENT.md#part-c--canary-promotion-container-apps), [`LOAD_TEST_BASELINE.md`](../library/LOAD_TEST_BASELINE.md), [`API_SLOS.md`](../library/API_SLOS.md)
- [`TEST_EXECUTION_MODEL.md`](../library/TEST_EXECUTION_MODEL.md)
