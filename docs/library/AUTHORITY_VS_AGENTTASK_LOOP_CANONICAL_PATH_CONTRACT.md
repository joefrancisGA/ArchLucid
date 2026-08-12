> **Scope:** Contributor-reference — Authority pipeline vs AgentTask-loop canonical path (TB-1007); not a buyer-facing trust claim.

# Authority vs AgentTask-loop canonical path (TB-1007)

> **Audience:** Contributors, principal architects, and integrators.  
> **Not** a buyer assurance claim — Authority-as-product-default ≠ “`/result` is retired” and ≠ dual storage pipelines still shipping.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#authority-vs-agenttask-loop-m-159) (GTM **M-159**).  
**Claim honesty:** [`PUBLIC_CLAIM_BOUNDARY_GUIDE.md`](PUBLIC_CLAIM_BOUNDARY_GUIDE.md) (GTM **M-158**).  
**Flows:** [`ARCHITECTURE_FLOWS.md`](ARCHITECTURE_FLOWS.md) Flow A1.  
**HTTP contracts:** [`API_CONTRACTS.md`](API_CONTRACTS.md).  
**ADRs:** [0030](../architecture/adrs/0030-coordinator-authority-pipeline-unification.md) · [0042](../architecture/adrs/0042-canonical-run-write-surface.md).

---

## Decision in one line

**Authority pipeline is canonical** for new product surfaces. `execute` / `result` / `commit` are the **AgentTask / AgentResult extension loop** (docs historically said “legacy coordinator”) — **not** a second storage pipeline. Those verbs must **not** be used to finish an Authority-finalized run.

---

## Canonical path (new surfaces)

| Step | Component |
|------|-----------|
| Create | `POST /v1/architecture/request` |
| Orchestrate | `IAuthorityRunOrchestrator` / `AuthorityPipelineStagesExecutor` |
| Finalize | `FinalizeCommittedPipelineAsync` |
| Read | Poll / detail / exports on `v1/architecture/*` |

Dual coordinator **storage** and dual orchestrators were retired (ADR 0030 / **TB-919**). Current HTTP write family is `v1/architecture/*` (ADR 0042).

---

## Task loop (intentional AgentTask ownership)

| Verb | When valid |
|------|------------|
| `execute` | AgentTask-driven agents (simulator/real), trial/QuickStart, selective re-execute (**TB-938**) when task state permits |
| `result` | External / agent result push while run is in `TasksGenerated` / `WaitingForResults` / `PartiallyCompleted` / `FailedPartial` (generated, waiting, or partial-recovery states per `RunStateTransitionService.ValidateResultSubmissionAllowed`) |
| `commit` | Completing a task-owned run — still via `AuthorityDrivenArchitectureRunCommitOrchestrator` (not a second commit store) |

“Legacy coordinator” is a **vocabulary warning**, not evidence that dual golden-manifest storage is still live.

---

## Forbidden / must-not-finish-with

| Situation | Rule |
|-----------|------|
| Authority already finalized | Skip `execute` / `result`; `commit` may be idempotent **200** only — not a second finish |
| Async queue wait (`ContextSnapshotId` null) | Do not force task-loop completion |
| `result` outside generated/waiting/partial-recovery states | Invalid lifecycle |
| Mixing models after Authority finalize | Do not reopen a finished Authority run via the task loop |
| “Always execute after create” | False for Authority-complete creates |

---

## Explicit non-claims

- Do **not** say every create requires `execute` before value.
- Do **not** say dual coordinator/authority **storage** pipelines still ship as defaults.
- Do **not** say `/result` is fully retired (sunset phases in [ADR 0066](../architecture/adrs/0066-agent-result-append-sunset.md); route delete is a follow-on TB).
- Do **not** reopen Done ADR 0030 / ADR 0042 / **TB-305** / **TB-919**.
- Do **not** close honesty CI (**TB-1008**), `/result` sunset (**TB-1034**), or soft-bridge retirement (**TB-1204**) by publishing this matrix.

---

## Next strangler slice (owned elsewhere)

| Work | Owner |
|------|-------|
| Product-default freeze on Authority A0; rename “legacy coordinator” → AgentTask extension loop | **TB-1034** Done — [`STRANGLER_NEXT_SLICE_AUTHORITY_FREEZE_AND_RESULT_SUNSET_CONTRACT.md`](./STRANGLER_NEXT_SLICE_AUTHORITY_FREEZE_AND_RESULT_SUNSET_CONTRACT.md) / **M-185** |
| Owner ADR to sunset `POST …/result` | [ADR 0066](../architecture/adrs/0066-agent-result-append-sunset.md) (**TB-1034** Done); implementation TB for deprecation headers |
| Soft-bridge / discipline-test retirement | **TB-1204** / **TB-1205** |

---

## Follow-on / CI anchors (**TB-1008**)

| Anchor | Purpose |
|--------|---------|
| This contract + Flow A1 | Required cite near always-execute / dual-pipeline language |
| Fail buyer/integrator stubs | “Always execute after create”; “dual coordinator storage still live”; “`result` finalizes/commits” contradicting ADR 0042 |
| Coordinate | **TB-1004** (manifest substitutes) — do not duplicate commit-as-signed-package rules |
| Verification | Existing Flow A1 / architecture commit tests — do not delete public routes here |

---

## Related

- GTM **M-158** / **M-159** / **M-185** / **M-205**
- Done **TB-305** / **TB-919** · Open **TB-1008** · **TB-1034** · **TB-1204**
