using System.Globalization;

using ArchLucid.Host.Core.DataConsistency;

using ArchLucid.Persistence.Tests.Support;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Positive detection for <see cref="DataConsistencyOrphanProbeSql.ArtifactBundlesRunId" /> (Improvement #12).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Suite", "SqlServer")]
public sealed class DataConsistencyOrphanProbeArtifactBundlePositiveDetectionSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly Guid SeedTenantId = Guid.Parse("70707070-7070-7070-7070-707070707070");

    private static readonly Guid SeedWorkspaceId = Guid.Parse("71717171-7171-7171-7171-717171717171");

    private static readonly Guid SeedScopeProjectId = Guid.Parse("72727272-7272-7272-7272-727272727272");

    [SkippableFact]
    public async Task Probe_detects_orphan_artifact_bundle_after_bogus_run_id()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        string runId = Guid.NewGuid().ToString("N");
        Guid runGuid = Guid.ParseExact(runId, "N");
        string requestId = "orphan-probe-bundle-req-" + runId;
        Guid manifestId = Guid.NewGuid();
        Guid bundleId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsSnapId = Guid.NewGuid();
        Guid decisionTraceId = Guid.NewGuid();
        Guid bogusRunId = Guid.NewGuid();

        await using SqlConnection conn = new(fixture.ConnectionString);
        await conn.OpenAsync(CancellationToken.None);
        bool nchecked = false;

        try
        {
            await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(conn, requestId, runId, CancellationToken.None);

            await AuthorityRunChainTestSeed.SeedSnapshotChainForExistingRunAsync(
                conn,
                SeedTenantId,
                SeedWorkspaceId,
                SeedScopeProjectId,
                runGuid,
                contextId,
                graphId,
                findingsSnapId,
                decisionTraceId,
                "OrphanBundlePositiveProbeSeed",
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
                        ManifestId = manifestId,
                        RunId = runGuid,
                        ContextSnapshotId = contextId,
                        GraphSnapshotId = graphId,
                        FindingsSnapshotId = findingsSnapId,
                        DecisionTraceId = decisionTraceId,
                        TenantId = SeedTenantId,
                        WorkspaceId = SeedWorkspaceId,
                        ScopeProjectId = SeedScopeProjectId
                    },
                    cancellationToken: CancellationToken.None));

            const string insertBundle = """
                                        IF NOT EXISTS (SELECT 1 FROM dbo.ArtifactBundles WHERE BundleId = @BundleId)
                                        INSERT INTO dbo.ArtifactBundles
                                        (BundleId, RunId, ManifestId, CreatedUtc, ArtifactsJson, TraceJson, TenantId, WorkspaceId, ProjectId)
                                        VALUES
                                        (@BundleId, @RunId, @ManifestId, SYSUTCDATETIME(), NULL, NULL, @TenantId, @WorkspaceId, @ScopeProjectId);
                                        """;

            await conn.ExecuteAsync(
                new CommandDefinition(
                    insertBundle,
                    new
                    {
                        BundleId = bundleId,
                        RunId = runGuid,
                        ManifestId = manifestId,
                        TenantId = SeedTenantId,
                        WorkspaceId = SeedWorkspaceId,
                        ScopeProjectId = SeedScopeProjectId
                    },
                    cancellationToken: CancellationToken.None));

            object? fkRow = await conn.ExecuteScalarAsync(
                new CommandDefinition(
                    """
                    SELECT COUNT(1)
                    FROM sys.foreign_keys
                    WHERE name = N'FK_ArtifactBundles_Runs_RunId'
                      AND parent_object_id = OBJECT_ID(N'dbo.ArtifactBundles');
                    """,
                    cancellationToken: CancellationToken.None));

            int fkHits = fkRow is int i ? i : Convert.ToInt32(fkRow ?? 0, CultureInfo.InvariantCulture);

            if (fkHits > 0)
            {
                await conn.ExecuteAsync(
                    new CommandDefinition(
                        "ALTER TABLE dbo.ArtifactBundles NOCHECK CONSTRAINT FK_ArtifactBundles_Runs_RunId;",
                        cancellationToken: CancellationToken.None));

                nchecked = true;
            }

            await conn.ExecuteAsync(
                new CommandDefinition(
                    "UPDATE dbo.ArtifactBundles SET RunId = @BogusRunId WHERE BundleId = @BundleId;",
                    new
                    {
                        BogusRunId = bogusRunId,
                        BundleId = bundleId
                    },
                    cancellationToken: CancellationToken.None));

            long bundleOrphans = await ScalarCountAsync(conn, DataConsistencyOrphanProbeSql.ArtifactBundlesRunId, CancellationToken.None);
            bundleOrphans.Should().BeGreaterThanOrEqualTo(1L);
        }
        finally
        {
            await conn.ExecuteAsync(
                new CommandDefinition(
                    "DELETE FROM dbo.ArtifactBundles WHERE BundleId = @BundleId;",
                    new { BundleId = bundleId },
                    cancellationToken: CancellationToken.None));

            await conn.ExecuteAsync(
                new CommandDefinition(
                    "DELETE FROM dbo.GoldenManifests WHERE ManifestId = @ManifestId;",
                    new { ManifestId = manifestId },
                    cancellationToken: CancellationToken.None));

            if (nchecked)
            {
                try
                {
                    await conn.ExecuteAsync(
                        new CommandDefinition(
                            """
                            ALTER TABLE dbo.ArtifactBundles WITH CHECK CHECK CONSTRAINT FK_ArtifactBundles_Runs_RunId;
                            """,
                            cancellationToken: CancellationToken.None));
                }
                catch
                {
                    // Best-effort teardown on shared SQL containers.
                }
            }
        }
    }

    private static async Task<long> ScalarCountAsync(SqlConnection connection, string sql, CancellationToken ct)
    {
        object? scalar = await connection.ExecuteScalarAsync(new CommandDefinition(sql, cancellationToken: ct));

        return scalar is long l ? l : Convert.ToInt64(scalar ?? 0L, CultureInfo.InvariantCulture);
    }
}
