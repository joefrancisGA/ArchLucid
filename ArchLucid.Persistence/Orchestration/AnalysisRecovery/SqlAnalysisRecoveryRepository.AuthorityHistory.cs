using ArchLucid.Core.Scoping;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Orchestration.AnalysisRecovery;

public sealed partial class SqlAnalysisRecoveryRepository
{
    public async Task<AuthorityGraphCheckpointPredecessor?> ReadImmediateAuthorityGraphPredecessorAsync(
        ProjectScopeKey scope, Guid runId, long activeFence, CancellationToken cancellationToken)
    {
        DynamicParameters parameters = Bind(new AnalysisRecoveryStageKey(scope, "authority", runId, "graph"));

        if (activeFence <= 1)
            return null;

        parameters.Add("ActiveFence", activeFence);
        await using SqlConnection db = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        const string sql = """
            SELECT h.InputVersion, h.Fence, h.Attempts, h.ResultReference, h.SupersededUtc
            FROM dbo.AnalysisStageRecovery AS c
            INNER JOIN dbo.AnalysisStageRecoveryHistory AS h
              ON h.TenantId = c.TenantId AND h.WorkspaceId = c.WorkspaceId AND h.ProjectId = c.ProjectId
             AND h.Pipeline = c.Pipeline AND h.RunId = c.RunId AND h.Stage = c.Stage
             AND h.Fence = c.Fence - 1 AND h.Attempts = c.Attempts - 1
            INNER JOIN dbo.Runs AS r
              ON r.TenantId = c.TenantId AND r.WorkspaceId = c.WorkspaceId AND r.ScopeProjectId = c.ProjectId
             AND r.RunId = c.RunId AND r.GraphSnapshotId = TRY_CONVERT(uniqueidentifier, c.ResultReference)
            INNER JOIN dbo.GraphSnapshots AS sourceGraph
              ON sourceGraph.TenantId = r.TenantId AND sourceGraph.WorkspaceId = r.WorkspaceId
             AND sourceGraph.ScopeProjectId = r.ScopeProjectId AND sourceGraph.RunId = r.RunId
             AND sourceGraph.ContextSnapshotId = r.ContextSnapshotId
             AND sourceGraph.GraphSnapshotId = TRY_CONVERT(uniqueidentifier, h.ResultReference)
            INNER JOIN dbo.GraphSnapshots AS activeGraph
              ON activeGraph.TenantId = r.TenantId AND activeGraph.WorkspaceId = r.WorkspaceId
             AND activeGraph.ScopeProjectId = r.ScopeProjectId AND activeGraph.RunId = r.RunId
             AND activeGraph.ContextSnapshotId = r.ContextSnapshotId AND activeGraph.GraphSnapshotId = r.GraphSnapshotId
            INNER JOIN dbo.AnalysisStageRecovery AS contextCheckpoint
              ON contextCheckpoint.TenantId = c.TenantId AND contextCheckpoint.WorkspaceId = c.WorkspaceId
             AND contextCheckpoint.ProjectId = c.ProjectId AND contextCheckpoint.Pipeline = c.Pipeline
             AND contextCheckpoint.RunId = c.RunId AND contextCheckpoint.Stage = N'context_ingestion'
             AND contextCheckpoint.State = N'succeeded' AND contextCheckpoint.Fence = 1
             AND DATALENGTH(contextCheckpoint.ResultReference) = 72
             AND TRY_CONVERT(uniqueidentifier, contextCheckpoint.ResultReference) = r.ContextSnapshotId
            WHERE c.TenantId = @TenantId AND c.WorkspaceId = @WorkspaceId AND c.ProjectId = @ProjectId
              AND c.Pipeline = @Pipeline AND c.RunId = @RunId AND c.Stage = @Stage
              AND c.Fence = @ActiveFence AND c.State = N'succeeded' AND h.State = N'succeeded'
              AND h.InputVersion <> c.InputVersion AND h.ResultReference <> c.ResultReference
              AND DATALENGTH(h.ResultReference) = 72 AND DATALENGTH(c.ResultReference) = 72
              AND TRY_CONVERT(uniqueidentifier, h.ResultReference) IS NOT NULL
              AND r.GoldenManifestId IS NULL AND r.CompletedUtc IS NULL AND r.ArchivedUtc IS NULL;
            """;

        return await db.QuerySingleOrDefaultAsync<AuthorityGraphCheckpointPredecessor>(
            new CommandDefinition(sql, parameters, cancellationToken: cancellationToken));
    }
}
