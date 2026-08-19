> **Scope:** Contributor-reference — execution-failure vs quality-outcome taxonomy (TB-963); two-axis matrix + durable persist checklist for PA/ops. Not a buyer assurance claim and not a promise of perfect AI quality.

# LLM execution failure vs quality outcome (TB-963)

> **Audience:** Contributors, operators, principal architects, and GTM claim reviewers who need one matrix for “model failed” versus “quality rejected / HOLD.”  
> **Not** a buyer assurance claim — quality reject ≠ platform outage; pass ≠ perpetual correctness.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#model-failed-vs-quality-rejected-m-124) (GTM **M-124**).  
**Path-stable alias:** [`MODEL_FAILED_VS_QUALITY_REJECTED_ONE_PAGER.md`](../go-to-market/MODEL_FAILED_VS_QUALITY_REJECTED_ONE_PAGER.md) (GTM **M-123** / **M-124** cite hooks).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md).  
**Execution triage:** [`AGENT_EXECUTION_FAILURES.md`](../runbooks/AGENT_EXECUTION_FAILURES.md).  
**Quality gate HTTP:** [`QUALITY_GATE_REJECTION.md`](../runbooks/QUALITY_GATE_REJECTION.md).  
**Scoring SoT:** [`AGENT_OUTPUT_EVALUATION.md`](AGENT_OUTPUT_EVALUATION.md).

---

## Decision in one line

**Admissibility first, quality second.** A run must produce an evaluable machine-readable result before a quality gate can accept, warn, or reject. Timeout, transport, parse, cancel, quota, and content-safety blocks are **execution** outcomes. PilotStrict / structural / semantic / faithfulness floors that fire after results exist are **quality** outcomes — including `failureClass=qualityGate` and run status `ExecutionCompletedQualityRejected`.

---

## Two-axis matrix

| Axis | Meaning | Typical run / HTTP signals | Operator remediation |
|------|---------|----------------------------|----------------------|
| **Execution failure** | Model/path did **not** complete an acceptable machine-readable result | `Failed` / partial incomplete; HTTP 5xx / non-409 execute errors; transport / parse / cancel | Fix config, network, credentials, schema, budget; retry when stable |
| **Quality outcome** | Execution completed enough to evaluate; output **failed the bar** (or warned) | `ExecutionCompletedQualityRejected`; HTTP **409** `QUALITY_GATE_REJECTED` when blocking; triage `groundingInsufficiency` | Enrich evidence / context; review scores; selective re-execute; do **not** treat as outage |

### `failureClass` mapping (`AgentExecutionFailureClasses`)

| `failureClass` | Axis | Notes |
|----------------|------|--------|
| `timeout` | Execution | Polly / host / AOAI latency |
| `canceled` | Execution | Cooperative cancel |
| `parse` | Execution | Schema / JSON / semantic-terminal empty — **not** “low quality findings” (**TB-944** sibling) |
| `circuitBreaker` | Execution | Completion circuit open |
| `quota` | Execution | Tenant sliding-window token quota |
| `costBudget` | Execution | Per-run cost / token cap |
| `missingCredentials` | Execution | Real-mode AOAI config |
| `contentSafety` | Execution | Content Safety blocked prompt/completion |
| `dependency` / `invalidOperation` / `unknown` / `pipelineDeadLetter` | Execution | Infra / contract / deferred pipeline |
| `qualityGate` | **Quality** | Post-execute gate rejected; pairs triage `groundingInsufficiency` |

Code SoT: `ArchLucid.Contracts.Agents.AgentExecutionFailureClasses` · classifier `AgentExecutionFailureSummaryFactory`.

### Quality gate outcome (`AgentOutputQualityGateOutcome`)

| Outcome | Meaning |
|---------|---------|
| `Accepted` | Scores met configured floors for the active gate mode |
| `Warned` | Below warn threshold or judge/heuristic disagreement — run may still complete when not blocking |
| `Rejected` | Below reject floors; with `EnforceOnReject` + `BlockRunOnReject` → `ExecutionCompletedQualityRejected` + optional HTTP 409 |

### Triage catalog (`RealAgentFailureTriageCatalog`)

| `triageScenarioId` | Typical `failureClass` | Axis |
|--------------------|------------------------|------|
| `missingCredentials` | `missingCredentials` | Execution |
| `contentSafetyRejection` | `contentSafety` | Execution |
| `schemaViolation` | `parse` | Execution |
| `timeout` | `timeout` | Execution |
| `budgetCutoff` | `costBudget` / `quota` | Execution |
| `groundingInsufficiency` | `qualityGate` | **Quality** |
| `fallbackToSimulator` | (run flag) | Execution honesty — not buyer-safe Real proof |
| `partialRequiredAgentsIncomplete` | (run status) | Execution completeness — commit blocked |

