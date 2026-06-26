> **Scope:** Platform engineers wiring ArchLucid **pre-commit governance** into CI with copy-paste YAML aligned to OpenAPI v1 — simulate on an existing review or fail on real commit.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Pre-commit governance gate — CI starter (V1)

**Last reviewed:** 2026-06-26

## Objective

Give platform teams **copy-paste** GitHub Actions and Azure DevOps snippets that call **`POST /v1/governance/pre-commit/simulate`** (dry-run, no manifest commit) or **`POST /v1/architecture/run/{runId}/commit`** (real gate) using an Operator-scoped API key secret — aligned with [`scripts/ci/data/v1_integration_starter_contracts.v1.json`](../../scripts/ci/data/v1_integration_starter_contracts.v1.json).

This closes the principal-architect bypass: CI enforces the same governed path as the operator UI.

## Reference assets (validated in CI)

| Asset | Purpose |
| --- | --- |
| [`scripts/ci/data/pre_commit_ci_gate_starter.github-actions.yml`](../../scripts/ci/data/pre_commit_ci_gate_starter.github-actions.yml) | Minimal GitHub Actions — simulate or commit on a tagged `runId` |
| [`scripts/ci/data/pre_commit_ci_gate_starter.azure-pipelines-snippet.yml`](../../scripts/ci/data/pre_commit_ci_gate_starter.azure-pipelines-snippet.yml) | Azure DevOps PR validation snippet |
| [`examples/ci/archlucid-governance-gate.sh`](../../examples/ci/archlucid-governance-gate.sh) | Full PR pipeline (create → execute → poll → commit → PilotStrict) |
| [`docs/runbooks/CI_GOVERNANCE_GATE.md`](CI_GOVERNANCE_GATE.md) | Extended runbook (auth, exit codes, failure modes) |

Machine-readable workflow contracts: [`scripts/ci/data/v1_integration_starter_contracts.v1.json`](../../scripts/ci/data/v1_integration_starter_contracts.v1.json) (CI gate: `scripts/ci/check_v1_integration_starter_contracts.py`).

## When to use which mode

| Mode | API | Use when |
| --- | --- | --- |
| **Simulate** | `POST /v1/governance/pre-commit/simulate` | You already have a **ReadyForCommit** or **Committed** `runId` (nightly tag, manual workflow input) and want a **dry-run** gate check without mutating the golden manifest |
| **Commit** | `POST /v1/architecture/run/{runId}/commit` | The review finished execute and is **ReadyForCommit** — CI should attempt real finalize and fail on governance block |
| **Full PR gate** | create → execute → poll → commit | Infrastructure or architecture files changed on a PR — use [`examples/ci/archlucid-governance-gate.yml`](../../examples/ci/archlucid-governance-gate.yml) |

## Authentication

Store CI secrets (never commit values):

| Secret / variable | Required | Header |
| --- | --- | --- |
| `ARCHLUCID_API_URL` | Yes | Base URL (no trailing slash) |
| `ARCHLUCID_API_KEY` | Yes (unless Bearer) | `X-Api-Key` |
| `ARCHLUCID_BEARER_TOKEN` | Optional | `Authorization: Bearer …` (OIDC — see [`GENERIC_OIDC_SETUP.md`](GENERIC_OIDC_SETUP.md)) |
| `ARCHLUCID_RUN_ID` | Simulate / commit modes | Existing review id from workflow input or prior job output |

## Simulate mode (dry-run)

**OpenAPI:** `POST /v1/governance/pre-commit/simulate`  
**Body:** `PreCommitSyntheticSimulationRequest` — `runId` (required), optional `syntheticSeverity`, `syntheticCount` for what-if findings.

**Success:** HTTP **200** with `PreCommitGateResult`:

- `blocked: false` → pass the CI check
- `blocked: true` → fail; inspect `blockingFindingIds`, `policyPackId`, `minimumBlockingSeverity`, `blockExplanation`
- `warnOnly: true` → commit would proceed with warnings (when host `WarnOnlySeverities` applies)

Example request shape (sanitized — see starter contracts JSON):

```json
{
  "runId": "00000000-0000-0000-0000-000000000001",
  "syntheticSeverity": "Critical",
  "syntheticCount": 1
}
```

## Commit mode (real gate)

**OpenAPI:** `POST /v1/architecture/run/{runId}/commit`

| HTTP | Problem `type` fragment | CI action |
| --- | --- | --- |
| **200** | — | Pass |
| **409** | `#governance-pre-commit-blocked` | **Fail** — read RFC 9457 `extensions.blockingFindingIds`, optional `extensions.policyPackId`, `extensions.minimumBlockingSeverity` per [`API_ERROR_CONTRACT.md`](../library/API_ERROR_CONTRACT.md) |
| **400** | `#validation-failed` or run-state conflict | Fail — run not ready for commit |
| **401** / **403** | auth / authority | Fail — fix secrets or RBAC |

## GitHub Actions setup

1. Copy [`pre_commit_ci_gate_starter.github-actions.yml`](../../scripts/ci/data/pre_commit_ci_gate_starter.github-actions.yml) → `.github/workflows/archlucid-pre-commit-gate.yml`.
2. Add repository secrets `ARCHLUCID_API_URL`, `ARCHLUCID_API_KEY`.
3. Run manually with workflow input **`archlucid_run_id`**, or set `ARCHLUCID_RUN_ID` from a prior job that created/executed a review.
4. Mark the job as a **required status check** on protected branches when merge must be blocked.

## Azure DevOps setup

1. Paste [`pre_commit_ci_gate_starter.azure-pipelines-snippet.yml`](../../scripts/ci/data/pre_commit_ci_gate_starter.azure-pipelines-snippet.yml) into your PR validation pipeline.
2. Variable group **`archlucid-ci`**: `ARCHLUCID_API_URL`, secret `ARCHLUCID_API_KEY`, pipeline variable `ARCHLUCID_RUN_ID`.
3. Branch policy **Build validation** on `main` / `master`.

## Security, reliability, cost

| Concern | Posture |
| --- | --- |
| **Security** | Scope API keys to Operator; never log secrets; send `X-Correlation-ID` per pipeline run |
| **Reliability** | Simulate is idempotent (no commit); commit mode requires run in ReadyForCommit — poll `GET /v1/architecture/run/{runId}` first in full pipelines |
| **Cost** | Simulate is cheaper than full execute; use path filters on full PR gates to limit review executes |

## Verification checklist

- [ ] `python scripts/ci/check_v1_integration_starter_contracts.py` passes locally.
- [ ] Simulate on compliant run → CI exit **0**, `PreCommitGateResult.blocked == false`.
- [ ] Simulate with synthetic Critical on enforcing pack → CI exit **1**, `blocked == true`.
- [ ] Commit on blocked run → HTTP **409**, problem type contains `governance-pre-commit-blocked`.

## Related

- [`docs/library/PRE_COMMIT_GOVERNANCE_GATE.md`](../library/PRE_COMMIT_GOVERNANCE_GATE.md) — gate configuration and policy assignment
- [`docs/library/API_ERROR_CONTRACT.md`](../library/API_ERROR_CONTRACT.md) — RFC 9457 problem types
- [`docs/library/customer-facing/CI_CD_INTEGRATION_GUIDE.md`](../library/customer-facing/CI_CD_INTEGRATION_GUIDE.md) — broader CI/CD integration
- In-app help: [`/help/pre-commit-ci-gate`](/help/pre-commit-ci-gate)
