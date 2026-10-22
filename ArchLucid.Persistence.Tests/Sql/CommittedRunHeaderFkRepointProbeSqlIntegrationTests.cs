using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Sql;

/// <summary>
///     TB-311: committed run header FK repoint detection SQL (dangling and cross-run child links).
/// </summary>
[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Suite", "SqlServer")]
public sealed class CommittedRunHeaderFkRepointProbeSqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    private static readonly Guid SeedTenantId = Guid.Parse("90909090-9090-9090-9090-909090909090");

    private static readonly Guid SeedWorkspaceId = Guid.Parse("91919191-9191-9191-9191-919191919191");

    private static readonly Guid SeedScopeProjectId = Guid.Parse("92929292-9292-9292-9292-929292929292");

    private static ScopeContext IsolatedScope() => new()
    {
        TenantId = SeedTenantId,
        WorkspaceId = SeedWorkspaceId,
        ProjectId = SeedScopeProjectId,
    };

    [SkippableFact]
    public async Task Clean_committed_run_reports_zero_repoint_violations()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid decisionTraceId = Guid.NewGuid();
        string requestId = "header-repoint-clean-" + runId.ToString("N");

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();

        await SeedCommittedRunAsync(
            connection,
            requestId,
            runId,
            manifestId,
            contextId,
            graphId,
            findingsId,
            decisionTraceId,
            artifactBundleId: null);

        // Probe SQL is global; other tests in this collection intentionally leave repoint violations.
        long contextCount = await CountForRunAsync(connection, runId, CommittedRunHeaderFkRepointProbeSql.ContextSnapshotId);
        long graphCount = await CountForRunAsync(connection, runId, CommittedRunHeaderFkRepointProbeSql.GraphSnapshotId);
        long findingsCount = await CountForRunAsync(connection, runId, CommittedRunHeaderFkRepointProbeSql.FindingsSnapshotId);
        long manifestCount = await CountForRunAsync(connection, runId, CommittedRunHeaderFkRepointProbeSql.GoldenManifestId);
        long traceCount = await CountForRunAsync(connection, runId, CommittedRunHeaderFkRepointProbeSql.DecisionTraceId);

        contextCount.Should().Be(0);
        graphCount.Should().Be(0);
        findingsCount.Should().Be(0);
        manifestCount.Should().Be(0);
        traceCount.Should().Be(0);
    }

    [SkippableFact]
    public async Task Dangling_context_snapshot_pointer_is_detected()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid runId = Guid.NewGuid();
        Guid manifestId = Guid.NewGuid();
        Guid danglingContextId = Guid.NewGuid();
        string requestId = "header-repoint-dangling-" + runId.ToString("N");

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();

        await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(connection, requestId, runId.ToString("N"), CancellationToken.None);

        await connection.ExecuteAsync(
            """
            UPDATE dbo.Runs
            SET GoldenManifestId = @GoldenManifestId,
                ContextSnapshotId = @ContextSnapshotId,
                LegacyRunStatus = N'Committed',
                CompletedUtc = SYSUTCDATETIME()
            WHERE RunId = @RunId;
            """,
            new
            {
                RunId = runId,
                GoldenManifestId = manifestId,
                ContextSnapshotId = danglingContextId,
            });

        long count = await CountForRunAsync(connection, runId, CommittedRunHeaderFkRepointProbeSql.ContextSnapshotId);

        count.Should().Be(1);
    }

    [SkippableFact]
    public async Task Cross_run_graph_snapshot_pointer_is_detected()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        Guid ownerRunId = Guid.NewGuid();
        Guid violatingRunId = Guid.NewGuid();
        Guid ownerManifestId = Guid.NewGuid();
        Guid violatingManifestId = Guid.NewGuid();
        Guid contextId = Guid.NewGuid();
        Guid graphId = Guid.NewGuid();
        Guid findingsId = Guid.NewGuid();
        Guid decisionTraceId = Guid.NewGuid();
        string ownerRequestId = "header-repoint-owner-" + ownerRunId.ToString("N");
        string violatingRequestId = "header-repoint-violator-" + violatingRunId.ToString("N");

        await using SqlConnection connection = new(fixture.ConnectionString);
        await connection.OpenAsync();

        await SeedCommittedRunAsync(
            connection,
            ownerRequestId,
            ownerRunId,
            ownerManifestId,
            contextId,
            graphId,
            findingsId,
            decisionTraceId,
            artifactBundleId: null);

        await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(
            connection,
            violatingRequestId,
            violatingRunId.ToString("N"),
            CancellationToken.None);

        await connection.ExecuteAsync(
            """
            UPDATE dbo.Runs
            SET GoldenManifestId = @GoldenManifestId,
                ContextSnapshotId = @ContextSnapshotId,
                GraphSnapshotId = @GraphSnapshotId,
                FindingsSnapshotId = @FindingsSnapshotId,
                DecisionTraceId = @DecisionTraceId,
                LegacyRunStatus = N'Committed',
                CompletedUtc = SYSUTCDATETIME()
            WHERE RunId = @RunId;
            """,
            new
            {
                RunId = violatingRunId,
                GoldenManifestId = violatingManifestId,
                ContextSnapshotId = contextId,
                GraphSnapshotId = graphId,
                FindingsSnapshotId = findingsId,
                DecisionTraceId = decisionTraceId,
            });

        long count = await CountForRunAsync(connection, violatingRunId, CommittedRunHeaderFkRepointProbeSql.GraphSnapshotId);

        count.Should().Be(1);
    }

    private static async Task SeedCommittedRunAsync(
        SqlConnection connection,
        string requestId,
        Guid runId,
        Guid manifestId,
        Guid contextId,
        Guid graphId,
        Guid findingsId,
        Guid decisionTraceId,
        Guid? artifactBundleId)
    {
        await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(
            connection,
            requestId,
            runId.ToString("N"),
            IsolatedScope(),
            CancellationToken.None);

        await AuthorityRunChainTestSeed.SeedSnapshotChainForExistingRunAsync(
            connection,
            SeedTenantId,
            SeedWorkspaceId,
            SeedScopeProjectId,
            runId,
            contextId,
            graphId,
            findingsId,
            decisionTraceId,
            "HeaderRepointSeed",
            CancellationToken.None);

        const string insertManifest = """
                                      INSERT INTO dbo.GoldenManifests
                                      (
                                          ManifestId, RunId, ContextSnapshotId, GraphSnapshotId, FindingsSnapshotId, DecisionTraceId,
                                          CreatedUtc, ManifestHash, RuleSetId, RuleSetVersion, RuleSetHash,
                                          MetadataJson, RequirementsJson, TopologyJson, SecurityJson, ComplianceJson, CostJson,
                                          ConstraintsJson, UnresolvedIssuesJson, DecisionsJson, AssumptionsJson, WarningsJson, ProvenanceJson,
                                          TenantId, WorkspaceId, ProjectId
                                      )
                                      VALUES
                                      (
                                          @ManifestId, @RunId, @ContextSnapshotId, @GraphSnapshotId, @FindingsSnapshotId, @DecisionTraceId,
                                          SYSUTCDATETIME(), N'h', N'rs', N'1', N'rh', N'{}', N'{}', N'{}', N'{}', N'{}', N'{}',
                                          N'{}', N'{}', N'{}', N'{}', N'{}', N'{}',
                                          @TenantId, @WorkspaceId, @ScopeProjectId
                                      );
                                      """;

        await connection.ExecuteAsync(
            insertManifest,
            new
            {
                ManifestId = manifestId,
                RunId = runId,
                ContextSnapshotId = contextId,
                GraphSnapshotId = graphId,
                FindingsSnapshotId = findingsId,
                DecisionTraceId = decisionTraceId,
                TenantId = SeedTenantId,
                WorkspaceId = SeedWorkspaceId,
                ScopeProjectId = SeedScopeProjectId,
            });

        if (artifactBundleId is Guid bundleId)
        {
            await connection.ExecuteAsync(
                """
                INSERT INTO dbo.ArtifactBundles (BundleId, RunId, ManifestId, CreatedUtc, TenantId, WorkspaceId, ProjectId)
                VALUES (@BundleId, @RunId, @ManifestId, SYSUTCDATETIME(), @TenantId, @WorkspaceId, @ScopeProjectId);
                """,
                new
                {
                    BundleId = bundleId,
                    RunId = runId,
                    ManifestId = manifestId,
                    TenantId = SeedTenantId,
                    WorkspaceId = SeedWorkspaceId,
                    ScopeProjectId = SeedScopeProjectId,
                });
        }

        await connection.ExecuteAsync(
            """
            UPDATE dbo.Runs
            SET GoldenManifestId = @GoldenManifestId,
                ContextSnapshotId = @ContextSnapshotId,
                GraphSnapshotId = @GraphSnapshotId,
                FindingsSnapshotId = @FindingsSnapshotId,
                DecisionTraceId = @DecisionTraceId,
                ArtifactBundleId = @ArtifactBundleId,
                LegacyRunStatus = N'Committed',
                CompletedUtc = SYSUTCDATETIME()
            WHERE RunId = @RunId;
            """,
            new
            {
                RunId = runId,
                GoldenManifestId = manifestId,
                ContextSnapshotId = contextId,
                GraphSnapshotId = graphId,
                FindingsSnapshotId = findingsId,
                DecisionTraceId = decisionTraceId,
                ArtifactBundleId = artifactBundleId,
            });
    }

    private static async Task<long> CountForRunAsync(SqlConnection connection, Guid runId, string probeSql)
    {
        string scopedSql = probeSql.TrimEnd().TrimEnd(';') + "\n  AND r.RunId = @RunId;";

        object? scalar = await connection.ExecuteScalarAsync(scopedSql, new { RunId = runId });

        return scalar switch
        {
            long count => count,
            int count => count,
            _ => Convert.ToInt64(scalar ?? 0L),
        };
    }
}
