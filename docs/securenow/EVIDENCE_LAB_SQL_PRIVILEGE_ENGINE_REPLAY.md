> **Scope:** Internal SecureNow assurance test for real offline ZIP-to-SQL privilege-path and operational-finding execution; not a full architecture-engine replay, release approval, Azure authorization, or customer assessment.

# SecureNow Evidence Lab — SQL privilege path replay (increment 5)

This step builds directly on the SQL-backed question replay tests already merged into **master**. It verifies that one **positive synthetic privilege path** derived from a stored Azure evidence ZIP passes through the *actual* production engine and SQL path/finding repositories.

## Test: real path with real persisted finding

File: \`ArchLucid.Persistence.Tests/InfraEvidence/SecureNowSqlPrivilegeEngineReplayTests.cs\`.

- Construct a synthetic Azure ZIP containing a storage account with a well-known Contributor role assignment. No real subscription identifiers, Azure credentials, or cloud resources.
- Persist the package, snapshot header and normalized evidence using the existing \`SqlAzureExtractorPackageRepository\`, \`SqlAzureInventorySnapshotRepository\`, \`SqlCloudResourceIdentityDirectory\`, and \`AzureInventorySnapshotMaterializer\`.
- Keep the full downstream materialization coordinator substituted with a no-op in **this narrow test only**, to isolate the engine under test. This **does not** prove the entire coordinator has run.
- Run production \`PrivilegePathEngine\` with the actual \`SqlSecurityEvidencePathRepository\`, \`SqlSecurityEvidencePathSearchCoverageRepository\`, \`OperationalSecurityFindingIngestService\`, and \`SqlOperationalSecurityFindingRepository\`.
- Demand a positive result: \`Succeeded\`, nonzero \`PathsDiscovered\`, \`PathsPersisted\`, and \`FindingsIngested\`. **An engine returning success with zero outputs is not enough** for this fixture.
- Independently read the SQL paths/hops and linked finding IDs, asserting snapshot/tenant/workspace/project scope and nonempty hops.
- Verify foreign tenant, foreign workspace, and foreign project scopes cannot read either paths or linked findings.
- Replay the engine on the same snapshot; require zero newly persisted paths, deduplicated findings, and an unchanged scoped path count.

## Run

\`\`\`bash
dotnet test ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj \
  --filter 'FullyQualifiedName~SecureNowSqlPrivilegeEngineReplayTests' \
  --logger 'console;verbosity=normal'
\`\`\`

**SQL fixture requirements:** The existing \`SqlServerPersistenceFixture\` requires a migrated SQL Server test catalog (usually \`ArchLucidPersistenceTests\`). Without SQL, the \`SkippableFact\` is skipped: **skip is not a pass**. The test itself guards the catalog name for \`Test\` to avoid accidentally using a production database. Do not point the fixture at customer resources.

## What is NOT established

This is a one-engine positive regression, not a complete run of \`AzureInventorySnapshotPostMaterializeCoordinator\` and not proof of six production security engines, ranking, cut points, policies, human dispositions or diagram reconciliation.

The follow-on full-replay feature should instantiate the complete coordinator and run a richer multi-resource, multi-subscription synthetic corpus with explicitly asserted positive and negative path truth, while maintaining a separately reviewable independent oracle. It must fail closed on engine errors, truncation, missing evidence, incorrect path provenance, tenant/project boundary violations or missing postconditions. Never auto-remediate or use live Azure in the lab.

**RC43 remains untouched.** This lab is separate master development; all owner-gated HOLD, sponsor-evidence, procurement and security controls remain in force.
