> **Scope:** Platform engineers wiring ArchLucid **pre-commit governance** and **PilotStrict** checks into GitHub Actions or Azure DevOps — reference pipelines only; no new API surface.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# CI/CD governance gate runbook

**Last reviewed:** 2026-06-26

## Objective

Block merge or release when an automated architecture review cannot **commit** a golden manifest because of the **pre-commit governance gate** (`PreCommitGateResult`, HTTP **409** `#governance-pre-commit-blocked`) or when **PilotStrict** / sponsor-send posture is **HOLD** after commit.

This closes the principal-architect bypass gap: CI enforces the same governed path as the operator UI instead of relying on informal IDE chat.

## Reference assets (copy into your repo)

| Asset | Purpose |
| --- | --- |
| [`examples/ci/archlucid-governance-gate.sh`](../../examples/ci/archlucid-governance-gate.sh) | Shared bash driver (create → execute → poll → commit → PilotStrict check) |
| [`examples/ci/archlucid-governance-gate.yml`](../../examples/ci/archlucid-governance-gate.yml) | GitHub Actions workflow |
| [`examples/ci/archlucid-governance-gate-ado.yml`](../../examples/ci/archlucid-governance-gate-ado.yml) | Azure DevOps pipeline |
| [`examples/ci/architecture-request.ci.json`](../../examples/ci/architecture-request.ci.json) | Default request template when `.archlucid/architecture-request.json` is absent |
| [`templates/architecture-requests/`](../../templates/architecture-requests/) | Additional request JSON templates |

Related docs:

- [`docs/runbooks/PRE_COMMIT_CI_GATE_STARTER.md`](PRE_COMMIT_CI_GATE_STARTER.md) — minimal copy-paste simulate/commit starters (`scripts/ci/data/pre_commit_ci_gate_starter.*.yml`)
- [`docs/library/PRE_COMMIT_GOVERNANCE_GATE.md`](../library/PRE_COMMIT_GOVERNANCE_GATE.md) — 409 semantics, `BlockCommitOnCritical`, dry-run
- [`docs/library/ARCHITECTURE_FLOWS.md`](../library/ARCHITECTURE_FLOWS.md) — Flow A1 (request → execute → commit)
- [`docs/runbooks/GENERIC_OIDC_SETUP.md`](GENERIC_OIDC_SETUP.md) — Bearer token auth for automation
- [`templates/integrations/pr-review-gate/README.md`](../../templates/integrations/pr-review-gate/README.md) — severity-based findings gate (complementary, not a commit gate)

## End-to-end flow

```text
POST /v1/architecture/request     (from repo JSON + PR context)
POST /v1/architecture/run/{runId}/execute
GET  /v1/architecture/run/{runId}   (poll until ReadyForCommit or terminal failure)
POST /v1/architecture/run/{runId}/commit
GET  /v1/pilots/runs/{runId}/pilot-run-deltas   (PilotStrict / sponsor-send post-check)
```

### Exit codes (`archlucid-governance-gate.sh`)

| Code | Meaning |
| --- | --- |
| **0** | Pass — commit succeeded and PilotStrict / sendability checks cleared (or pilot deltas unavailable with warning only) |
| **1** | **Gate failed** — quality rejected, governance pre-commit block, or PilotStrict HOLD |
| **2** | Usage or API error (missing secrets, timeout, unexpected HTTP status) |

## Authentication

### Option A — API key (simplest for pilots)

1. Create an **Operator**-scoped API key in System Administration.
2. Store as a CI secret:
   - GitHub: `ARCHLUCID_API_URL`, `ARCHLUCID_API_KEY`
   - Azure DevOps: variable group `archlucid-ci` with `ARCHLUCID_API_KEY` marked secret
3. The script sends `X-Api-Key: ${ARCHLUCID_API_KEY}`.

### Option B — Bearer token (OIDC / service principal)

Use when your organization forbids long-lived API keys in CI:

1. Configure **`ArchLucidAuth:Mode=JwtBearer`** per [`GENERIC_OIDC_SETUP.md`](GENERIC_OIDC_SETUP.md).
2. In CI, obtain an access token from your IdP (GitHub OIDC → Microsoft Entra ID federated credential, Azure DevOps service connection, etc.).
3. Export `ARCHLUCID_BEARER_TOKEN` instead of (or in addition to) the API key. The script sends `Authorization: Bearer …`.

