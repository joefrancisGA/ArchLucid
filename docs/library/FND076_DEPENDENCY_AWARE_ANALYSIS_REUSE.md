> **Scope:** Contributor reference for the exact dependency and output matches required for Authority and SecureNow recovery. This does not authorize semantic equivalence or cross-scope reuse.

# FND-076 dependency-aware analysis reuse

FND-075 records completed work and owns leases, deadlines, retries and fencing. FND-076 determines whether completed work still matches the requested stage inputs. The v2 fingerprint hashes the scoped stage identity, versioned input values and the exact upstream output references. It does not equate different outputs on semantic grounds.

## Stage boundaries

| Stage group | Reuse inputs |
| --- | --- |
| Authority context | Scoped original work payload, engine build and context ingestion settings |
| Authority graph | Context checkpoint, pinned evidence and knowledge/architecture versions, graph settings |
| Authority findings | Exact graph and context checkpoints, policy/evidence pins, effective finding controls, scoped agent results and finding engine settings |
| Authority decision, artifact and publication group | All three upstream checkpoints plus decision/artifact configuration. Remains one atomic group |
| SecureNow path analysis | Authorized target and pinned prior capture, exact capture digests, collector and engine versions, path settings and the chosen full or carry-forward plan |
| SecureNow drift | Path dependencies plus target diagram reconciliation, pinned prior inventory and diff |
| SecureNow ranking and cut points | Completed path and drift outputs, active assertion IDs and rank weights, then the ranking output and approved remediation versions |
| SecureNow routing | Completed path/drift results for the target capture |

Authority checks scoped output availability, complete findings and current dependencies before committing. Migration 440 keeps superseded checkpoints as provenance. A changed input can supersede an inactive stage only while the run is unsealed. This does not reset its attempt count or deadline. Previous output rows are retained and sealed runs are not invalidated in place. Unreadable completed output fails closed rather than fabricating replacement provenance.

SecureNow reuses a prior result only when the capture pair is compatible, the inventory diff is empty, both snapshots are complete and fresh, and the prior successful job has a v2 receipt matching its exact authorized path output. Drift is always recomputed for the target. A missing receipt, changed capture or incomplete source uses full recomputation. Treat changed input on an already-started target plan as stale and require a new capture instead of writing an incompatible result into the old target. The coordinator rechecks its inputs before publishing success.

The conservative fallback intentionally does not infer path-specific equivalence for changed inventories. Generalized dependency graphs, semantic fingerprints and equivalence for more selective changed-inventory reuse remain FND-083, FND-084 and FND-086. Customer-facing coverage remains FND-077.

## Rollout

1. Apply tenant migration 440 and upgrade API and worker replicas before enabling `AnalysisExecution:EnableDependencyAwareAnalysisReuse`. It defaults off and uses the existing FND-075 durable Authority and SecureNow flags and infrastructure.
2. Enable in an isolated SQL environment and observe stage dispositions such as `stale_dependencies`, `output_missing`, `incomplete_findings` and `stale_snapshot_plan`. SecureNow's carry-forward window defaults to 24 hours via `AnalysisExecution:SecureNowReuseMaxAgeHours`.
3. Do not backfill legacy receipts or toggle the feature while versioned work is in flight. Drain or reconcile active jobs before disabling. An Authority legacy checkpoint without a compatible version may be superseded only in an unsealed run. An old SecureNow source without a receipt never qualifies for carry-forward. The migration rollback refuses to drop recorded supersession history.
