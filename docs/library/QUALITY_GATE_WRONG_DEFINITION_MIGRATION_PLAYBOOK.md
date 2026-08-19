> **Scope:** Contributor + operator playbook — wrong quality-gate definition remediation (TB-974); implements **TB-972** immutability rules when a definition (not just a threshold upgrade) was later found incorrect.

# Wrong quality-gate definition migration playbook (TB-974)

> **Audience:** Operators, principal architects, and contributors remediating runs evaluated under a definition later found too loose, too strict, or affected by a scorer bug.  
> **Not** a buyer assurance claim — the playbook describes honest remediation; it does not prove perfect gate calibration.

**Versioning contract:** [`QUALITY_GATE_DEFINITION_VERSIONING_CONTRACT.md`](QUALITY_GATE_DEFINITION_VERSIONING_CONTRACT.md) (TB-972 **Done**).  
**Recorded vs advisory:** [`AGENT_OUTPUT_EVALUATION.md`](AGENT_OUTPUT_EVALUATION.md) (TB-973 **Done**).  
**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#quality-gate-versioning-m-130) (GTM **M-130**).  
**Reference type:** `ArchLucid.Core.QualityGates.QualityGateSupersedingEvaluation`.

---

## Decision in one line

When a gate definition was **wrong** (not merely superseded by policy), remediate with **deprecate + selective re-execute or append-only supersession** — **never** silent `UPDATE`/`DELETE` of recorded outcomes, run status, sponsor proof, or export attestation.

---

## Classify the finding

| Class | Symptom | Typical remediation |
|-------|---------|---------------------|
| **Too loose** (`QualityGateWrongDefinitionClass.TooLoose`) | Accepted packages should not have passed under corrected floors | Deprecate bad version; selective re-execute or supersede banner; governance review of affected runs |
| **Too strict** (`QualityGateWrongDefinitionClass.TooStrict`) | Rejected runs would pass under corrected floors | Deprecate bad version; selective re-execute for customer-visible reruns; optional supersede for audit narrative |
| **Scorer bug** (`QualityGateWrongDefinitionClass.ScorerImplementationBug`) | Implementation error (TB-255/TB-256 class) | Forward fix + new evaluates; optional advisory recompute; **no** history rewrite |

Threshold **upgrades** that tighten policy without a defect finding follow TB-972 immutability only — they do **not** require this playbook.

---

## Step 1 — Deprecate the bad definition version

1. Publish successor `QualityGateDefinitionSnapshot` with new `definitionVersion` + `contentHashSha256` (append-only; TB-972).
2. Set `deprecatedReason` on the bad row (human-readable: policy defect, pilot calibration error, scorer hotfix).
3. Emit audit event `Tenant.QualityGateDefinitionDeprecated` (`AuditEventTypes.TenantQualityGateDefinitionDeprecated`) with old version, new version, reason, actor.
4. Do **not** mutate `RecordedQualityGateOutcome` / `QualityGateDefinitionVersion` / `QualityGateDefinitionContentHashSha256` on existing traces.

---

## Step 2 — Choose remediation path

### Path A — Selective re-execute (preferred when customer must see a new authoritative outcome)

1. Use `POST …/execute/selective` (TB-938 **Done**) and `Run.SelectiveExecuteRequested` audit; re-executed tasks evaluate under **current** definition only (`QualityGateDefinitionSnapshotFactory`).
2. Run status / sponsor proof may change **only** when a new authoritative evaluate path completes — not from advisory recompute.
3. Original trace rows remain addressable for decision-time reconstruction.

### Path B — Append-only supersession (rare narrative / audit correction without re-execute)

1. Append `QualityGateSupersedingEvaluation` with actor, reason, misclassification class, original + successor definition snapshots, original recorded outcome, superseding outcome, timestamp.
2. Emit audit event `Run.QualityGateSupersedingEvaluationRecorded` (`AuditEventTypes.RunQualityGateSupersedingEvaluationRecorded`).
3. UI/API may show **recorded** outcome plus a non-authoritative supersede banner — never replace recorded fields in persistence.
4. Governance finalize, sponsor PDF, and export verify continue to treat **recorded** as decision-time fact unless the package is formally re-promoted after Path A.

**Forbidden:** `UPDATE` / `DELETE` on `dbo.AgentExecutionTraces` quality-gate snapshot columns; overwriting `ExecutionCompletedQualityRejected`; presenting `advisoryCurrent` as remediation.

---

## Step 3 — Surface and authority rules

| Surface | Shows |
|---------|--------|
| Run status / sponsor gates / export verify | **Recorded** outcome only (TB-973) |
| Operator forensics / agent-evaluation API | `recorded` + optional `advisoryCurrent`; supersede banner when append row exists |
| Buyer trust labels | Recorded definition hash + outcome; supersede is explanatory, not a silent rewrite |

---

## Dry-run fixture (acceptance)

`QualityGateWrongDefinitionDryRunFixtureTests` (Core unit tests) models:

1. Trace **T1** recorded **Accepted** under definition **v2026.07.01** / hash **H1**.
2. Operator deprecates **H1** → successor **v2026.08.09** / **H2** with `deprecatedReason`.
3. Append supersede row: original **Accepted** (H1) → superseding **Rejected** (H2) with actor + reason.
4. **Assert:** original snapshot fields on T1 unchanged; supersede row is additive; no mutation helper exists on recorded columns.

---

## Audit events

| Event | When |
|-------|------|
| `Tenant.QualityGateDefinitionDeprecated` | Bad definition version deprecated with successor |
| `Run.QualityGateSupersedingEvaluationRecorded` | Append-only supersession row recorded |

---

## Explicit non-claims

- Supersession ≠ automatic fleet re-grade of all historical runs.
- Remediation playbook ≠ perfect gate calibration (TB-684 product policy unchanged).
- Admin supersede UI and durable supersede table persistence are follow-on — V1 ships contract + types + playbook + tests.

---

## Related

- [`QUALITY_GATE_REJECTION.md`](../runbooks/QUALITY_GATE_REJECTION.md)
- [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-972**–**TB-974**
