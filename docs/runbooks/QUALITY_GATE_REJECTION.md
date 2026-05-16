> **Scope:** HTTP 409 when agent output fails the post-execute quality gate (BlockRunOnReject) — problem details, configuration, and operator actions.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Quality gate rejection (HTTP 409)

**Last reviewed:** 2026-05-09

## 1. Objective

When a workspace enforces **agent output quality** after a successful **POST** `…/run/{runId}/execute`, a **rejected** gate outcome can surface to API clients as **HTTP 409 Conflict** with **RFC 9457 Problem Details** (`application/problem+json`). This runbook explains the **stable machine fields**, how to **diagnose**, and how to **remediate** without guessing.

## 2. Assumptions

- **`ArchLucid:AgentOutput:QualityGate:Enabled`** is **true** (typical production-like hosts).
- **`EnforceOnReject`** and **`BlockRunOnReject`** are both **true** (otherwise rejected traces are logged/metered but execute may still complete without this 409).
- Callers can issue **ReadAuthority** requests to **`GET /v1/architecture/run/{runId}/agent-evaluation`** for the same run.

## 3. Constraints

- The 409 is raised **after** agent results are persisted; the orchestrator marks the run **`ExecutionCompletedQualityRejected`** (see `ArchitectureRunStatus`) when blocking is enabled.
- **Semantic scores** in metrics and API are **heuristic / optional judge** signals — not proof of factual correctness (see [AGENT_OUTPUT_EVALUATION.md](../library/AGENT_OUTPUT_EVALUATION.md)).

## 4. Architecture overview

**Flow:** `ArchitectureRunExecuteOrchestrator` completes execute → `IAgentOutputTraceEvaluationHook.AfterSuccessfulExecuteAsync` → `AgentOutputEvaluationRecorder` evaluates traces → on **rejected** outcome with enforcement, throws **`AgentOutputQualityGateRejectedException`** → orchestrator records audit / status and rethrows → **`ApplicationProblemMapper`** builds Problem Details **409**.

**Stable response shape:** `type` = `https://archlucid.example.org/errors#quality-gate-rejected`, **`extensions.errorCode`** = `QUALITY_GATE_REJECTED`, **`extensions.supportHint`** = short operator text, **`extensions.runbook`** = repo path `docs/runbooks/QUALITY_GATE_REJECTION.md`, plus **`runId`**, **`traceId`**, **`agentLabel`** for the failing trace.

## 5. Component breakdown

| Piece | Role |
|-------|------|
| **`AgentOutputQualityGateOptions`** | Thresholds, **PilotStrict**, **EnforceOnReject**, **BlockRunOnReject** |
| **`AgentOutputEvaluationRecorder`** | Computes structural/semantic scores and gate outcome; may throw |
| **`AgentOutputQualityGateRejectedException`** | Carries run + trace + agent label; user-facing **Detail** string |
| **`ApplicationProblemMapper`** | Maps exception to Problem Details + extensions |

## 6. Data flow (diagnosis)

1. Read the **409** body: note **`traceId`**, **`agentLabel`**, **`detail`**, **`supportHint`**, **`runbook`**.
2. Call **`GET /v1/architecture/run/{runId}/agent-evaluation`** — inspect **structural** / **semantic** columns and **gate** context for that trace.
3. Check **logs** with the response **correlation** id (e.g. `X-Correlation-ID` / **`extensions`** if your client logged them).
4. Confirm **configuration** merged for the environment: **`ArchLucid:AgentOutput:QualityGate`** (see [CONFIGURATION_REFERENCE.md](../library/CONFIGURATION_REFERENCE.md)).

## 7. Security model

- Problem Details omit raw model output; identifiers (**runId**, **traceId**) are scoped to tenant/workspace/project of the caller.
- Do not paste **API keys** or **full AgentResult** into tickets; use evaluation API + internal observability.

## 8. Operational considerations

**Remediation (typical):**

- Improve **context ingestion** (requirements, evidence, policy hints) and **re-execute**.
- If thresholds are too strict for a pilot, adjust **QualityGate** with governance (prefer **warn-only** in non-production rather than lowering bars silently in production).
- Optional **LLM judge** is under **`ArchLucid:Agents:LlmJudge`** (Topology + Critic only); it shares the **same LLM quota pool** as agents — see [AGENT_OUTPUT_EVALUATION.md](../library/AGENT_OUTPUT_EVALUATION.md).

**Reliability:** Clients should treat 409 as **non-retryable** for the same payload unless inputs or configuration change.

**Cost:** Fewer rejected executes reduces wasted LLM spend; tune gates against real cohorts (metrics: `archlucid_agent_output_quality_gate_total`, histograms in [OBSERVABILITY.md](../library/OBSERVABILITY.md)).

## Related documents

- [AGENT_OUTPUT_EVALUATION.md](../library/AGENT_OUTPUT_EVALUATION.md) — scoring, gate, judge
- [MANUAL_QA_CHECKLIST.md](../quality/MANUAL_QA_CHECKLIST.md) — operator QA
- [TECH_BACKLOG.md](../library/TECH_BACKLOG.md) — TB items related to quality gate hardening
