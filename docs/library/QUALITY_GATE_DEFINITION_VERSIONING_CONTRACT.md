> **Scope:** Contributor-reference — quality-gate definition versioning and historical immutability (TB-972); coordinates **TB-963** taxonomy with **TB-973** persistence and **TB-974** wrong-gate remediation.

# Quality-gate definition versioning (TB-972)

> **Audience:** Contributors, principal architects, and GTM claim reviewers who need one matrix for how threshold upgrades treat history.  
> **Not** a buyer assurance claim — versioning rules describe engineering honesty; they do not prove perfect gate calibration.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#quality-gate-versioning-m-130) (GTM **M-129** / **M-130**).  
**Execution vs quality taxonomy:** [`LLM_EXECUTION_VS_QUALITY_OUTCOME.md`](LLM_EXECUTION_VS_QUALITY_OUTCOME.md) (TB-963).  
**Reference types:** `ArchLucid.Core.QualityGates.QualityGateDefinitionSnapshot`, `QualityGateDefinitionFingerprint`.  
**Persistence:** **TB-973** **Done** · **Wrong-gate playbook:** **TB-974** **Done**.

---

## Decision in one line

A quality pass is **as-of the gate definition** (version + content hash) recorded at evaluate time. Threshold upgrades and definition corrections must **never** silently rewrite recorded outcomes, run status, sponsor proof, or export attestation; optional “as if today” views are **advisory only**.

---

## Append-only `QualityGateDefinition` contract

Definitions are **append-only**. Operators publish a new row when floors/mode change; prior rows remain addressable for historical reconstruction.

| Field | Required | Meaning |
|-------|----------|---------|
| `definitionVersion` | Yes | Monotonic operator label (semver, date stamp, or deployment id). Distinct from content hash. |
| `contentHashSha256` | Yes | Lowercase hex SHA-256 over threshold-affecting fields — `QualityGateDefinitionFingerprint.ComputeFromOptions` (**algorithm `v1`**) |
| `mode` | Yes | `AgentOutputQualityGateMode` (`WarnOnly`, `PilotStrict`, …) |
| `effectiveFromUtc` | Yes | First instant this definition may apply to **new** evaluations |
| `deprecatedReason` | When superseded | Human-readable reason (policy tighten, bug fix, pilot exit). Null while active. |
| `globalFloors` | Yes | Structural/semantic warn + reject floors + PilotStrict posture fields that affect classification |
| `perAgentTypeFloors` | When configured | Dictionary keyed by `AgentType` name; null properties inherit global floors |

**Content hash includes (v1):** `Enabled`, `Mode`, global warn/reject floors, PilotStrict minima, `HeuristicEvaluatorTightenedThresholds`, sorted per-agent overrides.

**Content hash excludes:** enforcement orchestration (`EnforceOnReject`, `BlockRunOnReject`, `MaxAutoRetries`, budget caps) — those affect run completion but not the scored Accept/Warn/Reject classification bar.

---

## Recorded vs advisory authority

| Kind | Authority | Source | Buyer / sponsor use |
|------|-----------|--------|---------------------|
| **Recorded** | **Authoritative** | Persisted evaluate-time outcome + definition version/hash (**TB-973**) | Run status, sponsor gates, export/verify, trust labels |
| **Advisory current** | **Non-authoritative** | Optional recompute under **live** host `AgentOutputQualityGateOptions` | Operator diagnostics only; must be labeled and visually distinct |

`QualityGateOutcomeAuthority.Recorded` and `.AdvisoryCurrent` name these surfaces in code (**TB-973** wires persistence and API fields).

**Forbidden:** presenting `advisoryCurrent` as the run’s decision; overwriting `QualityRejected` / `ExecutionCompletedQualityRejected` / export attestations when floors tighten; `UPDATE` of historical gate outcomes (**TB-974** owns wrong-definition remediation).

---

## Historical immutability under threshold upgrades

| Event | Recorded outcome | Run status / sponsor proof | New executes |
|-------|------------------|------------------------------|--------------|
| Floors **tighten** after Accept | **Unchanged** (still Accepted as-of old hash) | **Unchanged** without re-execute | Use **current** definition only |
| Floors **loosen** after Reject | **Unchanged** (still Rejected as-of old hash) | **Unchanged** without re-execute | Use **current** definition only |
| Mode switch (e.g. WarnOnly → PilotStrict) | **Unchanged** for past runs | **Unchanged** without re-execute | New mode applies forward only |
| Selective re-execute of tasks | Re-evaluate **only** re-executed tasks under **current** definition; re-roll run aggregates per product rules | May change only when a new authoritative evaluate path runs | By design |

**Advisory recompute** (“what if today’s floors?”) is permitted for operator tooling when:

1. Labeled `advisoryCurrent` (or equivalent) — never aliased to `recorded`.
2. Does not mutate persistence, audit payloads, or export hashes.
3. Cites both the **recorded** definition hash and the **live** hash when they differ.

`GET …/agent-evaluation` returns **`recorded`** and **`advisoryCurrent`** perspectives (**TB-973**). Authority surfaces must read **`recorded`** only.

---

## Wrong definition and scorer bugs

| Situation | Rule |
|-----------|------|
| Later-found **wrong gate definition** | **TB-974** **Done** — [`QUALITY_GATE_WRONG_DEFINITION_MIGRATION_PLAYBOOK.md`](QUALITY_GATE_WRONG_DEFINITION_MIGRATION_PLAYBOOK.md): deprecate definition, remediate via re-execute or append-only supersession; never silent `UPDATE` |
| Scorer implementation bug (**TB-255** / **TB-256** Done) | Forward fix + new evaluates; do **not** rewrite committed history |
| PilotStrict calibration policy | Product policy (**TB-684** Done); versioning contract does not claim perfect calibration |

---

## Explicit non-claims

- Gate **Accepted** ≠ perpetual factual correctness — pass is **as-of** definition version/hash.
- Versioning contract ≠ admin supersede UI (follow-on). Full durable score persistence remains **TB-964**. Wrong-definition playbook: [`QUALITY_GATE_WRONG_DEFINITION_MIGRATION_PLAYBOOK.md`](QUALITY_GATE_WRONG_DEFINITION_MIGRATION_PLAYBOOK.md) (**TB-974** **Done**).
- Advisory recompute ≠ audit trail correction.
- Quality-gate pass ≠ execution-mode Real / sponsor ROI (**TB-963**, GTM **M-166**).

---

## Follow-on

| ID | Owns |
|----|------|
| **TB-973** | Persist version/hash; split `recorded` vs `advisoryCurrent` API (**Done**) |
| **TB-964** | Durable quality-outcome field checklist (reuse snapshot schema) |
| **TB-974** | Wrong-gate deprecation + remediation playbook (**Done**) |
| **TB-965** | Buyer copy guards (quality HOLD ≠ transport LLM error) |

---

## Related

- [`AGENT_OUTPUT_EVALUATION.md`](AGENT_OUTPUT_EVALUATION.md) · [`AGENT_TRACE_FORENSICS.md`](AGENT_TRACE_FORENSICS.md)
- [`QUALITY_GATE_REJECTION.md`](../runbooks/QUALITY_GATE_REJECTION.md)
- [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-972**–**TB-974**
