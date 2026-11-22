# ADR FND-011 — Read-only architecture snapshot exchange

Status: Proposed schema-only foundation (2026-11-22). No new HTTP endpoint is implemented.

## Source mapping
- `ArchLucid.Contracts/Persistence/Graph/GraphSnapshot.cs`: persisted run-scoped graph, integer `SchemaVersion=1`, graph/context/run identifiers, created time, nodes/edges/warnings.
- `ArchLucid.Api/Controllers/Planning/GraphController.Snapshot.cs`: existing `GET snapshot` temporal read, scope-bound run lookup, sealed manifest guards, and 413 size handling.
- `docs/library/KNOWLEDGE_GRAPH.md`: existing evidence-graph read endpoints, pagination, relational persistence, and truncation warnings.

## Decision
Define an isolated **read-only exchange response** for future SecureNow consumption. It carries semantic envelope version 1.0.0, original integer graph version, authenticated scope identifiers, freshness status, source lineage, nodes and edges. `readOnly=true` is a descriptive contract constraint, **not** authorization.

## Required implementation gates
1. Do not create a second graph store or bypass existing sealed-manifest and scoped-read guards. Adapt existing authorized API queries.
2. Derive tenant/workspace/project scope from server-side authentication; do not trust query/body IDs.
3. Preserve existing 413 and pagination limits. Do not expose unbounded graphs or leak cross-tenant node/edge metadata.
4. Freshness is `unknown` until evaluated against trusted collection and commit times. A timestamp alone is not a freshness guarantee.
5. Resolve evidence references under tenant authorization. Missing provenance must remain visible, not invented.
6. Check node/edge referential integrity and warning propagation at adapter time. Schema shape validation alone cannot do so.
7. Do not add write operations, remediation authority, or feature enablement in this PR.

## Integration plan
After independent review, add a read-only adapter around existing graph services, contract tests for tenant denial, stale/unknown snapshots, large graph pagination, missing evidence and sealed-manifest conflicts. This change does not modify 1.0 runtime behavior.
