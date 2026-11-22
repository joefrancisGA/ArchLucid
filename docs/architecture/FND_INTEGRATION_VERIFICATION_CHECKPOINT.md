# FND-001–015 integration verification checkpoint (2026-11-22)

This is a **point-in-time** report, not a CI sign-off. PRs are subject to subsequent updates and GitHub queue delays.

## Checked pull requests
FND-002 #7648, FND-003 #7649, FND-004 #7651, FND-005 #7653, FND-006 #7654, FND-007 #7655, FND-008 #7656, FND-009 #7657, FND-010 #7658, FND-011 #7659, FND-012 #7660, FND-013 #7661, FND-014 #7662, FND-015 #7663.

FND-001 was previously source-mapped; this pass did **not** establish a merged PR for FND-001.

### Workflow snapshot
- FND-002: focused contract compatibility **success**; Merge Protection **failure** because PR was draft; Refresh OpenAPI v1 snapshot **failure** (job exited 127 while building TypeScript, root cause requires further inspection); main CI pending.
- FND-003–015: all workflows returned by the commit-scoped GitHub lookup were queued at time checked. No verified pass or merge should be inferred.
- The commit-scoped lookup is not a definitive live PR merge-state API. Recheck PR heads and required checks before any merge.

## First concrete integration: FND-011 read-only adapter
- Existing production endpoint: `ArchLucid.Api/Controllers/Planning/GraphController.Snapshot.cs`, `GET /v1/evidence-graph/snapshot`, anchored by run and `asOf`.
- Authorization boundary: `GraphController.cs` uses `ArchLucidPolicies.ReadAuthority`, tenant tier, scope provider and rate limiting.
- Data contract: `ArchLucid.Contracts/Persistence/Graph/GraphSnapshot.cs` uses integer schema version 1, IDs, timestamp, nodes, edges and warnings.
- Existing guards: scope-based run lookup, sealed-manifest checks, 413 full-graph limit, and paged graph reads.
- FND-005 trust seam: no new evidence source may be invented. A future adapter must resolve FND-005 source evidence through authenticated tenant-scoped storage and verify content digests.

### Implemented here
`scripts/integration/fnd011_snapshot_adapter.py` is a **pure, executable conversion adapter** for an already-authorized GraphSnapshot-shaped record and trusted scope. It preserves IDs and warnings, rejects run mismatch and dangling graph edges, marks missing provenance empty, evaluates optional freshness policy and performs no I/O. Unit tests cover mismatch, freshness, missing scope, malformed topology and nonmutation.

### Remaining integration work
This Python adapter is **not wired into the ASP.NET Core endpoint or SecureNow**. It cannot enforce tenant authorization itself; the caller must use the existing authenticated controller and sealed-manifest guards. The new FND-011 exchange schema is in a separate unmerged PR. Do not enable the feature or advertise end-to-end SecureNow consumption until a .NET service adapter, authorization tests and contract validation are completed.
