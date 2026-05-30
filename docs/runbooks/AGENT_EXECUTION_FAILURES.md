> **Scope:** Agent execution failures - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Agent execution failures

**Last reviewed:** 2026-04-24

**Audience:** Operators and on-call engineers triaging failed or stuck architecture runs after `POST .../runs/{runId}/execute` (or internal `ExecuteRunAsync`).

## Symptoms

- HTTP **500** / **409** from execute, or run stuck in **TasksGenerated** / **WaitingForResults** while logs show agent errors.
- Audit events such as **Architecture.RunFailed** with exception type names after **Architecture.RunStarted**.
- **Real** mode: Azure OpenAI timeouts, 429s, or empty model output; **Simulator** mode: handler gaps or invalid synthetic payloads.

## System boundaries (for diagrams)

- **Nodes:** API → `ArchitectureRunService` → `IAgentExecutor` → per-`AgentType` handlers → optional LLM / tools; persistence: `AgentResults`, `AgentEvidencePackages`, `AgentExecutionTraces`, `Runs` (authority header).
- **Edges:** Request + tasks + evidence package in; results + evaluations + status **ReadyForCommit** out.
- **Flows:** Happy path persists evidence package, bulk results, evaluations, then status update inside a transaction.

## Triage checklist

1. **Confirm run state**  
   Load the run row: expected path is **TasksGenerated** (or **WaitingForResults**) before execute, **ReadyForCommit** after success. If status is **ReadyForCommit** / **Committed** with no results, storage may be inconsistent (see **Conflict** behavior in application logs).

2. **Check `AgentExecution:Mode`**  
   - **Simulator:** failures are usually deterministic (missing handler, validation).  
   - **Real:** verify `AzureOpenAI:*` (endpoint, key, deployment), quotas, and network egress (private endpoints, firewall).

2a. **Local `archlucid try --real` (first real value)**  
   - Preconditions: shell **`ARCHLUCID_REAL_AOAI=1`**, **`AZURE_OPENAI_ENDPOINT`**, **`AZURE_OPENAI_API_KEY`**, **`AZURE_OPENAI_DEPLOYMENT_NAME`** (CLI preflight).  
   - If execute returns **4xx/5xx** or the run reaches **Failed** while the CLI is in real mode without **`--strict-real`**, the operator loop **falls back** to **`seed-fake-results`** with **`pilotTryRealModeFellBack=true`**, sets **`Runs.RealModeFellBackToSimulator`**, emits **`FirstRealValueRunFellBackToSimulator`**, and prepends a **warning callout** to the first-value Markdown.  
   - **`--strict-real`:** same path but **no fallback** — the command fails so CI or smoke cannot mask a broken AOAI configuration.  
   - Full operator narrative: **[`docs/library/FIRST_REAL_VALUE.md`](../library/FIRST_REAL_VALUE.md)**.

3. **Inspect traces**  
   When SQL storage is enabled, `dbo.AgentExecutionTraces` (and logs) show parse success/failure and redacted prompts. Correlation: **RunId** + **TaskId**.

3a. **Structured state-transition logs**  
   At **Information**, search for the message prefix **`Agent execution state transition`** (EventIds **3012** / **3013** in `SanitizedLoggerInformationExtensions`). Each line includes **`RunId`**, **`CurrentState`**, **`NextState`**, and **`TaskIds`** (comma-separated task ids, or `(none)`). Authority create/resume paths log via **`AuthorityRunOrchestrator`**; deferred outbox work adds **`AuthorityPipelineWorkOutboxId`** from **`AuthorityPipelineWorkProcessor`**; **`POST …/execute`** logs **`execute_enter` → `agent_batch_executing` → `agent_results_persisting` → `execute_complete`** in **`ArchitectureRunExecuteOrchestrator`**.

4. **Schema validation**  
   Invalid agent JSON may fail merge or persistence. Ensure schema files configured under `SchemaValidation:*SchemaPath` exist on the host and match the contract version.

5. **Retry posture**  
   Execute is designed to be retried with transactional persistence; if partial failure occurred, check for duplicate-key or orphan rows only if a bug regressed (contract tests cover replace semantics for evidence packages and results per run).

## Real-agent failure triage matrix (no live secrets)

Use `LastFailureReason` JSON (`failureClass`, optional `triageScenarioId`) on failed runs. Each scenario below maps to operator next steps in code catalog `RealAgentFailureTriageCatalog` and CI fixture `scripts/ci/fixtures/real_agent_failure_triage.json`.

| `triageScenarioId` | Typical `failureClass` | Operator focus |
| --- | --- | --- |
| `missingCredentials` | `missingCredentials` | AzureOpenAI endpoint, deployment, credential transport; run `archlucid config lint` |
| `contentSafetyRejection` | `contentSafety` | Content Safety endpoint/key; input severity; do not disable fail-closed in Production/Staging |
| `schemaViolation` | `parse` | SchemaValidation paths; AgentResult JSON contract version |
| `groundingInsufficiency` | `qualityGate` | PilotStrict faithfulness floors; evidence package depth; HTTP 409 quality rejected |
| `timeout` | `timeout` | Network egress, Polly timeout, regional AOAI latency |
| `budgetCutoff` | `costBudget` or `quota` | Run cost cap vs tenant token quota; LLM budget command center |
| `fallbackToSimulator` | (run flag) | `Runs.RealModeFellBackToSimulator=true`; not buyer-safe live-model evidence |

**missingCredentials:** Confirm `AgentExecution:Mode`, run `archlucid config lint --profile production-like-hosted-pilot`, verify `AzureOpenAI:*` and `/health/ready`.

**contentSafetyRejection:** Review blocked category; confirm `ArchLucid:ContentSafety:*`; redact input — never paste raw prompts into tickets.

**schemaViolation:** Validate `SchemaValidation:AgentResultSchemaPath` on host; check `AgentExecution:SchemaValidation:EnforceOnParse`.

**groundingInsufficiency:** Inspect `ExecutionCompletedQualityRejected` and trace `qualityRejected`; add evidence before retry.

**timeout:** Check private endpoint DNS, firewall, and completion client timeout policy; retry once stable.

**budgetCutoff:** Distinguish per-run `costBudget` from tenant `quota`; adjust caps deliberately.

**fallbackToSimulator:** See step 2a above; use `--strict-real` in CI; mark proof artifacts HOLD when fallback occurred.

See also [`docs/library/FIRST_REAL_VALUE.md`](../library/FIRST_REAL_VALUE.md) and [`docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`](GOLDEN_COHORT_REAL_LLM_GATE.md).

## Security

- Traces may contain sensitive prompts; restrict SQL and log access; do not paste raw traces into untrusted channels.

## Reliability & cost

- **Real** mode: monitor token usage and rate limits; backoff and circuit breakers live in the OpenAI client path.  
- **Simulator:** prefer for CI and load tests to avoid spend.

## Related docs

- `docs/BUILD.md` — configuration and test SQL variables.  
- `docs/ALERTS.md` — alert routes (separate from agent execution).  
- `SECRET_AND_CERT_ROTATION.md` — API keys and endpoints.
