> **Scope:** Operator scale triggers — single-replica V1 baseline; no Redis required by default.

# Scale operator decisions (V1)

Consolidates [`library/V1_CAPACITY_ENVELOPE.md`](../library/V1_CAPACITY_ENVELOPE.md), [`library/CAPACITY_AND_COST_PLAYBOOK.md`](../library/CAPACITY_AND_COST_PLAYBOOK.md), and LLM budget docs.

| Trigger | Symptom | Metric / signal | Action | Cost implication | Deferred (V2+) |
| --- | --- | --- | --- | --- | --- |
| Concurrent reviews > pilot envelope | Execute queue latency p95 high | `archlucid_review_execute_duration_ms` | Add Container App replicas; verify SQL DTU | Higher compute + SQL | Active/active multi-region |
| Outbox backlog growth | Integration jobs lag | outbox depth metric | Scale worker replica; check poison messages | Worker + Service Bus | — |
| LLM hard-cap hits | Runs stop mid-flight | budget status WARN/HOLD in proof | Raise per-tenant budget or reduce agent scope | Azure OpenAI spend | — |
| Graph compare slow | UI compare timeouts | graph query duration | Evaluate Redis cache enablement | Redis cache cost | Distributed graph cache hardening |
| Retrieval latency | RAG p95 high | retrieval duration telemetry | Reindex corpus; check embedding drift | Storage + OpenAI embed | Graph-RAG |
| Evidence blob growth | Storage cost spike | blob container size | Run trace cleanup job; tighten retention | Storage | — |

**V1 default:** single-replica API acceptable for pilot; enable Redis only when table trigger is met.

**Evidence:** attach scale notes to release handoff via `scripts/Emit-ReleaseReadinessEvidence.ps1`.

**Related:** [`library/V1_RELEASE_CHECKLIST.md`](../library/V1_RELEASE_CHECKLIST.md) · [`library/DEPLOYMENT_RUNBOOK.md`](../library/DEPLOYMENT_RUNBOOK.md)
