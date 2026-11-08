# SecureNow Evidence Lab — SQL-backed replay integration (increment 3)

**Scope:** reusable engineering verification based on the existing SQL integration-test fixture. This is **not yet** a general-purpose offline CLI for the complete security-path/findings pipeline.

## What was added

\`ArchLucid.Persistence.Tests/InfraEvidence/SecureNowSqlOfflineQuestionReplayTests.cs\` runs a synthetic, schema-v2 Azure ZIP through **real SQL-backed** persistence and production SecureNow question generation:

1. Generate a unique synthetic Azure subscription/resource ZIP in memory (no customer or Azure calls).
2. Use \`SqlAzureExtractorPackageRepository\` to persist the package in the existing, migrated SQL *test catalog*.
3. Use \`SqlAzureInventorySnapshotRepository\` to persist the scoped pending snapshot header.
4. Invoke production \`AzureInventorySnapshotMaterializer\`, using production \`SqlCloudResourceIdentityDirectory\` and snapshot repositories.
5. Explicitly substitute a no-op post-materialization coordinator: **no security path engines run**, and this is recorded as a limitation, not a successful path replay.
6. Use production \`SecureNowQuestionDispositionService.ListQuestionsAsync\` backed by \`SqlSecureNowQuestionDispositionRepository\` to obtain actual SQL-backed inventory/diagram questions.
7. Compare question key, resource identity and evidence fingerprint to the earlier native ZIP replay, which is independent of SQL.
8. Prove that other tenant, workspace and project scopes cannot retrieve the snapshot or its generated question queue.

The test suite uses the repository's existing \`SqlServerPersistenceFixture\`, whose SQL catalog is migrated by DbUp. It does not create a separate Azure collector, modify production question storage, accept risk, or mark a question resolved.

## Run this test

\`\`\`bash
dotnet test ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj \
  --filter 'FullyQualifiedName~SecureNowSqlOfflineQuestionReplayTests' \
  --logger 'console;verbosity=normal'
\`\`\`

**Important:** This suite uses a real SQL integration-test fixture and **skips when no SQL Server is available**. A skipped test is not a passing SQL parity proof. When using a supplied SQL connection string, the user is responsible for pointing the existing fixture only at a disposable, nonproduction SQL test catalog. The fixture applies schema migrations. Never point it at customer or production resources.

No Azure credentials, interactive cloud logins, HTTP, paid models, CI manual triggers, or customer subscriptions are involved.

## What remains before full replay claims

The test intentionally does not execute the \`AzureInventorySnapshotPostMaterializeCoordinator\` security engines: privilege, intended reachability, toxic combination, capability-to-flow, shared-control blast radius, four-reality drift, ranking, cut-points or routing synchronization. It does not load or replay the effective policy pack, inferred-connection proposals, persisted human answers, operational findings or historical policy versions. It verifies SQL-backed **snapshot materialization and question generation only**, with a no-op callback at the downstream boundary.

Next increments:
- Provision a self-contained disposable SQL database for a batch CLI and enforce explicit isolation from production; migrate it using the same schema path.
- Invoke the full production post-materialization coordinator with its real engine graph, not the no-op, and report actual path/finding outputs and errors.
- Load explicit, versioned policy pack and human dispositions, preserving their evidence fingerprints, expiry, origin, and audit history.
- Validate output provenance and isolation on multi-subscription, multi-project corpora, including negative authorization tests. Add deterministic replay-of-same-package checks and complete before/after question counts.
- Keep existing sponsor/ROI correctness, tenant/project scoping, procurement and owner-gated HOLDs. Never auto-answer or suppress questions.

The separate RC43 stabilization track remains untouched.
