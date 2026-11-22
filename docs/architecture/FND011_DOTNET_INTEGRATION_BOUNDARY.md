# FND-011 .NET integration boundary

This PR adds a C# projection in `ArchLucid.Api/Controllers/Planning/SecureNowSnapshotProjection.cs` and seven .NET unit tests. It is deliberately **not wired into an HTTP endpoint**.

## Existing authority chain (unchanged)
`GraphController` has `[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]`, tenant-tier restrictions and rate limiting. `GetArchitectureGraphTemporalSnapshot` obtains `IScopeContextProvider.GetCurrentScope()`, looks up the run under that scope, resolves a graph by project and time, checks both sealed manifests and enforces full-graph size limits before returning graph data.

## Intended safe invocation
After those guards pass, pass the **persisted GraphSnapshot**, authenticated `ScopeContext`, and resolved run ID into `SecureNowSnapshotProjection.Project`. Never use a scope supplied by a request body or call the projector directly from an unauthenticated route.

The projector checks nonempty tenant/workspace/project, exact run match, source schema version, node identity, edge referential integrity, timestamps and freshness. It copies nodes/edges/warnings without modifying the source. Missing source evidence remains empty, not fabricated.

## Limitations and next gate
These unit tests exercise the projector's fail-closed inputs; they do **not** prove HTTP tenant isolation, since the projector itself cannot authenticate the supplied scope. It is not a production SecureNow consumer, an authorization policy handler or an independent evidence verifier. The FND-011 schema is still in separate PR #7659.

Before activation, implement a server-side endpoint/consumer behind a disabled-by-default flag that calls only the existing authorized and sealed-manifest-guarded retrieval path. Add authenticated cross-tenant HTTP integration tests, 413/pagination tests and JSON Schema validation against the merged FND-011 contract. Keep all 1.0 routes unchanged until then.
