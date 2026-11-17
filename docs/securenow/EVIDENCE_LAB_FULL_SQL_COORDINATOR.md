> **Scope:** Internal SecureNow engineering verification of a synthetic, SQL-backed full post-materialization pipeline; not customer Azure collection, deployment authorization, security clearance, or production-scale readiness.

# SecureNow Evidence Lab — full SQL coordinator replay

**Increment 6** on a branch based on \`master\`. RC43 remains unchanged.

## What this test exercises

File: \`ArchLucid.Persistence.Tests/InfraEvidence/SecureNowFullCoordinatorSqlReplayTests.cs\`

The test constructs a synthetic Azure extractor ZIP containing an inventoried storage account and a documented Contributor role assignment. It persists the package and snapshot header through existing SQL repositories, then invokes production \`AzureInventorySnapshotMaterializer\` with the **real** \`AzureInventorySnapshotPostMaterializeCoordinator\`.

The coordinator invokes all eight production security engines in their production order:

1. Privilege paths
2. Intended reachability
3. Toxic combinations
4. Capability-to-flow
5. Shared-control blast radius
6. Four-reality drift
7. Path ranking
8. Cut-point analysis

It then executes production security-path routing synchronization.

All eight engines use the real SQL inventory, path, and operational-finding repositories. Ranking, cut-point, search-coverage, and routing repositories are likewise SQL-backed. The fixture provides a new, synthetic tenant/workspace/project and subscription for each run.

### Acceptance checks

- The materializer succeeds with an actual normalized snapshot.
- A known-positive Contributor role yields **at least one persisted privilege path**, with nonempty cited hops and a path-linked operational finding.
- The ranking SQL repository contains one rank per persisted path.
- The cut-point repository is queryable; zero cut points can be legitimate for this tiny graph and is not artificially treated as failure.
- A second explicit invocation of every production engine must return \`Succeeded=true\`; the current coordinator returns a plain \`Task\` and does not propagate individual engine \`Succeeded=false\` results. This stage-result limitation must not be hidden.
- Foreign tenants, workspaces and projects cannot read paths, ranks, cut points or linked findings.
- Re-running the coordinator produces the same sorted canonical path hashes and the same number of ranks, without duplicating paths.

## Commands and environment

\`\`\`bash
dotnet test ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj \
  --filter 'FullyQualifiedName~SecureNowFullCoordinatorSqlReplayTests' \
  --logger 'console;verbosity=normal'
\`\`\`

This runs under the existing SQL fixture and its DbUp-migrated test database. A SQL-unavailable skip is **not a passing test**. The test requires a database whose catalog name contains \`Test\` as a simple additional guard, but naming alone cannot prove that a database is disposable. The runner and operator must verify the database is nonproduction before executing. It applies schema and writes synthetic data to the designated test catalog. **Never run it against a customer or production connection.**

No live Azure, ARM, Microsoft Graph, paid AI, deployments, customer subscriptions or manually triggered CI runs are part of this increment. The test corpus is synthetic.

## Limitations and next checks

This is a **full coordinator call** over one deliberately small positive synthetic subscription, not yet a general-purpose command-line multi-subscription full-engine replay. It does not establish comprehensive graph accuracy, false-negative rates, complete collection, permitted access to missing Azure surfaces, buyer readiness or security compliance. It does not replay external effective policy versions, persisted operator dispositions or extra application knowledge.

One architectural issue merits follow-up: \`AzureInventorySnapshotPostMaterializeCoordinator\` currently awaits per-engine calls but discards each engine's \`Succeeded\` status. This test separately checks all eight stages, but a future production-safe result type should surface the failures without silently implying a successful analysis. A change to production failure handling requires focused review of existing behavior and compatibility; do not weaken fail-closed gates.

The next development increment should create a bounded, explicit, test-catalog-only CLI, persist per-stage success/failure/coverage in a run report, and test multiple snapshots and tenant/project isolation independently. Do not make up Azure outcomes or auto-answer human questions.

**Not ready for merge until the focused .NET/SQL test actually executes successfully**; queued, failed or skipped tests are not passes.
