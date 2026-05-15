> **Scope:** Coverage gap analysis (merged Cobertura) - tables from the Cobertura file named under **Data source**; stale or partial local merges (or leftover shards under `coverage-gap-1a`) produce misleading percentages — clean the folder before `dotnet test` or use the CI **`coverage-merged-cobertura`** artifact.
>
> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.

# Coverage gap analysis (merged Cobertura)

**Data source:** `coverage-report-final\Cobertura.xml` (file mtime **2026-04-20 13:51:50 UTC**). For CI gate parity, prefer the **`coverage-merged-cobertura`** artifact from job **`.NET: merge coverage + gates`** (copy **`Cobertura.xml`** and run **`python scripts/ci/coverage_gap_analysis.py --cobertura <path>`**). See **`docs/library/CODE_COVERAGE.md`** — local merges without **`ARCHLUCID_SQL_TEST`** under-count SQL-only paths.

**Measurement:** Production `ArchLucid.*` assemblies only; excludes `*.Tests`, TestSupport, Benchmarks, and `ArchLucid.Worker` (`Program.cs` omitted per **`coverage.runsettings`** **`ExcludeByFile`**).

## All assemblies by line coverage (lowest first)

| Assembly | Line coverage % | Coverable lines (approx.) |
|----------|-----------------|---------------------------|
| ArchLucid.Persistence | 39.66 | 11201 |
| ArchLucid.Api | 60.79 | 16812 |
| ArchLucid.Host.Core | 71.19 | 8949 |
| ArchLucid.Application | 73.23 | 17865 |
| ArchLucid.AgentRuntime | 77.94 | 6125 |
| ArchLucid.Host.Composition | 79.45 | 2843 |
| ArchLucid.Persistence.Runtime | 80.05 | 1865 |
| ArchLucid.ArtifactSynthesis | 80.13 | 2738 |
| ArchLucid.Persistence.Alerts | 81.88 | 1920 |
| ArchLucid.Persistence.Coordination | 82.97 | 5824 |
| ArchLucid.Core | 84.58 | 3216 |
| ArchLucid.Persistence.Advisory | 85.35 | 1406 |
| ArchLucid.Cli | 86.70 | 1940 |
| ArchLucid.ContextIngestion | 91.01 | 1380 |
| ArchLucid.Contracts | 92.39 | 2001 |
| ArchLucid.Decisioning | 92.64 | 10404 |
| ArchLucid.Coordinator | 93.31 | 478 |
| ArchLucid.Retrieval | 95.07 | 610 |
| ArchLucid.KnowledgeGraph | 95.07 | 730 |
| ArchLucid.AgentSimulator | 96.45 | 564 |
| ArchLucid.Provenance | 96.70 | 666 |
| ArchLucid.Persistence.Integration | 99.19 | 494 |
| ArchLucid.Jobs.Cli | 100.00 | 36 |

## Per-assembly class gaps (by line coverage %)

Per Cobertura **class** aggregate `<lines>` rows. **Line coverage %** is **(coverable − uncovered) / coverable** for that class. **Partial types** merged by **class name + file**. Sort order: **lowest line % first**.

**Prior attempt?** — **Yes** if the fully-qualified type name (or its short name, length ≥ **8**) appears as a substring in `docs/library/COVERAGE_GAP_ANALYSIS_RECENT.md` (heuristic; very short names are not matched on their own).

### ArchLucid.Persistence (39.66% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.ArtifactBundles.ArtifactBundleRelationalRead` | `ArchLucid.Persistence\ArtifactBundles\ArtifactBundleRelationalRead.cs` | 0.00 | 177 | No |
| 2 | `ArchLucid.Persistence.ArtifactBundles.ArtifactBundleTraceJsonReader` | `ArchLucid.Persistence\ArtifactBundles\ArtifactBundleTraceJsonReader.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Persistence.Audit.NoOpAuditEventChangeFeedHandler` | `ArchLucid.Persistence\Audit\NoOpAuditEventChangeFeedHandler.cs` | 0.00 | 1 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.ArtifactBundles.ArtifactBundleRelationalRead` | `ArchLucid.Persistence\ArtifactBundles\ArtifactBundleRelationalRead.cs` | 0.00 | 177 | No |
| 2 | `ArchLucid.Persistence.ArtifactBundles.ArtifactBundleTraceJsonReader` | `ArchLucid.Persistence\ArtifactBundles\ArtifactBundleTraceJsonReader.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Persistence.Audit.NoOpAuditEventChangeFeedHandler` | `ArchLucid.Persistence\Audit\NoOpAuditEventChangeFeedHandler.cs` | 0.00 | 1 | No |
| 4 | `ArchLucid.Persistence.Billing.BillingTrialConversionGate` | `ArchLucid.Persistence\Billing\BillingTrialConversionGate.cs` | 0.00 | 14 | No |
| 5 | `ArchLucid.Persistence.Billing.SqlBillingLedger` | `ArchLucid.Persistence\Billing\SqlBillingLedger.cs` | 0.00 | 163 | No |
| 6 | `ArchLucid.Persistence.BlobStore.ArtifactBundlePayloadBlobEnvelope` | `ArchLucid.Persistence\BlobStore\ArtifactBundlePayloadBlobEnvelope.cs` | 0.00 | 36 | No |
| 7 | `ArchLucid.Persistence.BlobStore.ArtifactBundlePersistContext` | `ArchLucid.Persistence\BlobStore\ArtifactBundlePersistContext.cs` | 0.00 | 1 | No |
| 8 | `ArchLucid.Persistence.Concurrency.SqlSessionDistributedCreateRunIdempotencyLock` | `ArchLucid.Persistence\Concurrency\SqlSessionDistributedCreateRunIdempotencyLock.cs` | 0.00 | 55 | No |
| 9 | `ArchLucid.Persistence.Connections.SqlPrimaryMirroredReadReplicaConnectionFactory` | `ArchLucid.Persistence\Connections\SqlPrimaryMirroredReadReplicaConnectionFactory.cs` | 0.00 | 4 | No |
| 10 | `ArchLucid.Persistence.ContextSnapshots.ContextSnapshotRelationalRead` | `ArchLucid.Persistence\ContextSnapshots\ContextSnapshotRelationalRead.cs` | 0.00 | 168 | No |
| 11 | `ArchLucid.Persistence.Cosmos.AgentTraceDocument` | `ArchLucid.Persistence\Cosmos\AgentTraceDocument.cs` | 0.00 | 6 | No |
| 12 | `ArchLucid.Persistence.Cosmos.AuditEventDocument` | `ArchLucid.Persistence\Cosmos\AuditEventDocument.cs` | 0.00 | 13 | No |
| 13 | `ArchLucid.Persistence.Cosmos.GraphSnapshotDocument` | `ArchLucid.Persistence\Cosmos\GraphSnapshotDocument.cs` | 0.00 | 9 | No |
| 14 | `ArchLucid.Persistence.Data.Infrastructure.ExternalDbConnection` | `ArchLucid.Persistence\Data\Infrastructure\ExternalDbConnection.cs` | 0.00 | 9 | No |
| 15 | `ArchLucid.Persistence.Data.Repositories.ArchitectureRunListItem` | `ArchLucid.Persistence\Data\Repositories\ArchitectureRunListItem.cs` | 0.00 | 7 | No |
| 16 | `ArchLucid.Persistence.Data.Repositories.BackgroundJobRow` | `ArchLucid.Persistence\Data\Repositories\BackgroundJobRow.cs` | 0.00 | 12 | No |
| 17 | `ArchLucid.Persistence.Data.Repositories.ComparisonRecordSearchPredicateBuilder` | `ArchLucid.Persistence\Data\Repositories\ComparisonRecordSearchPredicateBuilder.cs` | 0.00 | 34 | No |
| 18 | `ArchLucid.Persistence.Data.Repositories.HostLeaderLeaseSnapshot` | `ArchLucid.Persistence\Data\Repositories\HostLeaderLeaseSnapshot.cs` | 0.00 | 3 | No |
| 19 | `ArchLucid.Persistence.Data.Repositories.NoOpAgentOutputEvaluationResultRepository` | `ArchLucid.Persistence\Data\Repositories\NoOpAgentOutputEvaluationResultRepository.cs` | 0.00 | 3 | No |
| 20 | `ArchLucid.Persistence.Data.Repositories.QueuedBackgroundJobPrepareResult` | `ArchLucid.Persistence\Data\Repositories\QueuedBackgroundJobPrepareResult.cs` | 0.00 | 5 | No |
| 21 | `ArchLucid.Persistence.Findings.FindingsSnapshotRelationalRead` | `ArchLucid.Persistence\Findings\FindingsSnapshotRelationalRead.cs` | 0.00 | 185 | Yes |
| 22 | `ArchLucid.Persistence.GoldenManifests.GoldenManifestPhase1RelationalRead` | `ArchLucid.Persistence\GoldenManifests\GoldenManifestPhase1RelationalRead.cs` | 0.00 | 258 | Yes |
| 23 | `ArchLucid.Persistence.Governance.CachingPolicyPackRepository` | `ArchLucid.Persistence\Governance\CachingPolicyPackRepository.cs` | 0.00 | 16 | No |
| 24 | `ArchLucid.Persistence.Governance.SqlExternalConnection` | `ArchLucid.Persistence\Governance\SqlExternalConnection.cs` | 0.00 | 11 | No |
| 25 | `ArchLucid.Persistence.GraphSnapshots.GraphSnapshotRelationalRead` | `ArchLucid.Persistence\GraphSnapshots\GraphSnapshotRelationalRead.cs` | 0.00 | 198 | Yes |
| 26 | `ArchLucid.Persistence.Identity.InMemoryNoTrialIdentityUserRepository` | `ArchLucid.Persistence\Identity\InMemoryNoTrialIdentityUserRepository.cs` | 0.00 | 7 | No |
| 27 | `ArchLucid.Persistence.Identity.SqlTrialIdentityUserRepository` | `ArchLucid.Persistence\Identity\SqlTrialIdentityUserRepository.cs` | 0.00 | 71 | No |
| 28 | `ArchLucid.Persistence.Notifications.DapperSentEmailLedger` | `ArchLucid.Persistence\Notifications\DapperSentEmailLedger.cs` | 0.00 | 18 | No |
| 29 | `ArchLucid.Persistence.Notifications.Email.AzureCommunicationEmailApi` | `ArchLucid.Persistence\Notifications\Email\AzureCommunicationEmailApi.cs` | 0.00 | 35 | No |
| 30 | `ArchLucid.Persistence.Notifications.Email.NoopEmailProvider` | `ArchLucid.Persistence\Notifications\Email\NoopEmailProvider.cs` | 0.00 | 2 | No |
| 31 | `ArchLucid.Persistence.Notifications.Email.SmtpEmailProvider` | `ArchLucid.Persistence\Notifications\Email\SmtpEmailProvider.cs` | 0.00 | 30 | No |
| 32 | `ArchLucid.Persistence.Notifications.InMemorySentEmailLedger` | `ArchLucid.Persistence\Notifications\InMemorySentEmailLedger.cs` | 0.00 | 5 | No |
| 33 | `ArchLucid.Persistence.Queries.DapperArtifactQueryService` | `ArchLucid.Persistence\Queries\DapperArtifactQueryService.cs` | 0.00 | 11 | No |
| 34 | `ArchLucid.Persistence.Queries.InMemoryArtifactQueryService` | `ArchLucid.Persistence\Queries\InMemoryArtifactQueryService.cs` | 0.00 | 11 | No |
| 35 | `ArchLucid.Persistence.RelationalRead.SqlRelationalScalarCount` | `ArchLucid.Persistence\RelationalRead\SqlRelationalScalarCount.cs` | 0.00 | 3 | No |
| 36 | `ArchLucid.Persistence.Repositories.CachingGoldenManifestRepository` | `ArchLucid.Persistence\Repositories\CachingGoldenManifestRepository.cs` | 0.00 | 22 | No |
| 37 | `ArchLucid.Persistence.Repositories.RunConcurrencyConflictException` | `ArchLucid.Persistence\Repositories\RunConcurrencyConflictException.cs` | 0.00 | 4 | No |
| 38 | `ArchLucid.Persistence.Scoping.EmptyPersistenceScopeContextProvider` | `ArchLucid.Persistence\Scoping\EmptyPersistenceScopeContextProvider.cs` | 0.00 | 6 | No |
| 39 | `ArchLucid.Persistence.Sql.SqlSchemaBootstrapper` | `ArchLucid.Persistence\Sql\SqlSchemaBootstrapper.cs` | 0.00 | 14 | No |
| 40 | `ArchLucid.Persistence.Tenancy.DapperTenantRepository` | `ArchLucid.Persistence\Tenancy\DapperTenantRepository.cs` | 0.00 | 342 | Yes |
| 41 | `ArchLucid.Persistence.Tenancy.DapperTenantTrialEmailContactLookup` | `ArchLucid.Persistence\Tenancy\DapperTenantTrialEmailContactLookup.cs` | 0.00 | 14 | No |
| 42 | `ArchLucid.Persistence.Tenancy.DapperUsageEventRepository` | `ArchLucid.Persistence\Tenancy\DapperUsageEventRepository.cs` | 0.00 | 118 | No |
| 43 | `ArchLucid.Persistence.Tenancy.Diagnostics.DapperTrialFunnelOperationalMetricsReader` | `ArchLucid.Persistence\Tenancy\Diagnostics\DapperTrialFunnelOperationalMetricsReader.cs` | 0.00 | 14 | No |
| 44 | `ArchLucid.Persistence.Tenancy.NoOpTenantHardPurgeService` | `ArchLucid.Persistence\Tenancy\NoOpTenantHardPurgeService.cs` | 0.00 | 1 | No |
| 45 | `ArchLucid.Persistence.Tenancy.NullTenantTrialEmailContactLookup` | `ArchLucid.Persistence\Tenancy\NullTenantTrialEmailContactLookup.cs` | 0.00 | 1 | No |
| 46 | `ArchLucid.Persistence.Tenancy.SqlFirstSessionLifecycleHook` | `ArchLucid.Persistence\Tenancy\SqlFirstSessionLifecycleHook.cs` | 0.00 | 10 | No |
| 47 | `ArchLucid.Persistence.Tenancy.SqlTenantHardPurgeService` | `ArchLucid.Persistence\Tenancy\SqlTenantHardPurgeService.cs` | 0.00 | 263 | No |
| 48 | `ArchLucid.Persistence.Tenancy.SqlTenantOnboardingStateRepository` | `ArchLucid.Persistence\Tenancy\SqlTenantOnboardingStateRepository.cs` | 0.00 | 8 | No |
| 49 | `ArchLucid.Persistence.Tenancy.TenantTierSql` | `ArchLucid.Persistence\Tenancy\TenantTierSql.cs` | 0.00 | 14 | No |
| 50 | `ArchLucid.Persistence.Tenancy.UsageMeterKindSql` | `ArchLucid.Persistence\Tenancy\UsageMeterKindSql.cs` | 0.00 | 20 | No |
| 51 | `ArchLucid.Persistence.Tenancy.InMemoryUsageEventRepository` | `ArchLucid.Persistence\Tenancy\InMemoryUsageEventRepository.cs` | 3.57 | 27 | No |
| 52 | `ArchLucid.Persistence.Billing.Stripe.StripeBillingProvider` | `ArchLucid.Persistence\Billing\Stripe\StripeBillingProvider.cs` | 9.66 | 131 | No |
| 53 | `ArchLucid.Persistence.Billing.BillingWebhookTrialActivator` | `ArchLucid.Persistence\Billing\BillingWebhookTrialActivator.cs` | 17.78 | 37 | No |
| 54 | `ArchLucid.Persistence.Billing.InMemoryBillingLedger` | `ArchLucid.Persistence\Billing\InMemoryBillingLedger.cs` | 22.97 | 57 | No |
| 55 | `ArchLucid.Persistence.Provenance.ProvenanceQueryService` | `ArchLucid.Persistence\Provenance\ProvenanceQueryService.cs` | 26.32 | 28 | No |
| 56 | `ArchLucid.Persistence.Billing.AzureMarketplace.MicrosoftMarketplaceJwtVerifier` | `ArchLucid.Persistence\Billing\AzureMarketplace\MicrosoftMarketplaceJwtVerifier.cs` | 26.47 | 25 | No |
| 57 | `ArchLucid.Persistence.Tenancy.SqlTrialFunnelCommitHook` | `ArchLucid.Persistence\Tenancy\SqlTrialFunnelCommitHook.cs` | 27.03 | 27 | No |
| 58 | `ArchLucid.Persistence.Repositories.GraphSnapshotEdgeRow` | `ArchLucid.Persistence\Repositories\GraphSnapshotEdgeIndexer.cs` | 28.57 | 5 | No |
| 59 | <code>ArchLucid.Persistence.Options.FixedOptionsMonitor`1</code> | `ArchLucid.Persistence\Options\FixedOptionsMonitor.cs` | 33.33 | 4 | No |
| 60 | `ArchLucid.Persistence.Tenancy.InMemoryTenantRepository` | `ArchLucid.Persistence\Tenancy\InMemoryTenantRepository.cs` | 33.85 | 170 | No |
| 61 | `ArchLucid.Persistence.Caching.HotPathCacheEviction` | `ArchLucid.Persistence\Caching\HotPathCacheEviction.cs` | 35.71 | 9 | No |
| 62 | `ArchLucid.Persistence.BlobStore.LargePayloadOffloadEvaluator` | `ArchLucid.Persistence\BlobStore\LargePayloadOffloadEvaluator.cs` | 41.67 | 7 | No |
| 63 | `ArchLucid.Persistence.Repositories.CachingRunRepository` | `ArchLucid.Persistence\Repositories\CachingRunRepository.cs` | 43.75 | 27 | No |
| 64 | `ArchLucid.Persistence.Billing.AzureMarketplace.AzureMarketplaceBillingProvider` | `ArchLucid.Persistence\Billing\AzureMarketplace\AzureMarketplaceBillingProvider.cs` | 49.24 | 100 | No |
| 65 | `ArchLucid.Persistence.Metering.UsageMeteringService` | `ArchLucid.Persistence\Metering\UsageMeteringService.cs` | 52.38 | 10 | No |
| 66 | `ArchLucid.Persistence.Serialization.GraphNodeJsonConverter` | `ArchLucid.Persistence\Serialization\GraphNodeJsonConverter.cs` | 57.14 | 21 | No |
| 67 | `ArchLucid.Persistence.Data.Infrastructure.MigrationCatalogMutexScope` | `ArchLucid.Persistence\Data\Infrastructure\MigrationCatalogMutexScope.cs` | 60.61 | 13 | No |
| 68 | `ArchLucid.Persistence.Serialization.GraphEdgeJsonConverter` | `ArchLucid.Persistence\Serialization\GraphEdgeJsonConverter.cs` | 62.50 | 15 | No |
| 69 | `ArchLucid.Persistence.Data.Repositories.NoOpHostLeaderLeaseRepository` | `ArchLucid.Persistence\Data\Repositories\NoOpHostLeaderLeaseRepository.cs` | 66.67 | 1 | No |
| 70 | `ArchLucid.Persistence.Caching.HotPathCacheKeys` | `ArchLucid.Persistence\Caching\HotPathCacheKeys.cs` | 70.00 | 3 | No |
| 71 | `ArchLucid.Persistence.Data.Infrastructure.GreenfieldBaselineMigrationRunner` | `ArchLucid.Persistence\Data\Infrastructure\GreenfieldBaselineMigrationRunner.cs` | 72.33 | 44 | No |
| 72 | `ArchLucid.Persistence.Queries.DapperAuthorityQueryService` | `ArchLucid.Persistence\Queries\DapperAuthorityQueryService.cs` | 72.73 | 15 | No |
| 73 | `System.Text.RegularExpressions.Generated.<RegexGenerator_g>F784EB680C21B4686F463E7BD9AB24CC1A1B996DCF3A8FED908D40FD2DF951F37__MigrationNumberRegex_0` | `ArchLucid.Persistence\obj\Release\net10.0\System.Text.RegularExpressions.Generator\System.Text.RegularExpressions.Generator.RegexGenerator\RegexGenerator.g.cs` | 74.07 | 14 | No |
| 74 | `ArchLucid.Persistence.Queries.RunSummaryDto` | `ArchLucid.Persistence\Queries\RunSummaryDto.cs` | 75.00 | 4 | No |
| 75 | `System.Text.RegularExpressions.Generated` | `ArchLucid.Persistence\obj\Release\net10.0\System.Text.RegularExpressions.Generator\System.Text.RegularExpressions.Generator.RegexGenerator\RegexGenerator.g.cs` | 75.44 | 14 | Yes |
| 76 | `ArchLucid.Persistence.Findings.FindingPayloadJsonCodec` | `ArchLucid.Persistence\Findings\FindingPayloadJsonCodec.cs` | 78.95 | 4 | No |
| 77 | `ArchLucid.Persistence.Data.Infrastructure.DatabaseMigrator` | `ArchLucid.Persistence\Data\Infrastructure\DatabaseMigrator.cs` | 79.17 | 10 | No |
| 78 | `ArchLucid.Persistence.Data.Repositories.InMemoryComparisonRecordRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryComparisonRecordRepository.cs` | 80.23 | 35 | No |
| 79 | `ArchLucid.Persistence.Queries.InMemoryAuthorityQueryService` | `ArchLucid.Persistence\Queries\InMemoryAuthorityQueryService.cs` | 81.82 | 10 | No |
| 80 | `ArchLucid.Persistence.BlobStore.GoldenManifestPayloadBlobEnvelope` | `ArchLucid.Persistence\BlobStore\GoldenManifestPayloadBlobEnvelope.cs` | 82.35 | 15 | No |
| 81 | `ArchLucid.Persistence.Governance.InMemoryPolicyPackVersionRepository` | `ArchLucid.Persistence\Governance\InMemoryPolicyPackVersionRepository.cs` | 83.64 | 9 | No |
| 82 | `ArchLucid.Persistence.Notifications.Email.AzureCommunicationServicesEmailProvider` | `ArchLucid.Persistence\Notifications\Email\AzureCommunicationServicesEmailProvider.cs` | 85.19 | 4 | No |
| 83 | `ArchLucid.Persistence.Connections.SqlReadReplicaConnectionStringResolver` | `ArchLucid.Persistence\Connections\SqlReadReplicaConnectionStringResolver.cs` | 87.50 | 2 | No |
| 84 | `ArchLucid.Persistence.Billing.BillingProviderRegistry` | `ArchLucid.Persistence\Billing\BillingProviderRegistry.cs` | 88.24 | 2 | No |
| 85 | `ArchLucid.Persistence.Data.Repositories.InMemoryAgentEvaluationRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryAgentEvaluationRepository.cs` | 88.46 | 3 | No |
| 86 | `ArchLucid.Persistence.Data.Repositories.InMemoryAgentResultRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryAgentResultRepository.cs` | 88.57 | 4 | No |
| 87 | `ArchLucid.Persistence.Findings.FindingsSnapshotLegacyJsonReader` | `ArchLucid.Persistence\Findings\FindingsSnapshotLegacyJsonReader.cs` | 88.89 | 1 | No |
| 88 | `ArchLucid.Persistence.Connections.ReadReplicaRoutedConnectionFactory` | `ArchLucid.Persistence\Connections\ReadReplicaRoutedConnectionFactory.cs` | 90.48 | 2 | No |
| 89 | `ArchLucid.Persistence.Data.Repositories.InMemoryDecisionNodeRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryDecisionNodeRepository.cs` | 91.67 | 2 | No |
| 90 | `ArchLucid.Persistence.Data.Repositories.InMemoryArchitectureRequestRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryArchitectureRequestRepository.cs` | 92.86 | 1 | No |
| 91 | `ArchLucid.Persistence.Governance.InMemoryPolicyPackChangeLogRepository` | `ArchLucid.Persistence\Governance\InMemoryPolicyPackChangeLogRepository.cs` | 92.86 | 4 | No |
| 92 | `ArchLucid.Persistence.Data.Repositories.InMemoryCoordinatorGoldenManifestRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryCoordinatorGoldenManifestRepository.cs` | 93.33 | 1 | No |
| 93 | `ArchLucid.Persistence.Data.Repositories.InMemoryGovernanceApprovalRequestRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryGovernanceApprovalRequestRepository.cs` | 93.75 | 6 | No |
| 94 | `ArchLucid.Persistence.Repositories.InMemoryRunRepository` | `ArchLucid.Persistence\Repositories\InMemoryRunRepository.cs` | 94.35 | 7 | No |
| 95 | `ArchLucid.Persistence.Conversation.InMemoryConversationMessageRepository` | `ArchLucid.Persistence\Conversation\InMemoryConversationMessageRepository.cs` | 94.74 | 1 | No |

