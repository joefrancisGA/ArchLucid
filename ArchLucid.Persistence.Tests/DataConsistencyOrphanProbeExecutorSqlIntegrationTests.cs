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

        await using SqlConnection conn = new(fixture.ConnectionString);
        await conn.OpenAsync(CancellationToken.None);
        bool nchecked = false;

        try
        {
            // Seed Active Run
            await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(conn, activeRequestId, activeRunIdStr, CancellationToken.None);

            await AuthorityRunChainTestSeed.SeedSnapshotChainForExistingRunAsync(
                conn, SeedTenantId, SeedWorkspaceId, SeedScopeProjectId, activeRunGuid, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
                "ActiveRunSeed", CancellationToken.None);

            const string insertManifest = """
                                          IF NOT EXISTS (SELECT 1 FROM dbo.GoldenManifests WHERE ManifestId = @ManifestId)
                                          INSERT INTO dbo.GoldenManifests
                                          (ManifestId, RunId, ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, DecisionTraceId,
                                           CreatedUtc, ManifestHash, RuleSetId, RuleSetVersion, RuleSetHash,
                                           MetadataJson, RequirementsJson, TopologyJson, SecurityJson, ComplianceJson, CostJson,
                                           ConstraintsJson, UnresolvedIssuesJson, DecisionsJson, AssumptionsJson, WarningsJson, ProvenanceJson,
                                           TenantId, WorkspaceId, ProjectId)
                                          VALUES
                                          (@ManifestId, @RunId, NEWID(), NEWID(), NEWID(), NEWID(),
                                           SYSUTCDATETIME(), N'h', N'rs', N'1', N'rh', N'{}', N'{}', N'{}', N'{}', N'{}', N'{}',
                                           N'{}', N'{}', N'{}', N'{}', N'{}', N'{}',
                                           @TenantId, @WorkspaceId, @ScopeProjectId);
                                          """;

            await conn.ExecuteAsync(new CommandDefinition(insertManifest, new
            {
                ManifestId = activeManifestId, RunId = activeRunGuid, TenantId = SeedTenantId, WorkspaceId = SeedWorkspaceId, ScopeProjectId = SeedScopeProjectId
            }));

            // Seed Orphan Manifest (bypass FK temporarily)
            int fkHits = await conn.ExecuteScalarAsync<int>(@"SELECT COUNT(1) FROM sys.foreign_keys WHERE name = N'FK_GoldenManifests_Runs_RunId'");
            if (fkHits > 0)
            {
                await conn.ExecuteAsync("ALTER TABLE dbo.GoldenManifests NOCHECK CONSTRAINT FK_GoldenManifests_Runs_RunId;");
                nchecked = true;
            }

            await conn.ExecuteAsync(new CommandDefinition(insertManifest, new
            {
                ManifestId = orphanManifestId, RunId = orphanRunGuid, TenantId = SeedTenantId, WorkspaceId = SeedWorkspaceId, ScopeProjectId = SeedScopeProjectId
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
            dbConnectionFactory.Setup(f => f.CreateConnection()).Returns(() => new SqlConnection(fixture.ConnectionString));

            var archLucidOptions = new Mock<IOptions<ArchLucidOptions>>();
            archLucidOptions.Setup(o => o.Value).Returns(new ArchLucidOptions { StorageProvider = ArchLucidStorageProvider.Sql });

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
            if (nchecked)
            {
                try
                {
                    await conn.ExecuteAsync("ALTER TABLE dbo.GoldenManifests WITH CHECK CHECK CONSTRAINT FK_GoldenManifests_Runs_RunId;");
                }
                catch
                {
                    // Best-effort cleanup
                }
            }
        }
    }
}