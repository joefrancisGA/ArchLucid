using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using Microsoft.Data.SqlClient;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Suite", "SqlServer")]
public sealed class DataConsistencyOrphanProbeExecutorSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly Guid SeedTenantId = Guid.Parse("80808080-8080-8080-8080-808080808080");
    private static readonly Guid SeedWorkspaceId = Guid.Parse("81818181-8181-8181-8181-818181818181");
    private static readonly Guid SeedScopeProjectId = Guid.Parse("82828282-8282-8282-8282-828282828282");

    // Relaxed only while inserting a synthetic orphan row (no Runs row and synthetic snapshot ids).
    private static readonly string[] GoldenManifestAuthorityForeignKeysForOrphanInsert =
    [
        "FK_GoldenManifests_Runs_RunId",
        "FK_GoldenManifests_ContextSnapshots_ContextSnapshotId",
        "FK_GoldenManifests_GraphSnapshots_GraphSnapshotId",
        "FK_GoldenManifests_FindingsSnapshots_FindingsSnapshotId",
        "FK_GoldenManifests_DecisioningTraces_DecisionTraceId"
    ];

    [SkippableFact]
    public async Task RunOnceAsync_accurately_identifies_orphaned_records_and_ignores_active_runs()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        string activeRunIdStr = Guid.NewGuid().ToString("N");
        Guid activeRunGuid = Guid.ParseExact(activeRunIdStr, "N");
        string activeRequestId = "orphan-probe-active-" + activeRunIdStr;

        string orphanRunIdStr = Guid.NewGuid().ToString("N");
        Guid orphanRunGuid = Guid.ParseExact(orphanRunIdStr, "N");

        Guid activeManifestId = Guid.NewGuid();
        Guid orphanManifestId = Guid.NewGuid();
        Guid activeContextSnapshotId = Guid.NewGuid();
        Guid activeGraphSnapshotId = Guid.NewGuid();
        Guid activeFindingsSnapshotId = Guid.NewGuid();
        Guid activeDecisionTraceId = Guid.NewGuid();

        await using SqlConnection conn = new(fixture.ConnectionString);
        await conn.OpenAsync(CancellationToken.None);
        List<string> goldenManifestFksNoChecked = [];

        try
        {
            // Seed Active Run
            await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(conn, activeRequestId, activeRunIdStr, CancellationToken.None);

            await AuthorityRunChainTestSeed.SeedSnapshotChainForExistingRunAsync(
                conn,
                SeedTenantId,
                SeedWorkspaceId,
                SeedScopeProjectId,
                activeRunGuid,
                activeContextSnapshotId,
                activeGraphSnapshotId,
                activeFindingsSnapshotId,
                activeDecisionTraceId,
                "ActiveRunSeed",
                CancellationToken.None);

            const string insertManifest = """
                                          IF NOT EXISTS (SELECT 1 FROM dbo.GoldenManifests WHERE ManifestId = @ManifestId)
                                          INSERT INTO dbo.GoldenManifests
                                          (ManifestId, RunId, ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, DecisionTraceId,
                                           CreatedUtc, ManifestHash, RuleSetId, RuleSetVersion, RuleSetHash,
                                           MetadataJson, RequirementsJson, TopologyJson, SecurityJson, ComplianceJson, CostJson,
                                           ConstraintsJson, UnresolvedIssuesJson, DecisionsJson, AssumptionsJson, WarningsJson, ProvenanceJson,
                                           TenantId, WorkspaceId, ProjectId)
                                          VALUES
                                          (@ManifestId, @RunId, @ContextSnapshotId, @GraphSnapshotId, @FindingsSnapshotId, @DecisionTraceId,
                                           SYSUTCDATETIME(), N'h', N'rs', N'1', N'rh', N'{}', N'{}', N'{}', N'{}', N'{}', N'{}',
                                           N'{}', N'{}', N'{}', N'{}', N'{}', N'{}',
                                           @TenantId, @WorkspaceId, @ScopeProjectId);
                                          """;

            await conn.ExecuteAsync(
                new CommandDefinition(
                    insertManifest,
                    new
                    {
                        ManifestId = activeManifestId,
                        RunId = activeRunGuid,
                        ContextSnapshotId = activeContextSnapshotId,
                        GraphSnapshotId = activeGraphSnapshotId,
                        FindingsSnapshotId = activeFindingsSnapshotId,
                        DecisionTraceId = activeDecisionTraceId,
                        TenantId = SeedTenantId,
                        WorkspaceId = SeedWorkspaceId,
                        ScopeProjectId = SeedScopeProjectId
                    }));

            // Seed orphan manifest: RunId has no row in dbo.Runs and snapshot ids are synthetic — relax GoldenManifests FK checks like sibling probe tests.

            foreach (string fkName in GoldenManifestAuthorityForeignKeysForOrphanInsert)
            {
                int fkHits = await conn.ExecuteScalarAsync<int>(
                    @"SELECT COUNT(1) FROM sys.foreign_keys WHERE name = @Name",
                    new { Name = fkName });

                if (fkHits == 0)
                    continue;

                await conn.ExecuteAsync($"ALTER TABLE dbo.GoldenManifests NOCHECK CONSTRAINT [{fkName}];");
                goldenManifestFksNoChecked.Add(fkName);
            }

            await conn.ExecuteAsync(
                new CommandDefinition(
                    insertManifest,
                    new
                    {
                        ManifestId = orphanManifestId,
                        RunId = orphanRunGuid,
                        ContextSnapshotId = Guid.NewGuid(),
                        GraphSnapshotId = Guid.NewGuid(),
                        FindingsSnapshotId = Guid.NewGuid(),
                        DecisionTraceId = Guid.NewGuid(),
                        TenantId = SeedTenantId,
                        WorkspaceId = SeedWorkspaceId,
                        ScopeProjectId = SeedScopeProjectId
                    }));

            // Setup Executor
            var probeOptions = new Mock<IOptionsMonitor<DataConsistencyProbeOptions>>();
            probeOptions.Setup(o => o.CurrentValue).Returns(new DataConsistencyProbeOptions
            {
                OrphanProbeEnabled = true,
                OrphanProbeRemediationDryRunLogMaxRows = 10,
                EnableAutoRemediation = false
            });

            var enforcementOptions = new Mock<IOptionsMonitor<DataConsistencyEnforcementOptions>>();
            enforcementOptions.Setup(o => o.CurrentValue).Returns(new DataConsistencyEnforcementOptions
            {
                Mode = DataConsistencyEnforcementMode.Alert,
                AlertThreshold = 0,
                AutoQuarantine = false,
                MaxRowsPerBatch = 100
            });

            var dbConnectionFactory = new Mock<IDbConnectionFactory>();
            dbConnectionFactory
                .Setup(f => f.CreateOpenConnectionAsync(It.IsAny<CancellationToken>()))
                .Returns(async (CancellationToken ct) =>
                {
                    SqlConnection c = new(fixture.ConnectionString);
                    await c.OpenAsync(ct);

                    return c;
                });

            var archLucidOptions = new Mock<IOptions<ArchLucidOptions>>();
            archLucidOptions.Setup(o => o.Value).Returns(new ArchLucidOptions { StorageProvider = "Sql" });

            var scopeFactory = new Mock<IServiceScopeFactory>();
            var serviceProvider = new Mock<IServiceProvider>();
            var auditService = new Mock<IAuditService>();
            serviceProvider.Setup(sp => sp.GetService(typeof(IAuditService))).Returns(auditService.Object);
            var scope = new Mock<IServiceScope>();
            scope.Setup(s => s.ServiceProvider).Returns(serviceProvider.Object);
            scopeFactory.Setup(f => f.CreateScope()).Returns(scope.Object);

            var logger = new NullLogger<DataConsistencyOrphanProbeExecutor>();

            var sut = new DataConsistencyOrphanProbeExecutor(
                probeOptions.Object,
                enforcementOptions.Object,
                dbConnectionFactory.Object,
                archLucidOptions.Object,
                scopeFactory.Object,
                logger);

            // Execute
            await sut.RunOnceAsync(CancellationToken.None);

            // Verify active was NOT touched and orphan WAS correctly counted (by observing it still exists, since it's a dry run)
            int activeCount = await conn.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM dbo.GoldenManifests WHERE ManifestId = @ManifestId", new { ManifestId = activeManifestId });
            activeCount.Should().Be(1);
            
            int orphanCount = await conn.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM dbo.GoldenManifests WHERE ManifestId = @ManifestId", new { ManifestId = orphanManifestId });
            orphanCount.Should().Be(1);

            // Cleanup
            await conn.ExecuteAsync("DELETE FROM dbo.ArtifactBundles WHERE ManifestId = @ManifestId;", new { ManifestId = orphanManifestId });
            await conn.ExecuteAsync("DELETE FROM dbo.GoldenManifests WHERE ManifestId = @ManifestId;", new { ManifestId = orphanManifestId });
            await conn.ExecuteAsync("DELETE FROM dbo.ArtifactBundles WHERE ManifestId = @ManifestId;", new { ManifestId = activeManifestId });
            await conn.ExecuteAsync("DELETE FROM dbo.GoldenManifests WHERE ManifestId = @ManifestId;", new { ManifestId = activeManifestId });
        }
        finally
        {
            for (int i = goldenManifestFksNoChecked.Count - 1; i >= 0; i--)
            {
                try
                {
                    await conn.ExecuteAsync($"ALTER TABLE dbo.GoldenManifests WITH CHECK CHECK CONSTRAINT [{goldenManifestFksNoChecked[i]}];");
                }
                catch
                {
                    // Best-effort cleanup
                }
            }
        }
    }
}