### ArchLucid.Api (60.79% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Api.Auth.Services.ExternalIdIssuerPatterns` | `ArchLucid.Api\Auth\Services\ExternalIdIssuerPatterns.cs` | 0.00 | 4 | No |
| 2 | `ArchLucid.Api.Auth.Services.TrialExternalIdJwtBearerSupport` | `ArchLucid.Api\Auth\Services\TrialExternalIdJwtBearerSupport.cs` | 0.00 | 10 | No |
| 3 | `ArchLucid.Api.Controllers.Admin.AdminArchiveRunsBatchRequest` | `ArchLucid.Api\Controllers\Admin\AdminArchiveRunsBatchRequest.cs` | 0.00 | 1 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Api.Auth.Services.ExternalIdIssuerPatterns` | `ArchLucid.Api\Auth\Services\ExternalIdIssuerPatterns.cs` | 0.00 | 4 | No |
| 2 | `ArchLucid.Api.Auth.Services.TrialExternalIdJwtBearerSupport` | `ArchLucid.Api\Auth\Services\TrialExternalIdJwtBearerSupport.cs` | 0.00 | 10 | No |
| 3 | `ArchLucid.Api.Controllers.Admin.AdminArchiveRunsBatchRequest` | `ArchLucid.Api\Controllers\Admin\AdminArchiveRunsBatchRequest.cs` | 0.00 | 1 | No |
| 4 | `ArchLucid.Api.Controllers.Admin.AdminArchiveRunsByIdsRequest` | `ArchLucid.Api\Controllers\Admin\AdminArchiveRunsByIdsRequest.cs` | 0.00 | 1 | No |
| 5 | `ArchLucid.Api.Controllers.Admin.AsyncAuthorityPipelineFeatureState` | `ArchLucid.Api\Controllers\Admin\AdminController.cs` | 0.00 | 1 | No |
| 6 | `ArchLucid.Api.Controllers.Admin.DiagnosticsController` | `ArchLucid.Api\Controllers\Admin\DiagnosticsController.cs` | 0.00 | 21 | No |
| 7 | `ArchLucid.Api.Controllers.Admin.TenantProvisionAdminRequest` | `ArchLucid.Api\Controllers\Admin\TenantProvisionAdminRequest.cs` | 0.00 | 3 | No |
| 8 | `ArchLucid.Api.Controllers.Admin.TenantsAdminController` | `ArchLucid.Api\Controllers\Admin\TenantsAdminController.cs` | 0.00 | 24 | No |
| 9 | `ArchLucid.Api.Controllers.Advisory.RecommendationLearningController` | `ArchLucid.Api\Controllers\Advisory\RecommendationLearningController.cs` | 0.00 | 27 | No |
| 10 | `ArchLucid.Api.Controllers.Alerts.AlertRoutingSubscriptionsController` | `ArchLucid.Api\Controllers\Alerts\AlertRoutingSubscriptionsController.cs` | 0.00 | 72 | No |
| 11 | `ArchLucid.Api.Controllers.Alerts.AlertsAcknowledgeBatchItemResult` | `ArchLucid.Api\Controllers\Alerts\AlertsAcknowledgeBatchResponse.cs` | 0.00 | 3 | No |
| 12 | `ArchLucid.Api.Controllers.Alerts.AlertsAcknowledgeBatchRequest` | `ArchLucid.Api\Controllers\Alerts\AlertsAcknowledgeBatchRequest.cs` | 0.00 | 2 | No |
| 13 | `ArchLucid.Api.Controllers.Alerts.AlertsAcknowledgeBatchResponse` | `ArchLucid.Api\Controllers\Alerts\AlertsAcknowledgeBatchResponse.cs` | 0.00 | 1 | No |
| 14 | `ArchLucid.Api.Controllers.Alerts.AlertSimulationController` | `ArchLucid.Api\Controllers\Alerts\AlertSimulationController.cs` | 0.00 | 81 | No |
| 15 | `ArchLucid.Api.Controllers.Alerts.AlertTuningController` | `ArchLucid.Api\Controllers\Alerts\AlertTuningController.cs` | 0.00 | 45 | No |
| 16 | `ArchLucid.Api.Controllers.Alerts.CompositeAlertRulesController` | `ArchLucid.Api\Controllers\Alerts\CompositeAlertRulesController.cs` | 0.00 | 38 | No |
| 17 | `ArchLucid.Api.Controllers.Auth.TrialLocalIdentityAuthController` | `ArchLucid.Api\Controllers\Auth\TrialLocalIdentityAuthController.cs` | 0.00 | 102 | No |
| 18 | `ArchLucid.Api.Controllers.Authority.ArtifactExportController` | `ArchLucid.Api\Controllers\Authority\ArtifactExportController.cs` | 0.00 | 110 | No |
| 19 | `ArchLucid.Api.Controllers.Authority.AuthorityQueryController` | `ArchLucid.Api\Controllers\Authority\AuthorityQueryController.cs` | 0.00 | 117 | No |
| 20 | `ArchLucid.Api.Controllers.Authority.AuthorityReplayController` | `ArchLucid.Api\Controllers\Authority\AuthorityReplayController.cs` | 0.00 | 51 | No |
| 21 | `ArchLucid.Api.Controllers.Authority.AuthorityRunEventsController` | `ArchLucid.Api\Controllers\Authority\AuthorityRunEventsController.cs` | 0.00 | 65 | No |
| 22 | `ArchLucid.Api.Controllers.Authority.RunAgentEvaluationController` | `ArchLucid.Api\Controllers\Authority\RunAgentEvaluationController.cs` | 0.00 | 49 | No |
| 23 | `ArchLucid.Api.Controllers.Billing.BillingMarketplaceWebhookController` | `ArchLucid.Api\Controllers\Billing\BillingMarketplaceWebhookController.cs` | 0.00 | 45 | No |
| 24 | `ArchLucid.Api.Controllers.Billing.BillingStripeWebhookController` | `ArchLucid.Api\Controllers\Billing\BillingStripeWebhookController.cs` | 0.00 | 18 | No |
| 25 | `ArchLucid.Api.Controllers.E2e.E2EHarnessController` | `ArchLucid.Api\Controllers\E2e\E2eHarnessController.cs` | 0.00 | 73 | No |
| 26 | `ArchLucid.Api.Controllers.Governance.GovernanceApprovalBatchReviewRequest` | `ArchLucid.Api\Controllers\Governance\GovernanceApprovalBatchReviewRequest.cs` | 0.00 | 4 | No |
| 27 | `ArchLucid.Api.Controllers.Governance.GovernanceBatchReviewItemResult` | `ArchLucid.Api\Controllers\Governance\GovernanceBatchReviewResponse.cs` | 0.00 | 4 | No |
| 28 | `ArchLucid.Api.Controllers.Governance.GovernanceBatchReviewResponse` | `ArchLucid.Api\Controllers\Governance\GovernanceBatchReviewResponse.cs` | 0.00 | 1 | No |
| 29 | `ArchLucid.Api.Controllers.Planning.ComparisonController` | `ArchLucid.Api\Controllers\Planning\ComparisonController.cs` | 0.00 | 18 | No |
| 30 | `ArchLucid.Api.Controllers.Planning.ExplanationController` | `ArchLucid.Api\Controllers\Planning\ExplanationController.cs` | 0.00 | 88 | No |
| 31 | `ArchLucid.Api.Controllers.Planning.GraphController` | `ArchLucid.Api\Controllers\Planning\GraphController.cs` | 0.00 | 64 | No |
| 32 | `ArchLucid.Api.Controllers.Planning.ProvenanceController` | `ArchLucid.Api\Controllers\Planning\ProvenanceController.cs` | 0.00 | 22 | No |
| 33 | `ArchLucid.Api.Controllers.Planning.ProvenanceQueryController` | `ArchLucid.Api\Controllers\Planning\ProvenanceQueryController.cs` | 0.00 | 23 | No |
| 34 | `ArchLucid.Api.Controllers.RegistrationController` | `ArchLucid.Api\Controllers\RegistrationController.cs` | 0.00 | 101 | No |
| 35 | `ArchLucid.Api.Mapping.ConsultingDocxJobPayloadMapper` | `ArchLucid.Api\Mapping\ConsultingDocxJobPayloadMapper.cs` | 0.00 | 24 | No |
| 36 | `ArchLucid.Api.Models.Auth.TrialLocalRegisterRequest` | `ArchLucid.Api\Models\Auth\TrialLocalIdentityRequests.cs` | 0.00 | 2 | No |
| 37 | `ArchLucid.Api.Models.Auth.TrialLocalRegisterResponse` | `ArchLucid.Api\Models\Auth\TrialLocalIdentityRequests.cs` | 0.00 | 2 | No |
| 38 | `ArchLucid.Api.Models.Auth.TrialLocalTokenRequest` | `ArchLucid.Api\Models\Auth\TrialLocalIdentityRequests.cs` | 0.00 | 5 | No |
| 39 | `ArchLucid.Api.Models.Auth.TrialLocalTokenResponse` | `ArchLucid.Api\Models\Auth\TrialLocalIdentityRequests.cs` | 0.00 | 3 | No |
| 40 | `ArchLucid.Api.Models.Auth.TrialLocalVerifyEmailRequest` | `ArchLucid.Api\Models\Auth\TrialLocalIdentityRequests.cs` | 0.00 | 2 | No |
| 41 | `ArchLucid.Api.Models.E2e.E2eHarnessBillingSimulatePostRequest` | `ArchLucid.Api\Models\E2e\E2eHarnessBillingSimulatePostRequest.cs` | 0.00 | 6 | No |
| 42 | `ArchLucid.Api.Models.E2e.E2eHarnessTrialExpiresPostRequest` | `ArchLucid.Api\Models\E2e\E2eHarnessTrialExpiresPostRequest.cs` | 0.00 | 2 | No |
| 43 | `ArchLucid.Api.Models.Evolution.EvolutionSimulationRunResponse` | `ArchLucid.Api\Models\Evolution\EvolutionSimulationRunResponse.cs` | 0.00 | 7 | No |
| 44 | `ArchLucid.Api.Models.Learning.LearningPlanDetailResponse` | `ArchLucid.Api\Models\Learning\LearningPlanDetailResponse.cs` | 0.00 | 12 | No |
| 45 | `ArchLucid.Api.Models.Learning.LearningPlanEvidenceCountsResponse` | `ArchLucid.Api\Models\Learning\LearningPlanEvidenceCountsResponse.cs` | 0.00 | 3 | No |
| 46 | `ArchLucid.Api.Models.Learning.LearningPlanListItemResponse` | `ArchLucid.Api\Models\Learning\LearningPlanListItemResponse.cs` | 0.00 | 9 | No |
| 47 | `ArchLucid.Api.Models.Learning.LearningPlanStepResponse` | `ArchLucid.Api\Models\Learning\LearningPlanStepResponse.cs` | 0.00 | 4 | No |
| 48 | `ArchLucid.Api.Models.Learning.LearningThemeResponse` | `ArchLucid.Api\Models\Learning\LearningThemeResponse.cs` | 0.00 | 15 | No |
| 49 | `ArchLucid.Api.Models.Tenancy.TenantRegistrationRequest` | `ArchLucid.Api\Models\Tenancy\TenantRegistrationRequest.cs` | 0.00 | 3 | No |
| 50 | `ArchLucid.Api.Models.Tenancy.TenantTrialConvertRequest` | `ArchLucid.Api\Models\Tenancy\TenantTrialConvertRequest.cs` | 0.00 | 1 | No |
| 51 | `ArchLucid.Api.Services.Admin.DataConsistencyOrphanCounts` | `ArchLucid.Api\Services\Admin\DataConsistencyOrphanCounts.cs` | 0.00 | 5 | No |
| 52 | `ArchLucid.Api.Services.Admin.OrphanComparisonRemediationResult` | `ArchLucid.Api\Services\Admin\OrphanComparisonRemediationResult.cs` | 0.00 | 4 | No |
| 53 | `ArchLucid.Api.Controllers.Authority.AuthorityCompareController` | `ArchLucid.Api\Controllers\Authority\AuthorityCompareController.cs` | 15.09 | 45 | No |
| 54 | `ArchLucid.Api.Services.Admin.AdminDiagnosticsService` | `ArchLucid.Api\Services\Admin\AdminDiagnosticsService.cs` | 15.61 | 200 | Yes |
| 55 | `ArchLucid.Api.Controllers.Alerts.AlertsController` | `ArchLucid.Api\Controllers\Alerts\AlertsController.cs` | 16.33 | 82 | No |
| 56 | `ArchLucid.Api.Controllers.Advisory.AdvisoryController` | `ArchLucid.Api\Controllers\Advisory\AdvisoryController.cs` | 19.58 | 115 | Yes |
| 57 | `ArchLucid.Api.Controllers.Admin.AdminController` | `ArchLucid.Api\Controllers\Admin\AdminController.cs` | 28.57 | 45 | No |
| 58 | `ArchLucid.Api.OpenApi.MicrosoftOpenApiAnonymousSecurityOperationTransformer` | `ArchLucid.Api\OpenApi\MicrosoftOpenApiAnonymousSecurityOperationTransformer.cs` | 33.33 | 6 | No |
| 59 | `ArchLucid.Api.Services.LearningPlanningReadService` | `ArchLucid.Api\Services\LearningPlanningReadService.cs` | 40.77 | 77 | No |
| 60 | `ArchLucid.Api.Services.Evolution.EvolutionSimulationService` | `ArchLucid.Api\Services\Evolution\EvolutionSimulationService.cs` | 42.23 | 119 | Yes |
| 61 | `ArchLucid.Api.Controllers.Governance.GovernanceController` | `ArchLucid.Api\Controllers\Governance\GovernanceController.cs` | 45.39 | 148 | No |
| 62 | `ArchLucid.Api.Controllers.Advisory.AdvisorySchedulingController` | `ArchLucid.Api\Controllers\Advisory\AdvisorySchedulingController.cs` | 46.84 | 42 | No |
| 63 | `ArchLucid.Api.Controllers.Advisory.DigestSubscriptionsController` | `ArchLucid.Api\Controllers\Advisory\DigestSubscriptionsController.cs` | 46.99 | 44 | No |
| 64 | `ArchLucid.Api.Models.Evolution.EvolutionCandidateChangeSetResponseMapper` | `ArchLucid.Api\Models\Evolution\EvolutionCandidateChangeSetResponseMapper.cs` | 52.38 | 10 | No |
| 65 | `ArchLucid.Api.Controllers.Tenancy.TenantTrialController` | `ArchLucid.Api\Controllers\Tenancy\TenantTrialController.cs` | 52.69 | 44 | No |
| 66 | `ArchLucid.Api.Models.Evolution.EvolutionOutcomeShadowReader` | `ArchLucid.Api\Models\Evolution\EvolutionOutcomeShadowReader.cs` | 53.85 | 12 | No |
| 67 | `ArchLucid.Api.Controllers.Governance.GovernanceResolutionController` | `ArchLucid.Api\Controllers\Governance\GovernanceResolutionController.cs` | 54.39 | 26 | No |
| 68 | `ArchLucid.Api.Controllers.Governance.ManifestsController` | `ArchLucid.Api\Controllers\Governance\ManifestsController.cs` | 54.74 | 105 | No |
| 69 | `ArchLucid.Api.Controllers.Admin.ClientErrorTelemetryController` | `ArchLucid.Api\Controllers\Admin\ClientErrorTelemetryController.cs` | 56.41 | 17 | No |
| 70 | `ArchLucid.Api.Services.ReplayArtifactResponseFactory` | `ArchLucid.Api\Services\ReplayArtifactResponseFactory.cs` | 57.14 | 12 | No |
| 71 | `ArchLucid.Api.ProblemDetails.TrialLimitProblemResponse` | `ArchLucid.Api\ProblemDetails\TrialLimitProblemResponse.cs` | 57.38 | 26 | No |
| 72 | `ArchLucid.Api.ProblemDetails.ProblemDetailsExtensions` | `ArchLucid.Api\ProblemDetails\ProblemDetailsExtensions.cs` | 59.26 | 44 | No |
| 73 | `ArchLucid.Api.Controllers.Planning.ComparisonsController` | `ArchLucid.Api\Controllers\Planning\ComparisonsController.cs` | 61.90 | 112 | No |
| 74 | `ArchLucid.Api.Controllers.Planning.AskController` | `ArchLucid.Api\Controllers\Planning\AskController.cs` | 64.29 | 10 | No |
| 75 | `ArchLucid.Api.Filters.TrialLimitAuthorizationHandler` | `ArchLucid.Api\Filters\TrialLimitFilter.cs` | 65.00 | 7 | No |
| 76 | `ArchLucid.Api.Controllers.Planning.ConversationController` | `ArchLucid.Api\Controllers\Planning\ConversationController.cs` | 65.79 | 13 | No |
| 77 | `ArchLucid.Api.Filters.TrialLimitExceededAuditFilter` | `ArchLucid.Api\Filters\TrialLimitExceededAuditFilter.cs` | 66.67 | 1 | No |
| 78 | `ArchLucid.Api.Middleware.ApiDeprecationHeadersMiddleware` | `ArchLucid.Api\Middleware\ApiDeprecationHeadersMiddleware.cs` | 66.67 | 9 | No |
| 79 | `ArchLucid.Api.Mapping.ComparisonResponseMapper` | `ArchLucid.Api\Mapping\ComparisonResponseMapper.cs` | 68.00 | 8 | No |
| 80 | `ArchLucid.Api.Controllers.Governance.GovernancePreviewController` | `ArchLucid.Api\Controllers\Governance\GovernancePreviewController.cs` | 69.44 | 11 | No |
| 81 | `ArchLucid.Api.Controllers.Authority.RunsController` | `ArchLucid.Api\Controllers\Authority\RunsController.cs` | 69.80 | 45 | No |
| 82 | `ArchLucid.Api.Models.PagingParameters` | `ArchLucid.Api\Models\PagingParameters.cs` | 70.00 | 3 | No |
| 83 | `ArchLucid.Api.Startup.PipelineExtensions` | `ArchLucid.Api\Startup\PipelineExtensions.cs` | 70.00 | 36 | No |
| 84 | `ArchLucid.Api.Swagger.OpenApiAuthDocumentMutator` | `ArchLucid.Api\Swagger\OpenApiAuthDocumentMutator.cs` | 72.09 | 12 | No |
| 85 | `ArchLucid.Api.Controllers.Authority.AnalysisReportsController` | `ArchLucid.Api\Controllers\Authority\AnalysisReportsController.cs` | 73.21 | 56 | No |
| 86 | `ArchLucid.Api.Controllers.Authority.RunComparisonController` | `ArchLucid.Api\Controllers\Authority\RunComparisonController.cs` | 74.19 | 24 | No |
| 87 | `ArchLucid.Api.ApiFileResults` | `ArchLucid.Api\ApiFileResults.cs` | 75.00 | 1 | No |
| 88 | `ArchLucid.Api.ProblemDetails.ProblemCorrelation` | `ArchLucid.Api\ProblemDetails\ProblemCorrelation.cs` | 75.00 | 2 | No |
| 89 | `ArchLucid.Api.Swagger.OpenApiAuthAnonymousDetection` | `ArchLucid.Api\Swagger\OpenApiAuthAnonymousDetection.cs` | 75.00 | 2 | No |
| 90 | `ArchLucid.Api.Controllers.Authority.RunQueryController` | `ArchLucid.Api\Controllers\Authority\RunQueryController.cs` | 75.73 | 25 | No |
| 91 | `ArchLucid.Api.Controllers.Authority.ExportsController` | `ArchLucid.Api\Controllers\Authority\ExportsController.cs` | 76.15 | 31 | No |
| 92 | `ArchLucid.Api.Mapping.ReplayComparisonRequestMapper` | `ArchLucid.Api\Mapping\ReplayComparisonRequestMapper.cs` | 76.47 | 8 | No |
| 93 | `ArchLucid.Api.FileWithRangeResult` | `ArchLucid.Api\FileWithRangeResult.cs` | 77.05 | 14 | No |
| 94 | `ArchLucid.Api.Auth.Services.AuthServiceCollectionExtensions` | `ArchLucid.Api\Auth\Services\AuthServiceCollectionExtensions.cs` | 77.42 | 21 | No |
| 95 | `ArchLucid.Api.Filters.TrialLimitAuthorizationResultHandler` | `ArchLucid.Api\Filters\TrialLimitFilter.cs` | 80.00 | 2 | No |
| 96 | `ArchLucid.Api.Controllers.Authority.RunsController` | `ArchLucid.Api\obj\Release\net10.0\Microsoft.Gen.Logging\Microsoft.Gen.Logging.LoggingGenerator\Logging.g.cs` | 80.56 | 28 | No |
| 97 | `ArchLucid.Api.Startup.RateLimitingRolePartitionBuilder` | `ArchLucid.Api\Startup\RateLimitingRolePartitionBuilder.cs` | 80.65 | 6 | No |
| 98 | `ArchLucid.Api.Controllers.Billing.BillingCheckoutController` | `ArchLucid.Api\Controllers\Billing\BillingCheckoutController.cs` | 81.19 | 19 | No |
| 99 | `ArchLucid.Api.Controllers.Admin.AuditController` | `ArchLucid.Api\Controllers\Admin\AuditController.cs` | 83.33 | 12 | No |
| 100 | `ArchLucid.Api.Controllers.Governance.PolicyPacksController` | `ArchLucid.Api\Controllers\Governance\PolicyPacksController.cs` | 85.11 | 14 | No |
| 101 | `ArchLucid.Api.ProblemDetails.ApiProblemDetailsExceptionFilter` | `ArchLucid.Api\ProblemDetails\ApiProblemDetailsExceptionFilter.cs` | 85.71 | 1 | No |
| 102 | `ArchLucid.Api.Models.Evolution.EvolutionOutcomeParser` | `ArchLucid.Api\Models\Evolution\EvolutionOutcomeParser.cs` | 86.36 | 6 | No |
| 103 | `ArchLucid.Api.Services.Evolution.EvolutionSimulationReportMarkdownFormatter` | `ArchLucid.Api\Services\Evolution\EvolutionSimulationReportMarkdownFormatter.cs` | 87.50 | 16 | No |
| 104 | `ArchLucid.Api.Controllers.Authority.DocxExportController` | `ArchLucid.Api\Controllers\Authority\DocxExportController.cs` | 88.06 | 8 | No |
| 105 | `ArchLucid.Api.ProblemDetails.ApplicationProblemMapper` | `ArchLucid.Api\ProblemDetails\ApplicationProblemMapper.cs` | 88.12 | 19 | No |
| 106 | `ArchLucid.Api.Controllers.Notifications.CustomerNotificationChannelPreferencesController` | `ArchLucid.Api\Controllers\Notifications\CustomerNotificationChannelPreferencesController.cs` | 88.46 | 6 | No |
| 107 | `ArchLucid.Api.Services.Evolution.EvolutionSimulationReportBuilder` | `ArchLucid.Api\Services\Evolution\EvolutionSimulationReportBuilder.cs` | 88.89 | 12 | No |
| 108 | `ArchLucid.Api.Authentication.ApiKeyAuthenticationHandler` | `ArchLucid.Api\Authentication\ApiKeyAuthenticationHandler.cs` | 89.87 | 8 | No |
| 109 | `ArchLucid.Api.Auth.Services.ArchLucidRoleClaimsTransformation` | `ArchLucid.Api\Auth\Services\ArchLucidRoleClaimsTransformation.cs` | 90.24 | 4 | No |
| 110 | `ArchLucid.Api.Controllers.Advisory.LearningController` | `ArchLucid.Api\Controllers\Advisory\LearningController.cs` | 90.48 | 12 | No |
| 111 | `ArchLucid.Api.Formatters.AuditEventCsvFormatter` | `ArchLucid.Api\Formatters\AuditEventCsvFormatter.cs` | 90.62 | 6 | No |
| 112 | `ArchLucid.Api.Startup.InfrastructureExtensions` | `ArchLucid.Api\Startup\InfrastructureExtensions.cs` | 91.60 | 11 | No |
| 113 | `ArchLucid.Api.Controllers.Evolution.EvolutionController` | `ArchLucid.Api\Controllers\Evolution\EvolutionController.cs` | 92.31 | 10 | No |
| 114 | `ArchLucid.Api.Swagger.ProblemDetailsResponsesOperationFilter` | `ArchLucid.Api\Swagger\ProblemDetailsResponsesOperationFilter.cs` | 92.31 | 1 | No |
| 115 | `ArchLucid.Api.Controllers.Advisory.ProductLearningController` | `ArchLucid.Api\Controllers\Advisory\ProductLearningController.cs` | 93.37 | 11 | No |
| 116 | `ArchLucid.Api.Auth.Services.LocalTrialJwtIssuer` | `ArchLucid.Api\Auth\Services\LocalTrialJwtIssuer.cs` | 93.62 | 3 | No |
| 117 | `ArchLucid.Api.Controllers.Alerts.AlertRulesController` | `ArchLucid.Api\Controllers\Alerts\AlertRulesController.cs` | 94.59 | 2 | No |
| 118 | `ArchLucid.Api.Validators.PolicyPackRequestValidationRules` | `ArchLucid.Api\Validators\PolicyPackRequestValidationRules.cs` | 94.74 | 1 | No |

### ArchLucid.Host.Core (71.19% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Host.Core.Configuration.DataConsistencyEnforcementOptions` | `ArchLucid.Host.Core\Configuration\DataConsistencyEnforcementOptions.cs` | 0.00 | 6 | No |
| 2 | `ArchLucid.Host.Core.Configuration.DataConsistencyProbeOptions` | `ArchLucid.Host.Core\Configuration\DataConsistencyProbeOptions.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Host.Core.Configuration.Secrets.EnvironmentVariableSecretProvider` | `ArchLucid.Host.Core\Configuration\Secrets\EnvironmentVariableSecretProvider.cs` | 0.00 | 6 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Host.Core.Configuration.DataConsistencyEnforcementOptions` | `ArchLucid.Host.Core\Configuration\DataConsistencyEnforcementOptions.cs` | 0.00 | 6 | No |
| 2 | `ArchLucid.Host.Core.Configuration.DataConsistencyProbeOptions` | `ArchLucid.Host.Core\Configuration\DataConsistencyProbeOptions.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Host.Core.Configuration.Secrets.EnvironmentVariableSecretProvider` | `ArchLucid.Host.Core\Configuration\Secrets\EnvironmentVariableSecretProvider.cs` | 0.00 | 6 | No |
| 4 | `ArchLucid.Host.Core.Configuration.Secrets.KeyVaultSecretProvider` | `ArchLucid.Host.Core\Configuration\Secrets\KeyVaultSecretProvider.cs` | 0.00 | 21 | No |
| 5 | `ArchLucid.Host.Core.Integration.IntegrationEventServiceBusMessageDispatch` | `ArchLucid.Host.Core\Integration\IntegrationEventServiceBusMessageDispatch.cs` | 0.00 | 50 | No |
| 6 | `ArchLucid.Host.Core.Integration.ProcessMessageEventArgsSettlement` | `ArchLucid.Host.Core\Integration\IntegrationEventPeekLockSettlements.cs` | 0.00 | 3 | No |
| 7 | `ArchLucid.Host.Core.Integration.ServiceBusReceiverSettlement` | `ArchLucid.Host.Core\Integration\IntegrationEventPeekLockSettlements.cs` | 0.00 | 3 | No |
| 8 | `ArchLucid.Host.Core.Integration.TrialLifecycleEmailIntegrationEventHandler` | `ArchLucid.Host.Core\Integration\TrialLifecycleEmailIntegrationEventHandler.cs` | 0.00 | 26 | No |
| 9 | `ArchLucid.Host.Core.Jobs.AzureBlobBackgroundJobResultBlobAccessor` | `ArchLucid.Host.Core\Jobs\AzureBlobBackgroundJobResultBlobAccessor.cs` | 0.00 | 34 | No |
| 10 | `ArchLucid.Host.Core.Jobs.AzureStorageQueueBackgroundJobNotifySender` | `ArchLucid.Host.Core\Jobs\AzureStorageQueueBackgroundJobNotifySender.cs` | 0.00 | 6 | No |
| 11 | `ArchLucid.Host.Core.Jobs.BackgroundJobPersistenceMapper` | `ArchLucid.Host.Core\Jobs\BackgroundJobPersistenceMapper.cs` | 0.00 | 15 | No |
| 12 | `ArchLucid.Host.Core.Jobs.BackgroundJobQueueAddress` | `ArchLucid.Host.Core\Jobs\BackgroundJobQueueAddress.cs` | 0.00 | 11 | No |
| 13 | `ArchLucid.Host.Core.Jobs.BackgroundJobQueueProcessorHostedService` | `ArchLucid.Host.Core\Jobs\BackgroundJobQueueProcessorHostedService.cs` | 0.00 | 102 | No |
| 14 | `ArchLucid.Host.Core.Jobs.DurableBackgroundJobQueue` | `ArchLucid.Host.Core\Jobs\DurableBackgroundJobQueue.cs` | 0.00 | 46 | No |
| 15 | `ArchLucid.Host.Core.Startup.WorkerHostPipelineExtensions` | `ArchLucid.Host.Core\Startup\WorkerHostPipelineExtensions.cs` | 0.00 | 68 | No |
| 16 | `ArchLucid.Host.Core.Services.Delivery.CloudEventsWrappingWebhookPoster` | `ArchLucid.Host.Core\Services\Delivery\CloudEventsWrappingWebhookPoster.cs` | 8.33 | 33 | No |
| 17 | `ArchLucid.Host.Core.DataConsistency.DataConsistencyOrphanProbeExecutor` | `ArchLucid.Host.Core\DataConsistency\DataConsistencyOrphanProbeExecutor.cs` | 9.70 | 149 | No |
| 18 | `ArchLucid.Host.Core.Hosted.AuthorityPipelineWorkProcessor` | `ArchLucid.Host.Core\Hosted\AuthorityPipelineWorkProcessor.cs` | 15.22 | 78 | No |
| 19 | `ArchLucid.Host.Core.Health.RunGoldenManifestConsistencyHealthCheck` | `ArchLucid.Host.Core\Health\RunGoldenManifestConsistencyHealthCheck.cs` | 30.43 | 16 | No |
| 20 | `ArchLucid.Host.Core.Hosted.DataConsistencyOrphanProbeHostedService` | `ArchLucid.Host.Core\Hosted\DataConsistencyOrphanProbeHostedService.cs` | 31.25 | 22 | No |
| 21 | `ArchLucid.Host.Core.Startup.Validation.Rules.E2EHarnessRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\E2eHarnessRules.cs` | 33.33 | 6 | No |
| 22 | `ArchLucid.Host.Core.Jobs.ServiceBusIntegrationEventsArchLucidJob` | `ArchLucid.Host.Core\Jobs\ServiceBusIntegrationEventsArchLucidJob.cs` | 36.00 | 48 | No |
| 23 | `ArchLucid.Host.Core.Services.AuditRetryDrainHostedService` | `ArchLucid.Host.Core\Services\AuditRetryDrainHostedService.cs` | 48.39 | 16 | No |
| 24 | `ArchLucid.Host.Core.Configuration.E2EHarnessOptions` | `ArchLucid.Host.Core\Configuration\E2eHarnessOptions.cs` | 50.00 | 1 | No |
| 25 | `ArchLucid.Host.Core.Health.BlobStorageHealthCheck` | `ArchLucid.Host.Core\Health\BlobStorageHealthCheck.cs` | 50.00 | 8 | No |
| 26 | `ArchLucid.Host.Core.Health.ProcessTempDirectoryHealthCheck` | `ArchLucid.Host.Core\Health\ProcessTempDirectoryHealthCheck.cs` | 50.00 | 8 | No |
| 27 | `ArchLucid.Host.Core.Services.Ask.ContextBuilder` | `ArchLucid.Host.Core\Services\Ask\ContextBuilder.cs` | 50.00 | 41 | No |
| 28 | `ArchLucid.Host.Core.Notifications.Email.TrialLifecycleEmailPublishingAuditDecorator` | `ArchLucid.Host.Core\Notifications\Email\TrialLifecycleEmailPublishingAuditDecorator.cs` | 56.98 | 37 | No |
| 29 | `ArchLucid.Host.Core.Health.ComplianceRulePackHealthCheck` | `ArchLucid.Host.Core\Health\ComplianceRulePackHealthCheck.cs` | 57.14 | 3 | No |
| 30 | `ArchLucid.Host.Core.Startup.ArchLucidPersistenceStartup` | `ArchLucid.Host.Core\Startup\ArchLucidPersistenceStartup.cs` | 57.14 | 18 | No |
| 31 | `ArchLucid.Host.Core.Configuration.ArchLucidLegacyConfigurationWarnings` | `ArchLucid.Host.Core\Configuration\ArchLucidLegacyConfigurationWarnings.cs` | 57.89 | 8 | No |
| 32 | `ArchLucid.Host.Core.Integration.LoggingIntegrationEventHandler` | `ArchLucid.Host.Core\Integration\LoggingIntegrationEventHandler.cs` | 61.11 | 7 | No |
| 33 | `ArchLucid.Host.Core.Integration.NullIntegrationEventPublisher` | `ArchLucid.Host.Core\Integration\NullIntegrationEventPublisher.cs` | 66.67 | 2 | No |
| 34 | `ArchLucid.Host.Core.Startup.LlmPromptRedactionProductionWarningPostConfigure` | `ArchLucid.Host.Core\Startup\LlmPromptRedactionProductionWarningPostConfigure.cs` | 68.42 | 6 | No |
| 35 | `ArchLucid.Host.Core.Startup.Validation.Rules.HostLeaderElectionRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\HostLeaderElectionRules.cs` | 68.42 | 6 | No |
| 36 | `ArchLucid.Host.Core.Health.SchemaFilesHealthCheck` | `ArchLucid.Host.Core\Health\SchemaFilesHealthCheck.cs` | 69.70 | 10 | No |
| 37 | `ArchLucid.Host.Core.Jobs.JobRunTelemetry` | `ArchLucid.Host.Core\Jobs\JobRunTelemetry.cs` | 70.59 | 15 | No |
| 38 | `ArchLucid.Host.Core.Services.Ask.AskService` | `ArchLucid.Host.Core\Services\Ask\AskService.cs` | 73.18 | 59 | No |
| 39 | `ArchLucid.Host.Core.Startup.Validation.Rules.BackgroundJobsRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\BackgroundJobsRules.cs` | 75.00 | 6 | No |
| 40 | `ArchLucid.Host.Core.Startup.ObservabilityExtensions` | `ArchLucid.Host.Core\Startup\ObservabilityExtensions.cs` | 75.25 | 25 | No |
| 41 | `ArchLucid.Host.Core.Startup.Validation.Rules.DataArchivalRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\DataArchivalRules.cs` | 76.92 | 3 | No |
| 42 | `ArchLucid.Host.Core.Hosted.TrialLifecycleEmailScanHostedService` | `ArchLucid.Host.Core\Hosted\TrialLifecycleEmailScanHostedService.cs` | 78.57 | 6 | No |
| 43 | `ArchLucid.Host.Core.Services.ArchitectureApplicationService` | `ArchLucid.Host.Core\Services\ArchitectureApplicationService.cs` | 79.35 | 32 | No |
| 44 | `ArchLucid.Host.Core.Startup.Validation.Rules.LlmTokenQuotaRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\LlmTokenQuotaRules.cs` | 80.00 | 4 | No |
| 45 | `ArchLucid.Host.Core.Hosted.TrialLifecycleSchedulerHostedService` | `ArchLucid.Host.Core\Hosted\TrialLifecycleSchedulerHostedService.cs` | 80.56 | 7 | No |
| 46 | `ArchLucid.Host.Core.ProblemDetails.ProblemErrorCodes` | `ArchLucid.Host.Core\ProblemDetails\ProblemErrorCodes.cs` | 81.25 | 9 | No |
| 47 | `ArchLucid.Host.Core.Hosted.IntegrationEventOutboxHostedService` | `ArchLucid.Host.Core\Hosted\IntegrationEventOutboxHostedService.cs` | 81.48 | 5 | No |
| 48 | `ArchLucid.Host.Core.Jobs.InMemoryBackgroundJobQueue` | `ArchLucid.Host.Core\Jobs\InMemoryBackgroundJobQueue.cs` | 82.03 | 23 | No |
| 49 | `ArchLucid.Host.Core.Jobs.AuditEventChangeFeedArchLucidJob` | `ArchLucid.Host.Core\Jobs\AuditEventChangeFeedArchLucidJob.cs` | 82.61 | 4 | No |
| 50 | `ArchLucid.Host.Core.Services.ComparisonReplayApiService` | `ArchLucid.Host.Core\Services\ComparisonReplayApiService.cs` | 82.76 | 10 | No |
| 51 | `ArchLucid.Host.Core.Hosted.TenantHealthScoringHostedService` | `ArchLucid.Host.Core\Hosted\TenantHealthScoringHostedService.cs` | 82.86 | 6 | No |
| 52 | `ArchLucid.Host.Core.Startup.Diagnostics.StartupConfigurationFactsReader` | `ArchLucid.Host.Core\Startup\Diagnostics\StartupConfigurationFacts.cs` | 82.93 | 7 | No |
| 53 | `ArchLucid.Host.Core.Health.SqlConnectionHealthCheck` | `ArchLucid.Host.Core\Health\SqlConnectionHealthCheck.cs` | 83.33 | 3 | No |
| 54 | `ArchLucid.Host.Core.Hosted.OutboxOperationalMetricsHostedService` | `ArchLucid.Host.Core\Hosted\OutboxOperationalMetricsHostedService.cs` | 83.33 | 7 | No |
| 55 | `ArchLucid.Host.Core.Startup.Validation.Rules.ContentSafetyRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\ContentSafetyRules.cs` | 83.33 | 3 | No |
| 56 | `ArchLucid.Host.Core.Diagnostics.FakeAgentResultFactory` | `ArchLucid.Host.Core\Diagnostics\FakeAgentResultFactory.cs` | 83.38 | 57 | No |
| 57 | `ArchLucid.Host.Core.Jobs.DataArchivalArchLucidJob` | `ArchLucid.Host.Core\Jobs\DataArchivalArchLucidJob.cs` | 83.87 | 5 | No |
| 58 | `ArchLucid.Host.Core.ProblemDetails.ProblemSupportHints` | `ArchLucid.Host.Core\ProblemDetails\ProblemSupportHints.cs` | 86.05 | 6 | No |
| 59 | `ArchLucid.Host.Core.Middleware.PrometheusScrapeAuthMiddleware` | `ArchLucid.Host.Core\Middleware\PrometheusScrapeAuthMiddleware.cs` | 86.79 | 7 | No |
| 60 | `ArchLucid.Host.Core.Jobs.ArchLucidJobsOffload` | `ArchLucid.Host.Core\Jobs\ArchLucidJobsOffload.cs` | 87.50 | 1 | No |
| 61 | `ArchLucid.Host.Core.Hosted.HostLeaderElectionCoordinator` | `ArchLucid.Host.Core\Hosted\HostLeaderElectionCoordinator.cs` | 87.65 | 10 | No |
| 62 | `ArchLucid.Host.Core.Jobs.TrialLifecycleArchLucidJob` | `ArchLucid.Host.Core\Jobs\TrialLifecycleArchLucidJob.cs` | 88.00 | 3 | No |
| 63 | `ArchLucid.Host.Core.Jobs.OrphanProbeArchLucidJob` | `ArchLucid.Host.Core\Jobs\OrphanProbeArchLucidJob.cs` | 88.24 | 2 | No |
| 64 | `ArchLucid.Host.Core.Jobs.AdvisoryScanArchLucidJob` | `ArchLucid.Host.Core\Jobs\AdvisoryScanArchLucidJob.cs` | 90.00 | 2 | No |
| 65 | `ArchLucid.Host.Core.Jobs.TrialEmailScanArchLucidJob` | `ArchLucid.Host.Core\Jobs\TrialEmailScanArchLucidJob.cs` | 90.00 | 2 | No |
| 66 | `ArchLucid.Host.Core.Startup.Validation.Rules.ContainerJobsOffloadRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\ContainerJobsOffloadRules.cs` | 90.48 | 2 | No |
| 67 | `ArchLucid.Host.Core.Startup.Validation.Rules.LlmCompletionCacheRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\LlmCompletionCacheRules.cs` | 90.62 | 3 | No |
| 68 | `ArchLucid.Host.Core.Hosted.DataArchivalHostedService` | `ArchLucid.Host.Core\Hosted\DataArchivalHostedService.cs` | 91.89 | 3 | No |
| 69 | `ArchLucid.Host.Core.Hosted.AuthorityPipelineWorkHostedService` | `ArchLucid.Host.Core\Hosted\AuthorityPipelineWorkHostedService.cs` | 92.59 | 2 | No |
| 70 | `ArchLucid.Host.Core.Hosted.RetrievalIndexingOutboxHostedService` | `ArchLucid.Host.Core\Hosted\RetrievalIndexingOutboxHostedService.cs` | 92.59 | 2 | No |
| 71 | `ArchLucid.Host.Core.Authority.FeatureManagementAuthorityPipelineModeResolver` | `ArchLucid.Host.Core\Authority\FeatureManagementAuthorityPipelineModeResolver.cs` | 92.86 | 1 | No |
| 72 | `ArchLucid.Host.Core.Startup.Validation.Rules.SchemaValidationRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\SchemaValidationRules.cs` | 92.86 | 2 | No |
| 73 | `ArchLucid.Host.Core.Startup.Validation.Rules.AgentExecutionRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\AgentExecutionRules.cs` | 93.10 | 2 | No |
| 74 | `ArchLucid.Host.Core.Startup.Validation.Rules.ApiDeprecationRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\ApiDeprecationRules.cs` | 93.75 | 1 | No |
| 75 | `ArchLucid.Host.Core.Startup.Validation.Rules.CosmosPolyglotRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\CosmosPolyglotRules.cs` | 94.12 | 1 | No |
| 76 | `ArchLucid.Host.Core.Services.CircuitBreakerAuditBridge` | `ArchLucid.Host.Core\Services\CircuitBreakerAuditBridge.cs` | 94.19 | 5 | Yes |
| 77 | `ArchLucid.Host.Core.Hosted.DataArchivalHostIteration` | `ArchLucid.Host.Core\Hosted\DataArchivalHostIteration.cs` | 94.29 | 2 | No |
| 78 | `ArchLucid.Host.Core.Startup.RlsBypassPolicyBootstrap` | `ArchLucid.Host.Core\Startup\RlsBypassPolicyBootstrap.cs` | 94.44 | 1 | No |

### ArchLucid.Application (73.23% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Application.Analysis.ComparisonDriftReportExportService` | `ArchLucid.Application\Analysis\ComparisonDriftReportExportService.cs` | 0.00 | 26 | No |
| 2 | `ArchLucid.Application.Analysis.DriftReportDocxExport` | `ArchLucid.Application\Analysis\DriftReportDocxExport.cs` | 0.00 | 25 | No |
| 3 | `ArchLucid.Application.Analysis.ExportRecordDiffExportService` | `ArchLucid.Application\Analysis\ExportRecordDiffExportService.cs` | 0.00 | 32 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Application.Analysis.ComparisonDriftReportExportService` | `ArchLucid.Application\Analysis\ComparisonDriftReportExportService.cs` | 0.00 | 26 | No |
| 2 | `ArchLucid.Application.Analysis.DriftReportDocxExport` | `ArchLucid.Application\Analysis\DriftReportDocxExport.cs` | 0.00 | 25 | No |
| 3 | `ArchLucid.Application.Analysis.ExportRecordDiffExportService` | `ArchLucid.Application\Analysis\ExportRecordDiffExportService.cs` | 0.00 | 32 | No |
| 4 | `ArchLucid.Application.Determinism.DeterminismVersionConstants` | `ArchLucid.Application\Determinism\DeterminismVersionConstants.cs` | 0.00 | 1 | No |
| 5 | `ArchLucid.Application.Explanation.RunRationaleService` | `ArchLucid.Application\Explanation\RunRationaleService.cs` | 0.00 | 169 | No |
| 6 | `ArchLucid.Application.Identity.TrialBootstrapEmailVerificationPolicy` | `ArchLucid.Application\Identity\TrialBootstrapEmailVerificationPolicy.cs` | 0.00 | 17 | No |
| 7 | `ArchLucid.Application.Identity.TrialEmailNormalizer` | `ArchLucid.Application\Identity\TrialEmailNormalizer.cs` | 0.00 | 3 | No |
| 8 | `ArchLucid.Application.Identity.TrialEmailVerificationTokenHasher` | `ArchLucid.Application\Identity\TrialEmailVerificationTokenHasher.cs` | 0.00 | 3 | No |
| 9 | `ArchLucid.Application.Identity.TrialLocalAuthResult` | `ArchLucid.Application\Identity\ITrialLocalIdentityService.cs` | 0.00 | 3 | No |
| 10 | `ArchLucid.Application.Identity.TrialLocalIdentityService` | `ArchLucid.Application\Identity\TrialLocalIdentityService.cs` | 0.00 | 81 | No |
| 11 | `ArchLucid.Application.Identity.TrialLocalRegistrationResult` | `ArchLucid.Application\Identity\ITrialLocalIdentityService.cs` | 0.00 | 2 | No |
| 12 | `ArchLucid.Application.Notifications.Email.TrialLifecycleEmailDispatcher` | `ArchLucid.Application\Notifications\Email\TrialLifecycleEmailDispatcher.cs` | 0.00 | 184 | No |
| 13 | `ArchLucid.Application.Notifications.Email.TrialScheduledLifecycleEmailScanner` | `ArchLucid.Application\Notifications\Email\TrialScheduledLifecycleEmailScanner.cs` | 17.22 | 125 | No |
| 14 | `ArchLucid.Application.Analysis.ComparisonAuditService` | `ArchLucid.Application\Analysis\ComparisonAuditService.cs` | 35.59 | 38 | No |
| 15 | `ArchLucid.Application.Analysis.ComparisonRecordPayloadRehydrator` | `ArchLucid.Application\Analysis\ComparisonRecordPayloadRehydrator.cs` | 36.36 | 14 | No |
| 16 | `ArchLucid.Application.Analysis.ComparisonReplayService` | `ArchLucid.Application\Analysis\ComparisonReplayService.cs` | 37.17 | 120 | No |
| 17 | `ArchLucid.Application.Analysis.OpenXmlDocxDocumentBuilder` | `ArchLucid.Application\Analysis\OpenXmlDocxDocumentBuilder.cs` | 42.99 | 61 | No |
| 18 | `ArchLucid.Application.Jobs.BackgroundJobWorkUnitExecutor` | `ArchLucid.Application\Jobs\BackgroundJobWorkUnitExecutor.cs` | 43.14 | 29 | No |
| 19 | `ArchLucid.Application.Analysis.EndToEndReplayComparisonExportService` | `ArchLucid.Application\Analysis\EndToEndReplayComparisonExportService.cs` | 45.32 | 222 | Yes |
| 20 | `ArchLucid.Application.Analysis.EndToEndComparisonExportProfile` | `ArchLucid.Application\Analysis\EndToEndComparisonExportProfile.cs` | 50.00 | 3 | No |
| 21 | `ArchLucid.Application.Audit.RunPipelineTimelineItemDto` | `ArchLucid.Application\Audit\RunPipelineTimelineItemDto.cs` | 50.00 | 3 | No |
| 22 | `ArchLucid.Application.ConflictException` | `ArchLucid.Application\ConflictException.cs` | 50.00 | 2 | Yes |
| 23 | `ArchLucid.Application.Analysis.ConsultingDocxTemplateRecommendationService` | `ArchLucid.Application\Analysis\ConsultingDocxTemplateRecommendationService.cs` | 52.73 | 26 | No |
| 24 | `ArchLucid.Application.Governance.ApprovalSlaMonitor` | `ArchLucid.Application\Governance\ApprovalSlaMonitor.cs` | 52.94 | 40 | No |
| 25 | `ArchLucid.Application.Analysis.ComparisonReplayCostEstimator` | `ArchLucid.Application\Analysis\ComparisonReplayCostEstimator.cs` | 54.12 | 39 | No |
| 26 | `ArchLucid.Application.Analysis.ArchitectureAnalysisService` | `ArchLucid.Application\Analysis\ArchitectureAnalysisService.cs` | 56.70 | 42 | Yes |
| 27 | `ArchLucid.Application.Analysis.ConsultingDocxRecommendationsSectionBuilder` | `ArchLucid.Application\Analysis\ConsultingDocxRecommendationsSectionBuilder.cs` | 57.14 | 3 | No |
| 28 | `ArchLucid.Application.Runs.Orchestration.RunCreateIdempotencyGateCache` | `ArchLucid.Application\Runs\Orchestration\RunCreateIdempotencyGateCache.cs` | 63.64 | 12 | No |
| 29 | `ArchLucid.Application.Tenancy.TrialLifecycleTransitionEngine` | `ArchLucid.Application\Tenancy\TrialLifecycleTransitionEngine.cs` | 64.95 | 34 | No |
| 30 | `ArchLucid.Application.Runs.Orchestration.ArchitectureRunCommitOrchestrator` | `ArchLucid.Application\Runs\Orchestration\ArchitectureRunCommitOrchestrator.cs` | 65.01 | 162 | Yes |
| 31 | `ArchLucid.Application.Analysis.DocxArchitectureAnalysisExportService` | `ArchLucid.Application\Analysis\DocxArchitectureAnalysisExportService.cs` | 65.55 | 41 | No |
| 32 | `ArchLucid.Application.Analysis.ComparisonVerificationFailedException` | `ArchLucid.Application\Analysis\ComparisonVerificationFailedException.cs` | 66.67 | 2 | No |
| 33 | `ArchLucid.Application.Diagrams.DiagramIdSanitizer` | `ArchLucid.Application\Diagrams\DiagramIdSanitizer.cs` | 66.67 | 3 | No |
| 34 | `ArchLucid.Application.Notifications.Email.RazorLightEmailTemplateRenderer` | `ArchLucid.Application\Notifications\Email\RazorLightEmailTemplateRenderer.cs` | 66.67 | 5 | No |
| 35 | `ArchLucid.Application.Analysis.MarkdownArchitectureAnalysisExportService` | `ArchLucid.Application\Analysis\MarkdownArchitectureAnalysisExportService.cs` | 68.20 | 76 | No |
| 36 | `ArchLucid.Application.Tenancy.TrialLifecyclePolicy` | `ArchLucid.Application\Tenancy\TrialLifecyclePolicy.cs` | 68.25 | 20 | No |
| 37 | `ArchLucid.Application.Manifests.ManifestPresentation` | `ArchLucid.Application\Manifests\ManifestPresentation.cs` | 68.42 | 6 | No |
| 38 | `ArchLucid.Application.Analysis.ConsultingDocxOpenXmlPrimitives` | `ArchLucid.Application\Analysis\ConsultingDocxOpenXmlPrimitives.cs` | 69.14 | 54 | No |
| 39 | `ArchLucid.Application.Architecture.ArchitectureRunProvenanceService` | `ArchLucid.Application\Architecture\ArchitectureRunProvenanceService.cs` | 71.64 | 97 | No |
| 40 | `ArchLucid.Application.Diffs.MarkdownManifestDiffSummaryFormatter` | `ArchLucid.Application\Diffs\MarkdownManifestDiffSummaryFormatter.cs` | 72.55 | 14 | No |
| 41 | `ArchLucid.Application.Runs.Orchestration.ArchitectureRunExecuteOrchestrator` | `ArchLucid.Application\Runs\Orchestration\ArchitectureRunExecuteOrchestrator.cs` | 72.73 | 78 | Yes |
| 42 | `ArchLucid.Application.Runs.Orchestration.ArchitectureRunCreateOrchestrator` | `ArchLucid.Application\Runs\Orchestration\ArchitectureRunCreateOrchestrator.cs` | 72.96 | 83 | Yes |
| 43 | `ArchLucid.Application.Architecture.CommittedManifestTraceabilityRules` | `ArchLucid.Application\Architecture\CommittedManifestTraceabilityRules.cs` | 75.00 | 7 | No |
| 44 | `ArchLucid.Application.Analysis.MarkdownEndToEndReplayComparisonSummaryFormatter` | `ArchLucid.Application\Analysis\MarkdownEndToEndReplayComparisonSummaryFormatter.cs` | 75.56 | 11 | No |
| 45 | `ArchLucid.Application.Tenancy.TrialTenantBootstrapService` | `ArchLucid.Application\Tenancy\TrialTenantBootstrapService.cs` | 76.00 | 24 | No |
| 46 | `ArchLucid.Application.Analysis.MarkdownDriftReportFormatter` | `ArchLucid.Application\Analysis\MarkdownDriftReportFormatter.cs` | 77.08 | 11 | No |
| 47 | `ArchLucid.Application.Analysis.ComparisonReplayRequestParsing` | `ArchLucid.Application\Analysis\ComparisonReplayRequestParsing.cs` | 77.78 | 4 | No |
| 48 | `ArchLucid.Application.Governance.Preview.GovernancePreviewService` | `ArchLucid.Application\Governance\Preview\GovernancePreviewService.cs` | 78.43 | 22 | No |
| 49 | `ArchLucid.Application.Analysis.ConsultingDocxSupplementalSections` | `ArchLucid.Application\Analysis\ConsultingDocxSupplementalSections.cs` | 80.00 | 37 | No |
| 50 | `ArchLucid.Application.Determinism.DeterminismCheckService` | `ArchLucid.Application\Determinism\DeterminismCheckService.cs` | 80.00 | 16 | No |
| 51 | `ArchLucid.Application.Evidence.MarkdownEvidenceSummaryFormatter` | `ArchLucid.Application\Evidence\MarkdownEvidenceSummaryFormatter.cs` | 80.00 | 17 | No |
| 52 | `ArchLucid.Application.Evolution.SimulationEvaluationRequest` | `ArchLucid.Application\Evolution\SimulationEvaluationRequest.cs` | 80.00 | 1 | No |
| 53 | `ArchLucid.Application.Runs.Orchestration.CoordinatorRunFailedDurableAudit` | `ArchLucid.Application\Runs\Orchestration\CoordinatorRunFailedDurableAudit.cs` | 83.33 | 4 | No |
| 54 | `ArchLucid.Application.Analysis.EndToEndReplayComparisonService` | `ArchLucid.Application\Analysis\EndToEndReplayComparisonService.cs` | 83.96 | 17 | No |
| 55 | `ArchLucid.Application.Billing.MarketplaceChangeQuantityWebhookMutationHandler` | `ArchLucid.Application\Billing\MarketplaceChangeQuantityWebhookMutationHandler.cs` | 84.21 | 3 | No |
| 56 | `ArchLucid.Application.Analysis.ConsultingDocxCoverPageBuilder` | `ArchLucid.Application\Analysis\ConsultingDocxCoverPageBuilder.cs` | 85.19 | 4 | No |
| 57 | `ArchLucid.Application.Billing.MarketplaceChangePlanWebhookMutationHandler` | `ArchLucid.Application\Billing\MarketplaceChangePlanWebhookMutationHandler.cs` | 85.71 | 3 | No |
| 58 | `ArchLucid.Application.Governance.GovernanceApprovalReviewConflictException` | `ArchLucid.Application\Governance\GovernanceApprovalReviewConflictException.cs` | 85.71 | 2 | Yes |
| 59 | `ArchLucid.Application.Identity.PwnedPasswordRangeClient` | `ArchLucid.Application\Identity\PwnedPasswordRangeClient.cs` | 85.71 | 6 | No |
| 60 | `ArchLucid.Application.Tenancy.TenantSlugNormalizer` | `ArchLucid.Application\Tenancy\TenantSlugNormalizer.cs` | 85.71 | 3 | No |
| 61 | `ArchLucid.Application.RunDetailQueryService` | `ArchLucid.Application\RunDetailQueryService.cs` | 85.90 | 11 | No |
| 62 | `ArchLucid.Application.Diffs.MarkdownAgentResultDiffSummaryFormatter` | `ArchLucid.Application\Diffs\MarkdownAgentResultDiffSummaryFormatter.cs` | 86.36 | 6 | No |
| 63 | `ArchLucid.Application.Tenancy.TenantProvisioningService` | `ArchLucid.Application\Tenancy\TenantProvisioningService.cs` | 86.59 | 11 | No |
| 64 | `ArchLucid.Application.Tenancy.TrialLimitGate` | `ArchLucid.Application\Tenancy\TrialLimitGate.cs` | 86.79 | 7 | No |
| 65 | `ArchLucid.Application.Analysis.ConsultingDocxFindingsSectionBuilder` | `ArchLucid.Application\Analysis\ConsultingDocxFindingsSectionBuilder.cs` | 87.50 | 3 | No |
| 66 | `ArchLucid.Application.Evolution.SimulationEvaluationService` | `ArchLucid.Application\Evolution\SimulationEvaluationService.cs` | 87.50 | 22 | Yes |
| 67 | `ArchLucid.Application.Governance.GovernanceDashboardService` | `ArchLucid.Application\Governance\GovernanceDashboardService.cs` | 87.88 | 4 | No |
| 68 | `ArchLucid.Application.Analysis.ReplayComparisonResult` | `ArchLucid.Application\Analysis\ReplayComparisonResult.cs` | 88.24 | 2 | No |
| 69 | `ArchLucid.Application.Governance.Preview.GovernanceManifestComparer` | `ArchLucid.Application\Governance\Preview\GovernanceManifestComparer.cs` | 88.89 | 6 | No |
| 70 | `ArchLucid.Application.Runs.Mapping.RunRecordToArchitectureRunMapper` | `ArchLucid.Application\Runs\Mapping\RunRecordToArchitectureRunMapper.cs` | 88.89 | 3 | No |
| 71 | `ArchLucid.Application.Tenancy.TrialSeatAccountant` | `ArchLucid.Application\Tenancy\TrialSeatAccountant.cs` | 88.89 | 1 | No |
| 72 | `ArchLucid.Application.Governance.GovernanceWorkflowService` | `ArchLucid.Application\Governance\GovernanceWorkflowService.cs` | 88.94 | 51 | No |
| 73 | `ArchLucid.Application.Diffs.ManifestDiffService` | `ArchLucid.Application\Diffs\ManifestDiffService.cs` | 89.11 | 11 | No |
| 74 | `ArchLucid.Application.Diagrams.ManifestDiagramService` | `ArchLucid.Application\Diagrams\ManifestDiagramService.cs` | 89.52 | 11 | No |
| 75 | `ArchLucid.Application.Evidence.DefaultEvidenceBuilder` | `ArchLucid.Application\Evidence\DefaultEvidenceBuilder.cs` | 90.14 | 14 | No |
| 76 | `ArchLucid.Application.Summaries.MarkdownManifestSummaryGenerator` | `ArchLucid.Application\Summaries\MarkdownManifestSummaryGenerator.cs` | 91.15 | 10 | No |
| 77 | `ArchLucid.Application.Notifications.Email.TrialEmailIdempotencyKeys` | `ArchLucid.Application\Notifications\Email\TrialEmailIdempotencyKeys.cs` | 94.44 | 1 | No |
| 78 | `ArchLucid.Application.Analysis.ExportRecordDiffService` | `ArchLucid.Application\Analysis\ExportRecordDiffService.cs` | 94.52 | 4 | No |
| 79 | `ArchLucid.Application.Common.BaselineMutationAuditService` | `ArchLucid.Application\Common\BaselineMutationAuditService.cs` | 94.74 | 1 | No |
| 80 | `ArchLucid.Application.Runs.ArchitectureRunAuthorityReader` | `ArchLucid.Application\Runs\ArchitectureRunAuthorityReader.cs` | 94.74 | 1 | No |

### ArchLucid.AgentRuntime (77.94% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.AgentRuntime.AgentResultSchemaViolationAudit` | `ArchLucid.AgentRuntime\AgentResultSchemaViolationAudit.cs` | 0.00 | 42 | No |
| 2 | `ArchLucid.AgentRuntime.DistributedLlmCompletionResponseStore` | `ArchLucid.AgentRuntime\DistributedLlmCompletionResponseStore.cs` | 0.00 | 21 | No |
| 3 | `ArchLucid.AgentRuntime.LlmTelemetryLabelOptions` | `ArchLucid.AgentRuntime\LlmTelemetryLabelOptions.cs` | 0.00 | 2 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.AgentRuntime.AgentResultSchemaViolationAudit` | `ArchLucid.AgentRuntime\AgentResultSchemaViolationAudit.cs` | 0.00 | 42 | No |
| 2 | `ArchLucid.AgentRuntime.DistributedLlmCompletionResponseStore` | `ArchLucid.AgentRuntime\DistributedLlmCompletionResponseStore.cs` | 0.00 | 21 | No |
| 3 | `ArchLucid.AgentRuntime.LlmTelemetryLabelOptions` | `ArchLucid.AgentRuntime\LlmTelemetryLabelOptions.cs` | 0.00 | 2 | No |
| 4 | `ArchLucid.AgentRuntime.Evaluation.ReferenceCases.AgentOutputReferenceCaseCatalog` | `ArchLucid.AgentRuntime\Evaluation\ReferenceCases\AgentOutputReferenceCaseCatalog.cs` | 14.29 | 54 | No |
| 5 | `ArchLucid.AgentRuntime.LlmCompletionAccountingClient` | `ArchLucid.AgentRuntime\LlmCompletionAccountingClient.cs` | 22.68 | 75 | No |
| 6 | `ArchLucid.AgentRuntime.AgentPromptActivityTags` | `ArchLucid.AgentRuntime\AgentPromptActivityTags.cs` | 40.00 | 6 | No |
| 7 | `ArchLucid.AgentRuntime.Safety.ContentSafetyEnabledButUnconfiguredGuard` | `ArchLucid.AgentRuntime\Safety\ContentSafetyEnabledButUnconfiguredGuard.cs` | 50.00 | 1 | No |
| 8 | `ArchLucid.AgentRuntime.Evaluation.ReferenceCases.AgentOutputReferenceCaseRunEvaluator` | `ArchLucid.AgentRuntime\Evaluation\ReferenceCases\AgentOutputReferenceCaseRunEvaluator.cs` | 55.74 | 54 | No |
| 9 | `ArchLucid.AgentRuntime.AgentCompletionTokenUsage` | `ArchLucid.AgentRuntime\AgentCompletionTokenUsage.cs` | 57.14 | 3 | No |
| 10 | `ArchLucid.AgentRuntime.Safety.AzureContentSafetyGuard` | `ArchLucid.AgentRuntime\Safety\AzureContentSafetyGuard.cs` | 60.42 | 19 | No |
| 11 | `ArchLucid.AgentRuntime.Evaluation.AgentOutputEvaluationRecorder` | `ArchLucid.AgentRuntime\Evaluation\AgentOutputEvaluationRecorder.cs` | 64.06 | 23 | No |
| 12 | `ArchLucid.AgentRuntime.CriticAgentHandler` | `ArchLucid.AgentRuntime\CriticAgentHandler.cs` | 64.74 | 55 | No |
| 13 | `ArchLucid.AgentRuntime.TopologyAgentHandler` | `ArchLucid.AgentRuntime\TopologyAgentHandler.cs` | 64.97 | 55 | No |
| 14 | `ArchLucid.AgentRuntime.ComplianceAgentHandler` | `ArchLucid.AgentRuntime\ComplianceAgentHandler.cs` | 65.19 | 55 | No |
| 15 | `ArchLucid.AgentRuntime.AgentResultSchemaViolationException` | `ArchLucid.AgentRuntime\AgentResultSchemaViolationException.cs` | 80.00 | 2 | No |
| 16 | `ArchLucid.AgentRuntime.LlmProviderDescriptor` | `ArchLucid.AgentRuntime\LlmProviderDescriptor.cs` | 80.56 | 7 | No |
| 17 | `ArchLucid.AgentRuntime.Explanation.ExplanationService` | `ArchLucid.AgentRuntime\Explanation\ExplanationService.cs` | 81.29 | 29 | No |
| 18 | `ArchLucid.AgentRuntime.LlmCallResilienceDefaults` | `ArchLucid.AgentRuntime\LlmCallResilienceDefaults.cs` | 81.67 | 11 | No |
| 19 | `ArchLucid.AgentRuntime.AgentResultParser` | `ArchLucid.AgentRuntime\AgentResultParser.cs` | 83.08 | 11 | No |
| 20 | `ArchLucid.AgentRuntime.FallbackAgentCompletionClient` | `ArchLucid.AgentRuntime\FallbackAgentCompletionClient.cs` | 83.33 | 6 | No |
| 21 | `ArchLucid.AgentRuntime.AgentExecutionTraceRecorder` | `ArchLucid.AgentRuntime\AgentExecutionTraceRecorder.cs` | 83.68 | 62 | Yes |
| 22 | `ArchLucid.AgentRuntime.Evaluation.AgentOutputEvaluationHarness` | `ArchLucid.AgentRuntime\Evaluation\AgentOutputEvaluationHarness.cs` | 84.75 | 9 | No |
| 23 | `ArchLucid.AgentRuntime.Explanation.DeterministicExplanationService` | `ArchLucid.AgentRuntime\Explanation\DeterministicExplanationService.cs` | 85.64 | 28 | No |
| 24 | `ArchLucid.AgentRuntime.Explanation.CachingRunExplanationSummaryService` | `ArchLucid.AgentRuntime\Explanation\CachingRunExplanationSummaryService.cs` | 87.80 | 5 | No |
| 25 | `ArchLucid.AgentRuntime.LlmTokenQuotaWindowTracker` | `ArchLucid.AgentRuntime\LlmTokenQuotaWindowTracker.cs` | 89.13 | 5 | No |
| 26 | `ArchLucid.AgentRuntime.CostAgentHandler` | `ArchLucid.AgentRuntime\CostAgentHandler.cs` | 90.00 | 1 | No |
| 27 | `ArchLucid.AgentRuntime.Explanation.RunExplanationCitationBuilder` | `ArchLucid.AgentRuntime\Explanation\RunExplanationCitationBuilder.cs` | 90.00 | 2 | No |
| 28 | `ArchLucid.AgentRuntime.MemoryLlmCompletionResponseStore` | `ArchLucid.AgentRuntime\MemoryLlmCompletionResponseStore.cs` | 90.48 | 2 | No |
| 29 | `ArchLucid.AgentRuntime.LlmCostEstimator` | `ArchLucid.AgentRuntime\LlmCostEstimator.cs` | 90.91 | 1 | No |
| 30 | `ArchLucid.AgentRuntime.Explanation.RunExplanationSummaryService` | `ArchLucid.AgentRuntime\Explanation\RunExplanationSummaryService.cs` | 91.73 | 11 | No |
| 31 | `ArchLucid.AgentRuntime.RealAgentExecutor` | `ArchLucid.AgentRuntime\RealAgentExecutor.cs` | 92.24 | 9 | No |
| 32 | `ArchLucid.AgentRuntime.CircuitBreakingAgentCompletionClient` | `ArchLucid.AgentRuntime\CircuitBreakingAgentCompletionClient.cs` | 93.33 | 2 | No |
| 33 | `ArchLucid.AgentRuntime.Prompts.CachedAgentSystemPromptCatalog` | `ArchLucid.AgentRuntime\Prompts\CachedAgentSystemPromptCatalog.cs` | 94.59 | 2 | No |

### ArchLucid.Host.Composition (79.45% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.CosmosPolyglotPersistence.cs` | 17.86 | 23 | No |
| 2 | `ArchLucid.Host.Composition.Configuration.ArchLucidStorageServiceCollectionExtensions` | `ArchLucid.Host.Composition\Configuration\ArchLucidStorageServiceCollectionExtensions.cs` | 57.32 | 67 | No |
| 3 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.DataHealthAndJobs.cs` | 63.64 | 24 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.CosmosPolyglotPersistence.cs` | 17.86 | 23 | No |
| 2 | `ArchLucid.Host.Composition.Configuration.ArchLucidStorageServiceCollectionExtensions` | `ArchLucid.Host.Composition\Configuration\ArchLucidStorageServiceCollectionExtensions.cs` | 57.32 | 67 | No |
| 3 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.DataHealthAndJobs.cs` | 63.64 | 24 | No |
| 4 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs` | 73.19 | 133 | No |
| 5 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.TenancyMeteringSecrets.cs` | 76.92 | 9 | No |
| 6 | `ArchLucid.Host.Composition.Configuration.SqlStorageProviderRegistrar` | `ArchLucid.Host.Composition\Configuration\SqlStorageProviderRegistrar.cs` | 88.24 | 16 | No |
| 7 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.SchedulingAndAlerts.cs` | 90.18 | 11 | No |
| 8 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.CoordinatorAndArtifacts.cs` | 91.86 | 7 | No |

### ArchLucid.Persistence.Runtime (80.05% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.BlobStore.AzureBlobArtifactBlobStore` | `ArchLucid.Persistence.Runtime\BlobStore\AzureBlobArtifactBlobStore.cs` | 0.00 | 29 | No |
| 2 | `ArchLucid.Persistence.BlobStore.NullArtifactBlobStore` | `ArchLucid.Persistence.Runtime\BlobStore\NullArtifactBlobStore.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Persistence.Caching.DistributedHotPathReadCache` | `ArchLucid.Persistence.Runtime\Caching\DistributedHotPathReadCache.cs` | 0.00 | 56 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.BlobStore.AzureBlobArtifactBlobStore` | `ArchLucid.Persistence.Runtime\BlobStore\AzureBlobArtifactBlobStore.cs` | 0.00 | 29 | No |
| 2 | `ArchLucid.Persistence.BlobStore.NullArtifactBlobStore` | `ArchLucid.Persistence.Runtime\BlobStore\NullArtifactBlobStore.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Persistence.Caching.DistributedHotPathReadCache` | `ArchLucid.Persistence.Runtime\Caching\DistributedHotPathReadCache.cs` | 0.00 | 56 | No |
| 4 | `ArchLucid.Persistence.Orchestration.AuthorityPipelineWorkOutboxEntry` | `ArchLucid.Persistence.Runtime\Orchestration\AuthorityPipelineWorkOutboxEntry.cs` | 0.00 | 7 | No |
| 5 | `ArchLucid.Persistence.Orchestration.InMemoryAuthorityPipelineWorkRepository` | `ArchLucid.Persistence.Runtime\Orchestration\InMemoryAuthorityPipelineWorkRepository.cs` | 39.29 | 17 | No |
| 6 | `ArchLucid.Persistence.Orchestration.AuthorityPipelineWorkPayloadJson` | `ArchLucid.Persistence.Runtime\Orchestration\AuthorityPipelineWorkPayloadJson.cs` | 50.00 | 3 | No |
| 7 | `ArchLucid.Persistence.Transactions.InMemoryArchLucidUnitOfWork` | `ArchLucid.Persistence.Runtime\Transactions\InMemoryArchLucidUnitOfWork.cs` | 50.00 | 3 | No |
| 8 | `ArchLucid.Persistence.BlobStore.InMemoryArtifactBlobStore` | `ArchLucid.Persistence.Runtime\BlobStore\InMemoryArtifactBlobStore.cs` | 57.14 | 3 | No |
| 9 | `ArchLucid.Persistence.BlobStore.LocalFileArtifactBlobStore` | `ArchLucid.Persistence.Runtime\BlobStore\LocalFileArtifactBlobStore.cs` | 84.21 | 9 | No |
| 10 | `ArchLucid.Persistence.BlobStore.ArtifactBlobTenantPaths` | `ArchLucid.Persistence.Runtime\BlobStore\ArtifactBlobTenantPaths.cs` | 84.38 | 5 | No |
| 11 | `ArchLucid.Persistence.Orchestration.AuthorityRunOrchestrator` | `ArchLucid.Persistence.Runtime\Orchestration\AuthorityRunOrchestrator.cs` | 90.00 | 29 | No |

### ArchLucid.ArtifactSynthesis (80.13% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.ArtifactSynthesis.Docx.DocxExportService` | `ArchLucid.ArtifactSynthesis\Docx\DocxExportService.cs` | 51.25 | 156 | No |
| 2 | `ArchLucid.ArtifactSynthesis.Docx.Builders.WordDocumentBuilder` | `ArchLucid.ArtifactSynthesis\Docx\Builders\WordDocumentBuilder.cs` | 56.83 | 60 | No |
| 3 | `ArchLucid.ArtifactSynthesis.Generators.ComplianceMatrixArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ComplianceMatrixArtifactGenerator.cs` | 59.26 | 11 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.ArtifactSynthesis.Docx.DocxExportService` | `ArchLucid.ArtifactSynthesis\Docx\DocxExportService.cs` | 51.25 | 156 | No |
| 2 | `ArchLucid.ArtifactSynthesis.Docx.Builders.WordDocumentBuilder` | `ArchLucid.ArtifactSynthesis\Docx\Builders\WordDocumentBuilder.cs` | 56.83 | 60 | No |
| 3 | `ArchLucid.ArtifactSynthesis.Generators.ComplianceMatrixArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ComplianceMatrixArtifactGenerator.cs` | 59.26 | 11 | No |
| 4 | `ArchLucid.ArtifactSynthesis.Services.ArtifactBundleValidator` | `ArchLucid.ArtifactSynthesis\Services\ArtifactBundleValidator.cs` | 81.82 | 4 | No |
| 5 | `ArchLucid.ArtifactSynthesis.Docx.Helpers.ImageHelper` | `ArchLucid.ArtifactSynthesis\Docx\Helpers\ImageHelper.cs` | 86.96 | 9 | No |
| 6 | `ArchLucid.ArtifactSynthesis.Generators.ArchitectureNarrativeArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ArchitectureNarrativeArtifactGenerator.cs` | 88.16 | 9 | No |
| 7 | `ArchLucid.ArtifactSynthesis.Generators.ReferenceArchitectureMarkdownGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ReferenceArchitectureMarkdownGenerator.cs` | 88.16 | 9 | No |
| 8 | `ArchLucid.ArtifactSynthesis.Services.ArtifactSynthesisService` | `ArchLucid.ArtifactSynthesis\Services\ArtifactSynthesisService.cs` | 91.07 | 5 | No |
| 9 | `ArchLucid.ArtifactSynthesis.Docx.TemplateLoader` | `ArchLucid.ArtifactSynthesis\Docx\TemplateLoader.cs` | 92.86 | 1 | No |
| 10 | `ArchLucid.ArtifactSynthesis.Repositories.InMemoryArtifactBundleRepository` | `ArchLucid.ArtifactSynthesis\Repositories\InMemoryArtifactBundleRepository.cs` | 94.12 | 1 | No |
| 11 | `ArchLucid.ArtifactSynthesis.Packaging.ArtifactPackagingService` | `ArchLucid.ArtifactSynthesis\Packaging\ArtifactPackagingService.cs` | 94.53 | 7 | No |

### ArchLucid.Persistence.Alerts (81.88% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.Simulation.AlertSimulationContextProvider` | `ArchLucid.Persistence.Alerts\Simulation\AlertSimulationContextProvider.cs` | 33.75 | 53 | No |
| 2 | `ArchLucid.Persistence.Simulation.RuleSimulationService` | `ArchLucid.Persistence.Alerts\Simulation\RuleSimulationService.cs` | 55.17 | 104 | No |
| 3 | `ArchLucid.Persistence.AlertSuppressionPolicy` | `ArchLucid.Persistence.Alerts\AlertSuppressionPolicy.cs` | 82.35 | 9 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.Simulation.AlertSimulationContextProvider` | `ArchLucid.Persistence.Alerts\Simulation\AlertSimulationContextProvider.cs` | 33.75 | 53 | No |
| 2 | `ArchLucid.Persistence.Simulation.RuleSimulationService` | `ArchLucid.Persistence.Alerts\Simulation\RuleSimulationService.cs` | 55.17 | 104 | No |
| 3 | `ArchLucid.Persistence.AlertSuppressionPolicy` | `ArchLucid.Persistence.Alerts\AlertSuppressionPolicy.cs` | 82.35 | 9 | No |
| 4 | `ArchLucid.Persistence.InMemoryAlertRuleRepository` | `ArchLucid.Persistence.Alerts\InMemoryAlertRuleRepository.cs` | 93.94 | 2 | No |

### ArchLucid.Persistence.Coordination (82.97% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ProductLearningImprovementPlanSignalLinkSqlRow` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ProductLearningPlanningSqlRows.cs` | 0.00 | 3 | No |
| 2 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ProductLearningImprovementThemeSqlRow` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ProductLearningPlanningSqlRows.cs` | 0.00 | 18 | No |
| 3 | `ArchLucid.Persistence.Coordination.Compare.AuthorityCompareService` | `ArchLucid.Persistence.Coordination\Compare\AuthorityCompareService.cs` | 16.92 | 167 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ProductLearningImprovementPlanSignalLinkSqlRow` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ProductLearningPlanningSqlRows.cs` | 0.00 | 3 | No |
| 2 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ProductLearningImprovementThemeSqlRow` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ProductLearningPlanningSqlRows.cs` | 0.00 | 18 | No |
| 3 | `ArchLucid.Persistence.Coordination.Compare.AuthorityCompareService` | `ArchLucid.Persistence.Coordination\Compare\AuthorityCompareService.cs` | 16.92 | 167 | No |
| 4 | `ArchLucid.Persistence.Coordination.Compare.ManifestComparisonResult` | `ArchLucid.Persistence.Coordination\Compare\ManifestComparisonResult.cs` | 50.00 | 4 | No |
| 5 | `ArchLucid.Persistence.Coordination.Evolution.InMemoryEvolutionSimulationRunRepository` | `ArchLucid.Persistence.Coordination\Evolution\InMemoryEvolutionSimulationRunRepository.cs` | 50.00 | 10 | No |
| 6 | `ArchLucid.Persistence.Coordination.ProductLearning.ProductLearningOpportunityScoring` | `ArchLucid.Persistence.Coordination\ProductLearning\ProductLearningOpportunityScoring.cs` | 62.71 | 22 | No |
| 7 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ProductLearningPlanningRepositoryValidation` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ProductLearningPlanningRepositoryValidation.cs` | 70.97 | 36 | No |
| 8 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ImprovementThemeDetailJsonAnnotations` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ImprovementThemeDetailJsonAnnotations.cs` | 77.78 | 8 | No |
| 9 | `ArchLucid.Persistence.Coordination.Replay.AuthorityReplayService` | `ArchLucid.Persistence.Coordination\Replay\AuthorityReplayService.cs` | 78.64 | 22 | No |
| 10 | `ArchLucid.Persistence.Coordination.ProductLearning.ProductLearningTriageReportBuilder` | `ArchLucid.Persistence.Coordination\ProductLearning\ProductLearningTriageReportBuilder.cs` | 81.48 | 20 | No |
| 11 | `ArchLucid.Persistence.Coordination.Evolution.InMemoryEvolutionCandidateChangeSetRepository` | `ArchLucid.Persistence.Coordination\Evolution\InMemoryEvolutionCandidateChangeSetRepository.cs` | 81.63 | 9 | No |
| 12 | `ArchLucid.Persistence.Coordination.ProductLearning.ProductLearningDashboardService` | `ArchLucid.Persistence.Coordination\ProductLearning\ProductLearningDashboardService.cs` | 82.96 | 23 | No |
| 13 | `ArchLucid.Persistence.Coordination.ProductLearning.ProductLearningImprovementOpportunityService` | `ArchLucid.Persistence.Coordination\ProductLearning\ProductLearningImprovementOpportunityService.cs` | 85.19 | 8 | No |
| 14 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ImprovementThemeExtractionService` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ImprovementThemeExtractionService.cs` | 85.28 | 44 | No |
| 15 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ImprovementPlanningService` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ImprovementPlanningService.cs` | 86.67 | 42 | No |
| 16 | `ArchLucid.Persistence.Coordination.Replay.ReplayValidationResult` | `ArchLucid.Persistence.Coordination\Replay\ReplayValidationResult.cs` | 88.89 | 1 | No |
| 17 | `ArchLucid.Persistence.Coordination.Retrieval.RetrievalIndexingOutboxProcessor` | `ArchLucid.Persistence.Coordination\Retrieval\RetrievalIndexingOutboxProcessor.cs` | 89.55 | 7 | No |
| 18 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.InMemoryProductLearningPlanningRepository` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\InMemoryProductLearningPlanningRepository.cs` | 89.78 | 23 | No |
| 19 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.LearningPlanningReportBuilder` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\LearningPlanningReportBuilder.cs` | 93.75 | 7 | No |
| 20 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.LearningPlanningReportMarkdownFormatter` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\LearningPlanningReportMarkdownFormatter.cs` | 94.12 | 5 | No |
| 21 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ProductLearningPlanningJsonSerializer` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ProductLearningPlanningJsonSerializer.cs` | 94.44 | 1 | No |

### ArchLucid.Core (84.58% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Core.Billing.BillingConversionBlockedException` | `ArchLucid.Core\Billing\BillingConversionBlockedException.cs` | 0.00 | 2 | No |
| 2 | `ArchLucid.Core.Configuration.LlmTelemetryOptions` | `ArchLucid.Core\Configuration\LlmTelemetryOptions.cs` | 0.00 | 1 | No |
| 3 | `ArchLucid.Core.Configuration.MeteringOptions` | `ArchLucid.Core\Configuration\MeteringOptions.cs` | 0.00 | 1 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Core.Billing.BillingConversionBlockedException` | `ArchLucid.Core\Billing\BillingConversionBlockedException.cs` | 0.00 | 2 | No |
| 2 | `ArchLucid.Core.Configuration.LlmTelemetryOptions` | `ArchLucid.Core\Configuration\LlmTelemetryOptions.cs` | 0.00 | 1 | No |
| 3 | `ArchLucid.Core.Configuration.MeteringOptions` | `ArchLucid.Core\Configuration\MeteringOptions.cs` | 0.00 | 1 | No |
| 4 | `ArchLucid.Core.Explanation.DecisionTraceEntry` | `ArchLucid.Core\Explanation\DecisionTraceEntry.cs` | 0.00 | 5 | No |
| 5 | `ArchLucid.Core.Explanation.FindingRationale` | `ArchLucid.Core\Explanation\FindingRationale.cs` | 0.00 | 9 | No |
| 6 | `ArchLucid.Core.Explanation.FindingTraceCompletenessScore` | `ArchLucid.Core\Explanation\FindingTraceCompletenessScore.cs` | 0.00 | 9 | No |
| 7 | `ArchLucid.Core.Explanation.RunRationale` | `ArchLucid.Core\Explanation\RunRationale.cs` | 0.00 | 7 | No |
| 8 | `ArchLucid.Core.Identity.TrialIdentityUserRecord` | `ArchLucid.Core\Identity\TrialIdentityUserRecord.cs` | 0.00 | 13 | No |
| 9 | `ArchLucid.Core.Metering.NullUsageMeteringService` | `ArchLucid.Core\Metering\NullUsageMeteringService.cs` | 0.00 | 3 | No |
| 10 | `ArchLucid.Core.Notifications.SentEmailLedgerEntry` | `ArchLucid.Core\Notifications\SentEmailLedgerEntry.cs` | 0.00 | 6 | No |
| 11 | `ArchLucid.Core.Secrets.ArchLucidSecretOptions` | `ArchLucid.Core\Secrets\ArchLucidSecretOptions.cs` | 0.00 | 3 | No |
| 12 | `ArchLucid.Core.Tenancy.TenantHardPurgeOptions` | `ArchLucid.Core\Tenancy\TenantHardPurgeOptions.cs` | 0.00 | 2 | No |
| 13 | `ArchLucid.Core.Tenancy.TenantHardPurgeResult` | `ArchLucid.Core\Tenancy\TenantHardPurgeResult.cs` | 0.00 | 3 | No |
| 14 | `ArchLucid.Core.Tenancy.TrialFirstManifestCommitOutcome` | `ArchLucid.Core\Tenancy\TrialFirstManifestCommitOutcome.cs` | 0.00 | 2 | No |
| 15 | `ArchLucid.Core.Diagnostics.AgentExecutionLlmCallAccumulator` | `ArchLucid.Core\Diagnostics\ArchLucidInstrumentation.cs` | 25.00 | 3 | No |
| 16 | `ArchLucid.Core.Billing.BillingTierCode` | `ArchLucid.Core\Billing\BillingTierCode.cs` | 28.57 | 10 | No |
| 17 | `ArchLucid.Core.Audit.InMemoryAuditRetryQueue` | `ArchLucid.Core\Audit\InMemoryAuditRetryQueue.cs` | 29.17 | 34 | No |
| 18 | `ArchLucid.Core.Configuration.ArchLucidPersistenceOptions` | `ArchLucid.Core\Configuration\ArchLucidPersistenceOptions.cs` | 50.00 | 1 | No |
| 19 | `ArchLucid.Core.Audit.DurableAuditLogRetry` | `ArchLucid.Core\Audit\DurableAuditLogRetry.cs` | 57.14 | 12 | Yes |
| 20 | `ArchLucid.Core.Llm.Redaction.PromptRedactor` | `ArchLucid.Core\Llm\Redaction\PromptRedactor.cs` | 62.16 | 28 | No |
| 21 | `ArchLucid.Core.Identity.RunId` | `ArchLucid.Core\Identity\RunId.cs` | 71.43 | 2 | No |
| 22 | `ArchLucid.Core.Resilience.CircuitBreakerOptions` | `ArchLucid.Core\Resilience\CircuitBreakerOptions.cs` | 71.43 | 2 | No |
| 23 | `ArchLucid.Core.Identity.RunIdJsonConverter` | `ArchLucid.Core\Identity\RunIdJsonConverter.cs` | 75.00 | 2 | No |
| 24 | `ArchLucid.Core.Billing.AzureMarketplace.MarketplaceWebhookPayloadParser` | `ArchLucid.Core\Billing\AzureMarketplace\MarketplaceWebhookPayloadParser.cs` | 78.26 | 5 | No |
| 25 | `ArchLucid.Core.Integration.IntegrationEventServiceBusApplicationProperties` | `ArchLucid.Core\Integration\IntegrationEventServiceBusApplicationProperties.cs` | 78.85 | 11 | No |
| 26 | `ArchLucid.Core.Billing.BillingWebhookHandleResult` | `ArchLucid.Core\Billing\BillingWebhookHandleResult.cs` | 80.00 | 3 | No |
| 27 | <code>ArchLucid.Core.Pagination.PagedResponse`1</code> | `ArchLucid.Core\Pagination\PagedResponse.cs` | 80.00 | 1 | No |
| 28 | `ArchLucid.Core.Safety.ContentSafetyResult` | `ArchLucid.Core\Safety\ContentSafetyResult.cs` | 80.00 | 1 | No |
| 29 | `ArchLucid.Core.Integration.IntegrationEventTypes` | `ArchLucid.Core\Integration\IntegrationEventTypes.cs` | 83.33 | 1 | No |
| 30 | `ArchLucid.Core.Configuration.TrialAuthModeConstants` | `ArchLucid.Core\Configuration\TrialAuthModeConstants.cs` | 85.71 | 1 | No |
| 31 | `ArchLucid.Core.Resilience.CircuitBreakerGate` | `ArchLucid.Core\Resilience\CircuitBreakerGate.cs` | 87.97 | 19 | Yes |
| 32 | `ArchLucid.Core.Diagnostics.ArchLucidInstrumentation` | `ArchLucid.Core\Diagnostics\ArchLucidInstrumentation.cs` | 90.57 | 38 | No |
| 33 | `ArchLucid.Core.Explanation.ExplanationResult` | `ArchLucid.Core\Explanation\ExplanationResult.cs` | 90.91 | 1 | No |
| 34 | `ArchLucid.Core.Tenancy.TrialLimitExceededException` | `ArchLucid.Core\Tenancy\TrialLimitExceededException.cs` | 94.12 | 1 | No |