---

## Persist checklist (audit reconstruction without raw LLM bodies)

Use this as the **TB-964** gap inventory source of truth. Prefer buyer-safe structured fields over redacted raw traces.

### Per-attempt / per-trace

| Field / signal | Why |
|----------------|-----|
| `AgentExecutionTrace.ParseSucceeded` + parse failure flags | Distinguishes execution/parse from quality |
| `FailureReasonCode` (e.g. `CircuitBreakerRejected`, `SchemaRemediationParseFailed`, quota/budget codes) | Stable alert key without provider bodies |
| `qualityRejected` / quality-gate flags on trace when gate runs | Separates quality path from transport fail |
| Reject reason **category** when present (structural / semantic / faithfulness / grounding) | Plain-language UX for **TB-965** |

### Per-result / evaluation

| Field / signal | Why |
|----------------|-----|
| Structural completeness ratio + missing keys | Reconstruct structural bar |
| Semantic / faithfulness / support-ratio scores (or pointers) | Reconstruct quality bar |
| `AgentOutputQualityGateOutcome` for the scored attempt | Accepted / Warned / Rejected |

### Per-run

| Field / signal | Why |
|----------------|-----|
| `LegacyRunStatus` / authority status (`Failed` vs `ExecutionCompletedQualityRejected` vs partial) | Top-level buyer status |
| `LastFailureReason` JSON (`failureClass`, optional `triageScenarioId`, reason code) | Operator triage without raw prompts |
| `AgentExecutionFailureSummary` aggregate | Durable failure class + reason |
| Effective quality-gate **mode** + floor versions/hash (or snapshot) | Historical immutability — **TB-972** contract + **TB-973**/**TB-974** persistence/remediation; do not invent a second schema |
| Baseline audit `RunQualityGateRejected` / `RunFailed` payloads (no secrets) | Forensics + SIEM |

### Explicit non-goals for this checklist

- Storing full prompts/completions in buyer APIs.
- Claiming every historical run already has a complete checklist (**TB-964** closes gaps).
- Equating quality reject with transport outage or “LLM error.”

---

## Explicit non-claims

- Quality reject / HOLD ≠ platform outage or generic “LLM error.”
- Empty / schema / parse failure ≠ “low-quality finding package” — that is execution / semantic-terminal (**TB-944**), not PilotStrict soft scoring.
- Gate **Accepted** ≠ perpetual factual correctness; pass is as-of gate definition ([**TB-972**](QUALITY_GATE_DEFINITION_VERSIONING_CONTRACT.md) / GTM **M-129** / **M-130**).
- PilotStrict green ≠ Real-mode sponsor proof (execution mode is orthogonal — GTM **M-166** / **M-167**).
- Done **TB-684** PilotStrict defaults do not claim perfect calibration.
- This contract does **not** change floors, Polly retry matrix, or HOLD commercial policy.

---

## Follow-on

| ID | Owns |
|----|------|
| **TB-964** | Durable persistence / API gaps vs this checklist |
| **TB-965** | Buyer/operator copy + Vitest guards (never conflate quality HOLD with transport LLM error) |
| **TB-973** | Persist version/hash + `recorded` vs `advisoryCurrent` API (**Done**) |
| **TB-974** | Wrong-gate migration playbook (coordinate snapshot fields with **TB-964**) |
| **TB-937** | Partial-run vocabulary (Done) — align UX language |

---

## Related

- [`AGENT_OUTPUT_EVALUATION.md`](AGENT_OUTPUT_EVALUATION.md) · [`AGENT_TRACE_FORENSICS.md`](AGENT_TRACE_FORENSICS.md)
- [`AGENT_EXECUTION_FAILURES.md`](../runbooks/AGENT_EXECUTION_FAILURES.md) · [`QUALITY_GATE_REJECTION.md`](../runbooks/QUALITY_GATE_REJECTION.md)
- Code: `AgentExecutionFailureClasses`, `AgentExecutionFailureSummary`, `AgentOutputQualityGateOutcome`, `RealAgentFailureTriageCatalog`
- GTM **M-123** / **M-124** · [`PA_CLAIM_HONESTY_INDEX.md`](../go-to-market/PA_CLAIM_HONESTY_INDEX.md)
- [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-963**–**TB-965**, **TB-684**, **TB-944**
