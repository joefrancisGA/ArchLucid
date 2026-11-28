using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;
using ArchLucid.Persistence.Tests.Support;

using Dapper;

using Microsoft.Data.SqlClient;

using Moq;

namespace ArchLucid.Persistence.Tests.Orchestration.AnalysisRecovery;

[Trait("Category", "Integration")]
[Collection(nameof(SqlServerPersistenceCollection))]
public sealed class SqlAuthorityGraphCheckpointHistoryTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Only_the_adjacent_successful_current_unsealed_graph_predecessor_is_visible()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
        ScopeContext scope = ArchitectureCommitTestSeed.AsScopeContext();
        ProjectScopeKey project = ProjectScopeKey.From(scope);
        Guid runId = Guid.NewGuid();
        Guid context = Guid.NewGuid();
        Guid firstGraph = Guid.NewGuid();
        Guid replacementGraph = Guid.NewGuid();
        var key = new AnalysisRecoveryStageKey(project, "authority", runId, "graph");
        Mock<IScopeContextProvider> scoped = new(MockBehavior.Strict);
        scoped.Setup(provider => provider.GetCurrentScope()).Returns(scope);
        ISqlConnectionFactory connections = new SqlConnectionFactory(fixture.ConnectionString);
        SqlAnalysisRecoveryRepository checkpoints = new(connections, scoped.Object);
        CancellationToken ct = CancellationToken.None;
        await using SqlConnection db = await connections.CreateOpenConnectionAsync(ct);
        await ArchitectureCommitTestSeed.InsertRequestAndRunAsync(db,
            $"fnd084-{runId:N}", runId.ToString("N"), ct);

        await db.ExecuteAsync(new CommandDefinition("""
            INSERT INTO dbo.ContextSnapshots
                (SnapshotId, RunId, ProjectId, TenantId, WorkspaceId, ScopeProjectId, CreatedUtc,
                 CanonicalObjectsJson, WarningsJson, ErrorsJson, SourceHashesJson)
            SELECT @ContextId, RunId, ProjectId, TenantId, WorkspaceId, ScopeProjectId, SYSUTCDATETIME(), N'[]', N'[]', N'[]', N'{}'
            FROM dbo.Runs
            WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ScopeProjectId = @ProjectId AND RunId = @RunId;
            UPDATE dbo.Runs SET ContextSnapshotId = @ContextId
            WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ScopeProjectId = @ProjectId AND RunId = @RunId;
            INSERT INTO dbo.GraphSnapshots
                (GraphSnapshotId, ContextSnapshotId, RunId, TenantId, WorkspaceId, ScopeProjectId, CreatedUtc,
                 NodesJson, EdgesJson, WarningsJson)
            SELECT g.GraphId, @ContextId, r.RunId, r.TenantId, r.WorkspaceId, r.ScopeProjectId, SYSUTCDATETIME(), N'[]', N'[]', N'[]'
            FROM dbo.Runs AS r CROSS JOIN (VALUES (@FirstGraph), (@ReplacementGraph)) AS g(GraphId)
            WHERE r.TenantId = @TenantId AND r.WorkspaceId = @WorkspaceId AND r.ScopeProjectId = @ProjectId AND r.RunId = @RunId;
            """, new
            {
                scope.TenantId, scope.WorkspaceId, scope.ProjectId, RunId = runId,
                ContextId = context, FirstGraph = firstGraph, ReplacementGraph = replacementGraph,
            }, cancellationToken: ct));
        var contextKey = new AnalysisRecoveryStageKey(project, "authority", runId, "context_ingestion");
        Guid contextOwner = Guid.NewGuid();
        AnalysisRecoveryClaim contextClaim = await checkpoints.ClaimForAuthorityInputsAsync(
            contextKey, new string('C', 64), contextOwner, 30, 3, ct);
        Assert.True(await checkpoints.CompleteAsync(contextKey, contextOwner, contextClaim.Fence, context.ToString("D"), null, ct));

        Guid firstOwner = Guid.NewGuid();
        string firstVersion = new('A', 64);
        AnalysisRecoveryClaim first = await checkpoints.ClaimForAuthorityInputsAsync(key, firstVersion, firstOwner, 30, 3, ct);
        Assert.True(await checkpoints.CompleteAsync(key, firstOwner, first.Fence, firstGraph.ToString("D"), null, ct));
        await AnchorGraphAsync(firstGraph);
        Assert.Null(await checkpoints.ReadImmediateAuthorityGraphPredecessorAsync(project, runId, first.Fence, ct));

        Guid replacementOwner = Guid.NewGuid();
        AnalysisRecoveryClaim replacement =
            await checkpoints.ClaimForAuthorityInputsAsync(key, new string('B', 64), replacementOwner, 30, 3, ct);
        Assert.Null(await checkpoints.ReadImmediateAuthorityGraphPredecessorAsync(project, runId, replacement.Fence, ct));
        Assert.True(await checkpoints.CompleteAsync(key, replacementOwner, replacement.Fence, replacementGraph.ToString("D"), null, ct));
        Assert.Null(await checkpoints.ReadImmediateAuthorityGraphPredecessorAsync(project, runId, replacement.Fence, ct));
        await AnchorGraphAsync(replacementGraph);

        var previous = await checkpoints.ReadImmediateAuthorityGraphPredecessorAsync(project, runId, replacement.Fence, ct);
        Assert.NotNull(previous);
        Assert.Equal(firstGraph.ToString("D"), previous.ResultReference);
        Assert.Equal(firstVersion, previous.InputVersion);
        Assert.Equal(first.Fence, previous.Fence);
        Assert.Equal(first.Attempts, previous.Attempts);
        Assert.Null(await checkpoints.ReadImmediateAuthorityGraphPredecessorAsync(project, runId, replacement.Fence + 1, ct));

        Guid otherGraphProject = Guid.NewGuid();
        await db.ExecuteAsync(new CommandDefinition("""
            UPDATE dbo.GraphSnapshots SET ScopeProjectId = @OtherProject
            WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ScopeProjectId = @ProjectId AND GraphSnapshotId = @Graph;
            """, new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, Graph = firstGraph, OtherProject = otherGraphProject }, cancellationToken: ct));
        Assert.Null(await checkpoints.ReadImmediateAuthorityGraphPredecessorAsync(project, runId, replacement.Fence, ct));
        await db.ExecuteAsync(new CommandDefinition("""
            UPDATE dbo.GraphSnapshots SET ScopeProjectId = @ProjectId
            WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ScopeProjectId = @OtherProject AND GraphSnapshotId = @Graph;
            """, new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, Graph = firstGraph, OtherProject = otherGraphProject }, cancellationToken: ct));

        ProjectScopeKey foreign = ProjectScopeKey.Create(scope.TenantId, scope.WorkspaceId, Guid.NewGuid());
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            checkpoints.ReadImmediateAuthorityGraphPredecessorAsync(foreign, runId, replacement.Fence, ct));
        scoped.Setup(provider => provider.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = foreign.TenantId, WorkspaceId = foreign.WorkspaceId, ProjectId = foreign.ProjectId,
        });
        Assert.Null(await checkpoints.ReadImmediateAuthorityGraphPredecessorAsync(foreign, runId, replacement.Fence, ct));
        scoped.Setup(provider => provider.GetCurrentScope()).Returns(scope);

        await db.ExecuteAsync(new CommandDefinition("""
            UPDATE dbo.Runs SET CompletedUtc = SYSUTCDATETIME()
            WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ScopeProjectId = @ProjectId AND RunId = @RunId;
            """, new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, RunId = runId }, cancellationToken: ct));
        Assert.Null(await checkpoints.ReadImmediateAuthorityGraphPredecessorAsync(project, runId, replacement.Fence, ct));

        async Task AnchorGraphAsync(Guid graphId)
        {
            await db.ExecuteAsync(new CommandDefinition("""
                UPDATE dbo.Runs SET GraphSnapshotId = @GraphSnapshotId
                WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND ScopeProjectId = @ProjectId AND RunId = @RunId;
                """, new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, RunId = runId, GraphSnapshotId = graphId },
                cancellationToken: ct));
        }
    }
}