### ArchLucid.Persistence.Advisory (85.35% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.RecommendationLearningService` | `ArchLucid.Persistence.Advisory\RecommendationLearningService.cs` | 41.67 | 7 | No |
| 2 | `ArchLucid.Persistence.InMemoryAdvisoryScanExecutionRepository` | `ArchLucid.Persistence.Advisory\InMemoryAdvisoryScanExecutionRepository.cs` | 57.89 | 8 | No |
| 3 | `ArchLucid.Persistence.InMemoryDigestDeliveryAttemptRepository` | `ArchLucid.Persistence.Advisory\InMemoryDigestDeliveryAttemptRepository.cs` | 72.41 | 8 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.RecommendationLearningService` | `ArchLucid.Persistence.Advisory\RecommendationLearningService.cs` | 41.67 | 7 | No |
| 2 | `ArchLucid.Persistence.InMemoryAdvisoryScanExecutionRepository` | `ArchLucid.Persistence.Advisory\InMemoryAdvisoryScanExecutionRepository.cs` | 57.89 | 8 | No |
| 3 | `ArchLucid.Persistence.InMemoryDigestDeliveryAttemptRepository` | `ArchLucid.Persistence.Advisory\InMemoryDigestDeliveryAttemptRepository.cs` | 72.41 | 8 | No |
| 4 | `ArchLucid.Persistence.AdvisoryScanRunner` | `ArchLucid.Persistence.Advisory\AdvisoryScanRunner.cs` | 76.43 | 74 | No |

### ArchLucid.Cli (86.70% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Cli.Commands.TraceCommand` | `ArchLucid.Cli\Commands\TraceCommand.cs` | 43.55 | 35 | No |
| 2 | `ArchLucid.Cli.Support.SupportBundleArchiveWriter` | `ArchLucid.Cli\Support\SupportBundleArchiveWriter.cs` | 61.29 | 24 | No |
| 3 | `ArchLucid.Cli.Support.SupportBundleCollector` | `ArchLucid.Cli\Support\SupportBundleCollector.cs` | 83.51 | 31 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Cli.Commands.TraceCommand` | `ArchLucid.Cli\Commands\TraceCommand.cs` | 43.55 | 35 | No |
| 2 | `ArchLucid.Cli.Support.SupportBundleArchiveWriter` | `ArchLucid.Cli\Support\SupportBundleArchiveWriter.cs` | 61.29 | 24 | No |
| 3 | `ArchLucid.Cli.Support.SupportBundleCollector` | `ArchLucid.Cli\Support\SupportBundleCollector.cs` | 83.51 | 31 | No |
| 4 | `ArchLucid.Cli.ArchLucidProjectScaffolder` | `ArchLucid.Cli\ArchLucidProjectScaffolder.cs` | 88.46 | 27 | No |
| 5 | `ArchLucid.Cli.Commands.CliCommandShared` | `ArchLucid.Cli\Commands\CliCommandShared.cs` | 90.54 | 7 | No |
| 6 | `ArchLucid.Cli.Support.SupportBundleRedactor` | `ArchLucid.Cli\Support\SupportBundleRedactor.cs` | 92.73 | 4 | No |

### ArchLucid.ContextIngestion (91.01% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.ContextIngestion.Canonicalization.CanonicalInfrastructureEnricher` | `ArchLucid.ContextIngestion\Canonicalization\CanonicalInfrastructureEnricher.cs` | 52.50 | 19 | No |
| 2 | `ArchLucid.ContextIngestion.Infrastructure.JsonInfrastructureDeclarationParser` | `ArchLucid.ContextIngestion\Infrastructure\JsonInfrastructureDeclarationParser.cs` | 67.27 | 18 | No |
| 3 | `ArchLucid.ContextIngestion.Repositories.InMemoryContextSnapshotRepository` | `ArchLucid.ContextIngestion\Repositories\InMemoryContextSnapshotRepository.cs` | 69.23 | 8 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.ContextIngestion.Canonicalization.CanonicalInfrastructureEnricher` | `ArchLucid.ContextIngestion\Canonicalization\CanonicalInfrastructureEnricher.cs` | 52.50 | 19 | No |
| 2 | `ArchLucid.ContextIngestion.Infrastructure.JsonInfrastructureDeclarationParser` | `ArchLucid.ContextIngestion\Infrastructure\JsonInfrastructureDeclarationParser.cs` | 67.27 | 18 | No |
| 3 | `ArchLucid.ContextIngestion.Repositories.InMemoryContextSnapshotRepository` | `ArchLucid.ContextIngestion\Repositories\InMemoryContextSnapshotRepository.cs` | 69.23 | 8 | No |
| 4 | `ArchLucid.ContextIngestion.Infrastructure.TerraformShowJsonInfrastructureDeclarationParser` | `ArchLucid.ContextIngestion\Infrastructure\TerraformShowJsonInfrastructureDeclarationParser.cs` | 86.14 | 14 | No |
| 5 | `ArchLucid.ContextIngestion.Canonicalization.CanonicalDeduplicator` | `ArchLucid.ContextIngestion\Canonicalization\CanonicalDeduplicator.cs` | 93.33 | 1 | No |

### ArchLucid.Contracts (92.39% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Contracts.Agents.AgentOutputEvaluationSummary` | `ArchLucid.Contracts\Agents\AgentOutputEvaluationSummary.cs` | 0.00 | 6 | No |
| 2 | `ArchLucid.Contracts.Evolution.SimulationEvaluationOptions` | `ArchLucid.Contracts\Evolution\SimulationEvaluationOptions.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Contracts.Explanation.FindingExplainabilityResult` | `ArchLucid.Contracts\Explanation\FindingExplainabilityResult.cs` | 0.00 | 17 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Contracts.Agents.AgentOutputEvaluationSummary` | `ArchLucid.Contracts\Agents\AgentOutputEvaluationSummary.cs` | 0.00 | 6 | No |
| 2 | `ArchLucid.Contracts.Evolution.SimulationEvaluationOptions` | `ArchLucid.Contracts\Evolution\SimulationEvaluationOptions.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Contracts.Explanation.FindingExplainabilityResult` | `ArchLucid.Contracts\Explanation\FindingExplainabilityResult.cs` | 0.00 | 17 | No |
| 4 | `ArchLucid.Contracts.ProductLearning.Planning.LearningPlanningReportArtifactRef` | `ArchLucid.Contracts\ProductLearning\Planning\LearningPlanningReportArtifactRef.cs` | 0.00 | 4 | No |
| 5 | `ArchLucid.Contracts.Common.AgentTypeKeys` | `ArchLucid.Contracts\Common\AgentTypeKeys.cs` | 39.13 | 14 | No |
| 6 | `ArchLucid.Contracts.Evolution.SimulationReadProfile` | `ArchLucid.Contracts\Evolution\SimulationReadProfile.cs` | 62.86 | 13 | No |
| 7 | `ArchLucid.Contracts.DecisionTraces.DecisionTrace` | `ArchLucid.Contracts\DecisionTraces\DecisionTrace.cs` | 66.67 | 2 | No |
| 8 | `ArchLucid.Contracts.Agents.AgentOutputEvaluationScore` | `ArchLucid.Contracts\Agents\AgentOutputEvaluationScore.cs` | 71.43 | 2 | No |
| 9 | `ArchLucid.Contracts.ProductLearning.Planning.ImprovementThemeEvidence` | `ArchLucid.Contracts\ProductLearning\Planning\ImprovementThemeEvidence.cs` | 71.43 | 2 | No |
| 10 | `ArchLucid.Contracts.ProductLearning.ProductLearningPilotSignalRecord` | `ArchLucid.Contracts\ProductLearning\ProductLearningPilotSignalRecord.cs` | 76.47 | 4 | No |
| 11 | `ArchLucid.Contracts.Governance.PreCommitGovernanceGateOptions` | `ArchLucid.Contracts\Governance\PreCommitGovernanceGateOptions.cs` | 80.00 | 1 | No |
| 12 | `ArchLucid.Contracts.DecisionTraces.DecisionTraceJsonConverter` | `ArchLucid.Contracts\DecisionTraces\DecisionTraceJsonConverter.cs` | 81.25 | 6 | No |
| 13 | `ArchLucid.Contracts.Requests.RequestConstraintClassifier` | `ArchLucid.Contracts\Requests\RequestConstraintClassifier.cs` | 86.67 | 2 | No |

### ArchLucid.Decisioning (92.64% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Decisioning.Governance.Resolution.PolicyAssignmentPrecedence` | `ArchLucid.Decisioning\Governance\Resolution\PolicyAssignmentPrecedence.cs` | 0.00 | 5 | No |
| 2 | `ArchLucid.Decisioning.Plugins.FindingEnginePluginDiscovery` | `ArchLucid.Decisioning\Plugins\FindingEnginePluginDiscovery.cs` | 8.54 | 75 | No |
| 3 | `ArchLucid.Decisioning.Compliance.Loaders.ComplianceRulePackValidator` | `ArchLucid.Decisioning\Compliance\Loaders\ComplianceRulePackValidator.cs` | 64.71 | 6 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Decisioning.Governance.Resolution.PolicyAssignmentPrecedence` | `ArchLucid.Decisioning\Governance\Resolution\PolicyAssignmentPrecedence.cs` | 0.00 | 5 | No |
| 2 | `ArchLucid.Decisioning.Plugins.FindingEnginePluginDiscovery` | `ArchLucid.Decisioning\Plugins\FindingEnginePluginDiscovery.cs` | 8.54 | 75 | No |
| 3 | `ArchLucid.Decisioning.Compliance.Loaders.ComplianceRulePackValidator` | `ArchLucid.Decisioning\Compliance\Loaders\ComplianceRulePackValidator.cs` | 64.71 | 6 | No |
| 4 | `ArchLucid.Decisioning.Alerts.Delivery.AlertSeverityComparer` | `ArchLucid.Decisioning\Alerts\Delivery\AlertSeverityComparer.cs` | 66.67 | 3 | No |
| 5 | `ArchLucid.Decisioning.Validation.PassthroughSchemaValidationService` | `ArchLucid.Decisioning\Validation\PassthroughSchemaValidationService.cs` | 66.67 | 2 | No |
| 6 | `ArchLucid.Decisioning.Merge.ManifestGovernanceMerger` | `ArchLucid.Decisioning\Merge\ManifestGovernanceMerger.cs` | 72.00 | 21 | No |
| 7 | `ArchLucid.Decisioning.Models.FindingsSnapshot` | `ArchLucid.Decisioning\Models\FindingsSnapshot.cs` | 78.57 | 3 | Yes |
| 8 | `ArchLucid.Decisioning.Manifest.AuthorityManifestRiskPosture` | `ArchLucid.Decisioning\Manifest\AuthorityManifestRiskPosture.cs` | 81.48 | 5 | No |
| 9 | `ArchLucid.Decisioning.Findings.Serialization.FindingJsonConverter` | `ArchLucid.Decisioning\Findings\Serialization\FindingJsonConverter.cs` | 81.58 | 14 | No |
| 10 | `ArchLucid.Decisioning.Validation.SchemaValidationService` | `ArchLucid.Decisioning\Validation\SchemaValidationService.cs` | 82.22 | 24 | No |
| 11 | `ArchLucid.Decisioning.Services.FindingsOrchestrator` | `ArchLucid.Decisioning\Services\FindingsOrchestrator.cs` | 84.15 | 13 | No |
| 12 | `ArchLucid.Decisioning.Governance.Resolution.EffectiveGovernanceResolver` | `ArchLucid.Decisioning\Governance\Resolution\EffectiveGovernanceResolver.cs` | 84.75 | 43 | No |
| 13 | `ArchLucid.Decisioning.Merge.DecisionNodeManifestMerger` | `ArchLucid.Decisioning\Merge\DecisionNodeManifestMerger.cs` | 85.14 | 11 | No |
| 14 | `ArchLucid.Decisioning.Services.FindingPayloadValidator` | `ArchLucid.Decisioning\Services\FindingPayloadValidator.cs` | 87.18 | 5 | No |
| 15 | `ArchLucid.Decisioning.Alerts.Composite.CompositeAlertRuleEvaluator` | `ArchLucid.Decisioning\Alerts\Composite\CompositeAlertRuleEvaluator.cs` | 87.50 | 4 | No |
| 16 | `ArchLucid.Decisioning.Findings.ExplanationFaithfulnessChecker` | `ArchLucid.Decisioning\Findings\ExplanationFaithfulnessChecker.cs` | 87.63 | 12 | No |
| 17 | `ArchLucid.Decisioning.Services.RuleBasedDecisionEngine` | `ArchLucid.Decisioning\Services\RuleBasedDecisionEngine.cs` | 87.76 | 6 | No |
| 18 | `ArchLucid.Decisioning.Advisory.Services.RecommendationGenerator` | `ArchLucid.Decisioning\Advisory\Services\RecommendationGenerator.cs` | 88.54 | 11 | No |
| 19 | `ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackManagementService` | `ArchLucid.Decisioning\Governance\PolicyPacks\PolicyPackManagementService.cs` | 89.16 | 22 | No |
| 20 | `ArchLucid.Decisioning.Merge.AgentProposalManifestMerger` | `ArchLucid.Decisioning\Merge\AgentProposalManifestMerger.cs` | 89.18 | 21 | No |
| 21 | `ArchLucid.Decisioning.Compliance.Loaders.FileComplianceRulePackLoader` | `ArchLucid.Decisioning\Compliance\Loaders\FileComplianceRulePackLoader.cs` | 89.19 | 4 | No |
| 22 | `ArchLucid.Decisioning.Repositories.InMemoryFindingsSnapshotRepository` | `ArchLucid.Decisioning\Repositories\InMemoryFindingsSnapshotRepository.cs` | 89.47 | 2 | No |
| 23 | `ArchLucid.Decisioning.Advisory.Scheduling.AdvisoryScanExecution` | `ArchLucid.Decisioning\Advisory\Scheduling\AdvisoryScanExecution.cs` | 90.00 | 1 | No |
| 24 | `ArchLucid.Decisioning.Findings.Factories.FindingPayloadConverter` | `ArchLucid.Decisioning\Findings\Factories\FindingPayloadConverter.cs` | 90.32 | 3 | No |
| 25 | `ArchLucid.Decisioning.Comparison.ComparisonService` | `ArchLucid.Decisioning\Comparison\ComparisonService.cs` | 90.73 | 14 | No |
| 26 | `ArchLucid.Decisioning.Manifest.Builders.DefaultGoldenManifestBuilder` | `ArchLucid.Decisioning\Manifest\Builders\DefaultGoldenManifestBuilder.cs` | 90.75 | 32 | No |
| 27 | `ArchLucid.Decisioning.Findings.FindingPayloadRegistry` | `ArchLucid.Decisioning\Findings\FindingPayloadRegistry.cs` | 93.33 | 1 | No |
| 28 | `ArchLucid.Decisioning.Merge.DecisionEngineService` | `ArchLucid.Decisioning\Merge\DecisionEngineService.cs` | 93.48 | 3 | No |
| 29 | `ArchLucid.Decisioning.Services.ManifestHashService` | `ArchLucid.Decisioning\Services\ManifestHashService.cs` | 93.62 | 3 | No |
| 30 | `ArchLucid.Decisioning.Findings.FindingTraceConfidenceMapper` | `ArchLucid.Decisioning\Findings\FindingTraceConfidenceMapper.cs` | 93.75 | 1 | No |
| 31 | `ArchLucid.Decisioning.Repositories.InMemoryGoldenManifestRepository` | `ArchLucid.Decisioning\Repositories\InMemoryGoldenManifestRepository.cs` | 94.44 | 1 | No |

### ArchLucid.Coordinator (93.31% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Coordinator.Services.CoordinatorService` | `ArchLucid.Coordinator\Services\CoordinatorService.cs` | 84.04 | 15 | No |
| 2 | `ArchLucid.Coordinator.Services.RunStarterTaskFactory` | `ArchLucid.Coordinator\Services\RunStarterTaskFactory.cs` | 99.28 | 1 | No |
| 3 | `ArchLucid.Coordinator.Services.CoordinationResult` | `ArchLucid.Coordinator\Services\CoordinationResult.cs` | 100.00 | 0 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Coordinator.Services.CoordinatorService` | `ArchLucid.Coordinator\Services\CoordinatorService.cs` | 84.04 | 15 | No |

### ArchLucid.Retrieval (95.07% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Retrieval.Embedding.CircuitBreakingOpenAiEmbeddingClient` | `ArchLucid.Retrieval\Embedding\CircuitBreakingOpenAiEmbeddingClient.cs` | 75.61 | 10 | No |
| 2 | `ArchLucid.Retrieval.Chunking.SimpleTextChunker` | `ArchLucid.Retrieval\Chunking\SimpleTextChunker.cs` | 91.67 | 1 | No |
| 3 | `ArchLucid.Retrieval.Indexing.InMemoryVectorIndex` | `ArchLucid.Retrieval\Indexing\InMemoryVectorIndex.cs` | 95.56 | 2 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Retrieval.Embedding.CircuitBreakingOpenAiEmbeddingClient` | `ArchLucid.Retrieval\Embedding\CircuitBreakingOpenAiEmbeddingClient.cs` | 75.61 | 10 | No |
| 2 | `ArchLucid.Retrieval.Chunking.SimpleTextChunker` | `ArchLucid.Retrieval\Chunking\SimpleTextChunker.cs` | 91.67 | 1 | No |

### ArchLucid.KnowledgeGraph (95.07% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.KnowledgeGraph.Models.GraphSnapshotIndexedEdge` | `ArchLucid.KnowledgeGraph\Models\GraphSnapshotIndexedEdge.cs` | 50.00 | 3 | No |
| 2 | `ArchLucid.KnowledgeGraph.Repositories.InMemoryGraphSnapshotRepository` | `ArchLucid.KnowledgeGraph\Repositories\InMemoryGraphSnapshotRepository.cs` | 87.50 | 4 | No |
| 3 | `ArchLucid.KnowledgeGraph.Inference.DefaultGraphEdgeInferer` | `ArchLucid.KnowledgeGraph\Inference\DefaultGraphEdgeInferer.cs` | 90.83 | 11 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.KnowledgeGraph.Models.GraphSnapshotIndexedEdge` | `ArchLucid.KnowledgeGraph\Models\GraphSnapshotIndexedEdge.cs` | 50.00 | 3 | No |
| 2 | `ArchLucid.KnowledgeGraph.Repositories.InMemoryGraphSnapshotRepository` | `ArchLucid.KnowledgeGraph\Repositories\InMemoryGraphSnapshotRepository.cs` | 87.50 | 4 | No |
| 3 | `ArchLucid.KnowledgeGraph.Inference.DefaultGraphEdgeInferer` | `ArchLucid.KnowledgeGraph\Inference\DefaultGraphEdgeInferer.cs` | 90.83 | 11 | No |

### ArchLucid.AgentSimulator (96.45% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.AgentSimulator.Scenarios.EnterpriseRagScenarioProvider` | `ArchLucid.AgentSimulator\Scenarios\EnterpriseRagScenarioProvider.cs` | 0.00 | 7 | No |
| 2 | `ArchLucid.AgentSimulator.Services.DeterministicAgentSimulator` | `ArchLucid.AgentSimulator\Services\DeterministicAgentSimulator.cs` | 86.36 | 3 | No |
| 3 | `ArchLucid.AgentSimulator.Services.FakeScenarioFactory` | `ArchLucid.AgentSimulator\Services\FakeScenarioFactory.cs` | 100.00 | 0 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.AgentSimulator.Scenarios.EnterpriseRagScenarioProvider` | `ArchLucid.AgentSimulator\Scenarios\EnterpriseRagScenarioProvider.cs` | 0.00 | 7 | No |
| 2 | `ArchLucid.AgentSimulator.Services.DeterministicAgentSimulator` | `ArchLucid.AgentSimulator\Services\DeterministicAgentSimulator.cs` | 86.36 | 3 | No |

### ArchLucid.Provenance (96.70% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Provenance.Services.ProvenanceGraphAlgorithms` | `ArchLucid.Provenance\Services\ProvenanceGraphAlgorithms.cs` | 85.71 | 11 | No |
| 2 | `ArchLucid.Provenance.Analysis.ProvenanceCompletenessAnalyzer` | `ArchLucid.Provenance\Analysis\ProvenanceCompletenessAnalyzer.cs` | 100.00 | 0 | No |
| 3 | `ArchLucid.Provenance.Analysis.ProvenanceCompletenessResult` | `ArchLucid.Provenance\Analysis\ProvenanceCompletenessResult.cs` | 100.00 | 0 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Provenance.Services.ProvenanceGraphAlgorithms` | `ArchLucid.Provenance\Services\ProvenanceGraphAlgorithms.cs` | 85.71 | 11 | No |

### ArchLucid.Persistence.Integration (99.19% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.OutboxAwareIntegrationEventPublishing` | `ArchLucid.Persistence.Integration\OutboxAwareIntegrationEventPublishing.cs` | 97.22 | 1 | No |
| 2 | `ArchLucid.Persistence.InMemoryIntegrationEventOutboxRepository` | `ArchLucid.Persistence.Integration\InMemoryIntegrationEventOutboxRepository.cs` | 99.08 | 1 | No |
| 3 | `ArchLucid.Persistence.IntegrationEventOutboxDeadLetterRow` | `ArchLucid.Persistence.Integration\IntegrationEventOutboxDeadLetterRow.cs` | 100.00 | 0 | No |