**Note:** Token exchange wiring is IdP-specific; this runbook does not prescribe a single YAML action. Validate with `GET /v1/admin/auth/configuration-diagnostics` (admin scope) before enabling production gates.

## Repository layout

Teams typically add:

```text
.archlucid/architecture-request.json   # customized from examples/ci/architecture-request.ci.json
.github/workflows/archlucid-governance-gate.yml   # copied from examples/ci/
```

Set `ARCHLUCID_UI_BASE_URL` (GitHub **variable**, ADO plain variable) so PR comments and job summaries link to `/reviews/{runId}`.

Optional: set `ARCHLUCID_SKIP_COMMIT=1` to fail only on execute-time quality rejection without attempting commit (dry validation pipelines).

## Failure modes

### 1. `ExecutionCompletedQualityRejected` (run status **8**)

PilotStrict or agent quality gate blocked completion before commit. **Fail the CI check.** Inspect run detail and retrieval grounding diagnostics.

### 2. HTTP **409** `#governance-pre-commit-blocked`

`POST …/commit` returned RFC 9457 problem details with:

- `type`: `https://archlucid.example.org/errors#governance-pre-commit-blocked`
- `extensions.blockingFindingIds` — findings that blocked commit
- `extensions.policyPackId`, `extensions.blockExplanation` — optional context

Maps to **`PreCommitGateResult`** in application code. **Fail the CI check** and link architects to the operator review.

Simulate without commit: `POST /v1/governance/pre-commit/simulate` (dry-run only).

### 3. PilotStrict HOLD after successful commit

`GET /v1/pilots/runs/{runId}/pilot-run-deltas` indicates:

- `proofPackageCompleteness.agentOutputPilotStrictEvidenceSatisfied == false`, or
- `proofPackageCompleteness.proofSendability == "NotSendable"`, or
- `proofPackageCompleteness.sponsorProofReadiness` in `Incomplete` / `DemoOnly`

**Fail the CI check** — golden manifest committed but sponsor-safe automation posture is not met.

### 4. Timeouts and infra errors

Default poll budget: **1800s** (`ARCHLUCID_MAX_WAIT_SEC`). Exit **2** — treat as pipeline infrastructure failure, not a governance pass.

## GitHub Actions setup

1. Copy `examples/ci/archlucid-governance-gate.yml` → `.github/workflows/archlucid-governance-gate.yml`.
2. Add repository secrets `ARCHLUCID_API_URL`, `ARCHLUCID_API_KEY` (or supply Bearer token in a custom step before invoking the script).
3. Optional repository variable `ARCHLUCID_UI_BASE_URL`.
4. Add the workflow job as a **required status check** on protected branches if merge must be blocked.

The workflow posts a PR comment and `GITHUB_STEP_SUMMARY` with run id and review URL.

## Azure DevOps setup

1. Import `examples/ci/archlucid-governance-gate-ado.yml` as a PR validation pipeline.
2. Create variable group **`archlucid-ci`**: `ARCHLUCID_API_URL`, secret `ARCHLUCID_API_KEY`, optional `ARCHLUCID_UI_BASE_URL`.
3. Add branch policy **Build validation** pointing at this pipeline for `main` / `master`.

## Security, reliability, cost

| Concern | Posture |
| --- | --- |
| **Security** | Prefer OIDC-federated short-lived tokens over static keys; scope keys to Operator; never log secrets; correlation id per run (`ARCHLUCID_CORRELATION_ID`). |
| **Reliability** | Idempotent `requestId` suffix from correlation id; bounded poll with clear timeout exit code; publish gate log artifact on ADO. |
| **Cost** | Each PR triggers one full review execute — tune path filters (`infra/**`, `terraform/**`, `.archlucid/**`) to avoid noise; use concurrency groups to cancel superseded PR runs. |

## Verification checklist

- [ ] Secrets present; `examples/ci/archlucid-governance-gate.sh` exits **2** without them (local dry test).
- [ ] Happy path: compliant PR → exit **0**, PR comment shows review URL.
- [ ] Induce Critical finding with `BlockCommitOnCritical` → exit **1**, 409 body surfaces in log.
- [ ] PilotStrict unsatisfied run → exit **1** after commit with pilot-run-deltas reason in log.