#### All classes below 95% line coverage

_No classes below 95% line coverage in Cobertura for this assembly._

### ArchLucid.Jobs.Cli (100.00% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Jobs.Cli.JobsCommandLine` | `ArchLucid.Jobs.Cli\JobsCommandLine.cs` | 100.00 | 0 | No |

#### All classes below 95% line coverage

_No classes below 95% line coverage in Cobertura for this assembly._

## Merged totals (reference)

- **Merged line coverage:** 72.95%
- **Merged branch coverage:** 58.71%

## Recent targeted tests (correctness improvement track)

- **2026-05-14 — Persistence (tenancy):** **`DapperTenantRepositoryConstructorTests`** — primary-constructor **`ArgumentNullException`** parameter names; **`DapperTenantRepositorySqlIntegrationTests`** — **`SystemWithPerTenantCatalogs`** suspend + **`ListTrialLifecycleAutomationTenantIdsAsync`** fan-out (same DB + active binding), **`TryIncrementActiveTrialRunAsync`** external connection/transaction, **`UpdateEntraTenantIdAsync`** miss + Entra collision, **`MarkTrialConvertedAsync`** null tier (**`CASE`** preserves tier), expired / inactive trial seat paths, **`TryMarkFirstManifestCommittedAsync`** zero ratio when limit unset, **`ListTenantIdsPendingTrialArchitecturePreseedAsync`** non-positive **`take`** clamp.
- **2026-05-14 — Api (`Demo` quick-start path):** **`QuickStartServiceTests`** — Moq **`IArchitectureRunCreateOrchestrator`** / **`IArchitectureRunExecuteOrchestrator`** / **`IArchitectureRunCommitOrchestrator`**; preset vs free-text **`ArchitectureRequest`** shaping (**`NormalizeDescription`**, constraints/capabilities), **`TopFindings`** severity ordering / **`DisplayTitle`** fallbacks, **`PublicSiteOptions`** deep links, **`IAuditService`** **`RunSubmitted`** / **`RunCompleted`** with **`Guid.TryParse`** vs opaque **`run id`**.
- **2026-05-14 — Api.Client (maintained surface):** **`FileParameterTests`** + **`ArchLucidApiClientWireTests`** — **`HttpClient`** stubs (**`VersionAsync`**, **`MeAsync`**, **`ExecutiveSummaryAsync`** / **`ProblemDetails`**), **`JsonStringEnumConverter`** parity (**`CitationReference`**), **`BaseUrl`** normalization. **`coverage.runsettings`** still excludes **`ArchLucid.Api.Client/Generated/`** from Cobertura line totals (hand-maintained surface only).
- **2026-05-13 — Integrations.AzureDevOps (unit) + coverage bookkeeping:** **`ArchLucid.Integrations.AzureDevOps.Tests`** now cover PR decorator compare skips/fallbacks, wire-format edge cases, markdown formatters, and the authority-run handler. Merged Cobertura refreshed: **`ArchLucid.Integrations.AzureDevOps`** at **90.15% line** (up from ~59.7%).
- **2026-05-13 — Api (no-SQL unit slice):** **`QuickStartPresetsTests`** (**`TryGet`**, keys, **`LogicalScopePins`**); **`AdminDiagnosticsServiceNonSqlTests`** — outbox snapshot aggregation, **`StorageProvider=InMemory`** short-circuit for orphan counts/remediations (strict **`IDbConnectionFactory`**), archival audit when **`IRunRepository`** returns updates.
- **2026-04-17 — Improvement 1 (`lowest-assembly-tests` slice, Api / Evolution):** **`EvolutionSimulationServiceTests`** — Moq repositories + **`IArchitectureAnalysisService`** / **`ISimulationEvaluationService`**; **`CreateCandidateFromImprovementPlanAsync`** throws **`EvolutionResourceNotFoundException`** with **`ProblemTypes.LearningImprovementPlanNotFound`** when plan missing; **`RunShadowEvaluationAsync`** with empty **`LinkedArchitectureRunIds`** updates candidate to **`Simulated`**, returns no simulation rows, never calls analysis/evaluation or run insert/delete.
- **2026-04-17 — Improvement 1 (`lowest-assembly-tests` slice, Api / Advisory):** **`AdvisoryControllerListRecommendationsIntegrationTests`** — **`GET /v1/advisory/runs/{runId}/recommendations`**: **200** + empty **`RecommendationRecordResponse`** list for a never-seeded run id; same after architecture **commit** before **`GET …/improvements`** (no persisted recommendations yet).
- **2026-04-17 — Improvement 1 (`lowest-assembly-tests` slice, Application / export):** **`EndToEndReplayComparisonExportServiceTests`** — Moq **`IEndToEndReplayComparisonSummaryFormatter`**; **`GenerateMarkdown`** **short** vs **default** (separator, **`## Run Metadata Diff`**, **`### Interpretation Notes`** / **`### Warnings`**); **`GenerateHtml`** **short** omits extended sections (**`Run Metadata Diff`**, interpretation lists).
- **2026-04-17 — Improvement 1 (`lowest-assembly-tests` slice, Persistence / Findings):** **`FindingsSnapshotRelationalReadOrderedAlternativePathsDirectSqlIntegrationTests`** — one **`FindingRecords`** row plus two **`FindingTraceAlternativePaths`** rows inserted with **non-monotonic** **`SortOrder`** (1 then 0); **`LoadRelationalSnapshotAsync`** returns **`ExplainabilityTrace.AlternativePathsConsidered`** in **`ORDER BY SortOrder`** order.
- **2026-04-17 — Improvement 1 (`lowest-assembly-tests` slice, Persistence / GoldenManifest):** **`GoldenManifestPhase1RelationalReadOrderedAssumptionsDirectSqlIntegrationTests`** — two **`GoldenManifestAssumptions`** rows inserted with **non-monotonic** **`SortOrder`** (1 then 0); **`HydrateAsync`** returns **`Assumptions`** in **`ORDER BY SortOrder`** order; **`AssumptionsJson`** ignored when relational rows exist.
- **2026-04-16 — Improvement 1 (`lowest-assembly-tests` slice, Persistence / Graph):** **`GraphSnapshotRelationalReadOrderedWarningsNoEdgesDirectSqlIntegrationTests`** — no relational nodes or edges; two **`GraphSnapshotWarnings`** rows inserted with **non-monotonic** **`SortOrder`** (1 then 0); asserts **`HydrateAsync`** returns warnings in **`ORDER BY SortOrder`** order and ignores **`WarningsJson`** on the relational path.
- **2026-04-16 — Weighted improvements 1–6 (verification + carry-over):** **`scripts/ci/assert_v1_traceability.py`** (per-assembly “no test matches” no longer zeroes whole solution; UTF-8 stdout; ASCII-safe logging). **`coverage_gap_analysis.py`** doc refresh from **`coverage-gap-1a/merged/Cobertura.xml`**. **Persistence:** migration **073** + **`SqlRunRepository`** archival cascade to **`ArtifactBundles`** / **`AgentExecutionTraces`** / **`ComparisonRecords`**; **`SqlRunRepositoryArchivalExtendedCascadeTests`**. **API:** **`ApiControllerMutationPolicyGuardTests`**, **`ApiVersioningReaderRoutingTests`**, combined **`QueryString`** + **`Header`** **`api-version`** readers. **Host.Composition:** **`AuthSafetyGuardTests`** + **`ArchLucidAuthorizationPoliciesRegistrationTests`** (regression for **Imp2** prompts).
- **2026-04-15 — Improvement 1 (branch / fallback branches, Persistence):** **`GoldenManifestPhase1RelationalReadWhitespaceJsonFallbackDirectSqlIntegrationTests`** — no relational slice rows + **whitespace/empty** **AssumptionsJson** / **WarningsJson** / **ProvenanceJson** / **DecisionsJson** + **ComplianceJson** whitespace → empty lists / default **ComplianceSection** (**`FallbackDeserializeList`**, **`FallbackDeserializeProvenance`**, **`FallbackDeserializeDecisions`**, **`DeserializeCompliance`**). **`GraphSnapshotRelationalReadJsonMergePartialEdgeDirectSqlIntegrationTests`** — **EdgesJson** merge on when **GraphSnapshotEdgeProperties** is empty; relational edge **e-sql-only** absent from **EdgesJson** → **`jsonById.TryGetValue`** false (no label/prop merge). **`FindingsSnapshotRelationalReadMinimalChildrenDirectSqlIntegrationTests`** — single **FindingRecord** with no child tables → empty **RelatedNodeIds** / **RecommendedActions** / **Properties** / **ExplainabilityTrace** slices.
- **2026-04-15 — Six improvement prompts (single session):** Run archival **SQL cascade** (**`066_GoldenManifestsFindingsSnapshots_ArchivedUtc`**, **`SqlRunRepository`** transactional batch + by-id); **`DataArchivalOrphanProbeSqlIntegrationTests`** asserts **`ArchivedUtc`** on **`dbo.GoldenManifests`** / **`dbo.FindingsSnapshots`**. **`DurableAuditLogRetry`** + **`DurableAuditLogRetryTests`**; **`ArchitectureRunCreateOrchestrator`** uses retry for **`CoordinatorRunCreated`**. **`IntegrationEventOutboxProcessorTests.ProcessPendingBatchAsync_processes_multiple_entries_in_one_batch`**; **`DataArchivalCoordinatorTests.RunOnceAsync_when_all_retention_non_positive_skips_archival_paths`**. Outbox convergence: **`archlucid:slo:integration_event_outbox_oldest_age_seconds`** + **`ArchLucidIntegrationEventOutboxConvergenceSlow`** (60s / 5m), **[API_SLOS.md](API_SLOS.md)** § Outbox convergence. **`stryker-config.persistence-coordination.json`** + scheduled workflow matrix + **`stryker-baselines.json`** (**PersistenceCoordination** 65%). **`ApiControllerProblemDetailsSourceGuardTests`** — bare **`Conflict()`** / **`BadRequest()`** guard.
- **2026-04-15 — Correctness prompts 1 / 2 / 3 / 5 / 6 (session):** **`ManifestVersionIncrementRules`** + **`ManifestVersionIncrementPropertyTests`**; **`ArchitectureRunStatusTransitionPropertyTests`**; **`AlertDeliveryCompositeKeyPropertyTests`**; **`AgentExecutionTraceRecorderRecordAsyncEdgeTests`**; **`DapperArchitectureRunIdempotencyRepositoryContractTests.TryInsert_parallel_same_key_only_one_wins`** (SQL); **`DataArchivalOrphanProbeSqlIntegrationTests`** (orphan probe SQL mirrored from **`DataConsistencyOrphanProbeSql`**, post-**`DataArchivalCoordinator`**); **`IntegrationEventPublishingTests`** + **`CircuitBreakerGateAuditCallbackTests`** (fatal-exception filters on **`IntegrationEventPublishing`**, **`CircuitBreakerGate`**, **`CircuitBreakerAuditBridge`**). Cursor rule **`.cursor/rules/SingleLineThrowNoBraces.mdc`** (single-line **`throw`** without braces when it is the only statement).
- **2026-04-15 — Improvement 1 (prompts `coverage-gap-report`, `lowest-assembly-tests`, `governance-workflow-fscheck`):** ReportGenerator merge from **`coverage-gap-1a/**/coverage.cobertura.xml`** after a **partial** full-solution run (**`GreenfieldSqlBootIntegrationTests`** failed once with SQL “Operation cancelled by user” — re-run **`dotnet test ArchLucid.sln`** with coverage for a clean merge). **`GoldenManifestPhase1RelationalReadDirectSqlIntegrationTests`**: relational **decisions** with **no** **GoldenManifestDecisionEvidenceLinks** / **GoldenManifestDecisionNodeLinks**; **provenance** with **GoldenManifestProvenanceAppliedRules** only (findings + graph nodes empty, JSON provenance loses to relational rules). **`GovernanceWorkflowDryRunSubmissionPropertyTests`**: FsCheck dry **`SubmitApprovalRequestAsync`** → **Submitted** shape, **`CreateAsync` / baseline / durable audit** never called (valid dev→test and test→prod pairs).
- **2026-04-15 — doc refresh:** Full **`coverage-gap-report`** pipeline (solution test + ReportGenerator + **`scripts/ci/coverage_gap_analysis.py`**). Narrative bullets may lag the **Data source** timestamp in **`docs/COVERAGE_GAP_ANALYSIS.md`**; trust the generated tables for percentages.
- **2026-04-15 — tests:** **`GoldenManifestPhase1RelationalReadDirectSqlIntegrationTests`** — relational **decisions** (**GoldenManifestDecisionEvidenceLinks** / **GoldenManifestDecisionNodeLinks**, **SortOrder**), **provenance** from **GoldenManifestProvenanceSourceGraphNodes** + **GoldenManifestProvenanceAppliedRules** without source-finding rows, relational **warnings** + **provenance source findings**, JSON fallbacks (**AssumptionsJson**, **ProvenanceJson**, **DecisionsJson**) when relational slice rows are absent. **`GraphSnapshotRelationalReadDirectSqlIntegrationTests`** — **GraphSnapshotWarnings** override + **EdgesJson** merge when **GraphSnapshotEdgeProperties** is empty. **`FindingsSnapshotRelationalReadDirectSqlIntegrationTests`** — full relational **FindingRecords** path. **`RunLifecycleStatePropertyTests`** (`ArchLucid.Application.Tests`) — FsCheck **`CommitRunAsync`** gates. **`GovernanceWorkflowTransitionConflictPropertyTests`** — concurrent terminal peer → **`GovernanceApprovalReviewConflictException`**; invalid env pairs on **`SubmitApprovalRequestAsync`**. **`GovernanceWorkflowSegregationAndPromotionPropertyTests`** — **`PromoteAsync`** rejects approval **ManifestVersion** mismatch. **`scripts/ci/coverage_gap_analysis.py`** — **`ValueError`** handler uses the correct file path variable.
- **2026-04-14:** Extended **`GoldenManifestPhase1RelationalReadDirectSqlIntegrationTests`** with relational **warnings** and **provenance source findings** (SQL). **`AlertEvaluatorDeduplicationKeyPropertyTests`** — dedupe keys for **`CriticalRecommendationCount`** and **`NewComplianceGapCount`** (`ArchLucid.Decisioning.Tests`).

## How to refresh

Narrative bullets under **Recent targeted tests** live in `docs/library/COVERAGE_GAP_ANALYSIS_RECENT.md` and are merged by this script when that file exists.

```powershell
# Remove old shards so ReportGenerator does not merge stale + new Cobertura files.
Remove-Item -Recurse -Force .\coverage-gap-1a -ErrorAction SilentlyContinue
dotnet test ArchLucid.sln -c Release --settings coverage.runsettings `
  --collect:"XPlat Code Coverage" --results-directory .\coverage-gap-1a
dotnet tool restore
dotnet reportgenerator "-reports:coverage-gap-1a/**/coverage.cobertura.xml" "-targetdir:coverage-gap-1a/merged" "-reporttypes:Cobertura"
python scripts/ci/coverage_gap_analysis.py
# Or: gh run download <run-id> -n coverage-merged-cobertura -D .\ci-cov
#     python scripts/ci/coverage_gap_analysis.py --cobertura .\ci-cov\Cobertura.xml
```
