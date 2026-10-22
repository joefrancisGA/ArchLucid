using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlSecurityEvidencePathRepository
{
    public async Task<IReadOnlyList<SecurityEvidencePathHopEdgeTypeReadModel>> ListHopEdgeTypesBySnapshotAsync(
        ProjectSnapshotScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT h.PathId, h.EdgeType
                           FROM dbo.SecurityEvidencePathHops h
                           INNER JOIN dbo.SecurityEvidencePaths p
                               ON p.TenantId = h.TenantId AND p.PathId = h.PathId
                           WHERE p.TenantId = @TenantId
                             AND p.WorkspaceId = @WorkspaceId
                             AND p.ProjectId = @ProjectId
                             AND p.SnapshotId = @SnapshotId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<SecurityEvidencePathHopEdgeTypeReadModel> rows =
            await conn.QueryAsync<SecurityEvidencePathHopEdgeTypeReadModel>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        scope.Project.TenantId,
                        scope.Project.WorkspaceId,
                        scope.Project.ProjectId,
                        scope.SnapshotId,
                    },
                    cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<IReadOnlyList<SecurityEvidencePathHopOutcomeMetricReadModel>> ListHopOutcomeMetricsBySnapshotAsync(
        ProjectSnapshotScopeKey scope,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT h.PathId, h.EdgeType, h.FromNodeId, h.ToNodeId
                           FROM dbo.SecurityEvidencePathHops h
                           INNER JOIN dbo.SecurityEvidencePaths p
                               ON p.TenantId = h.TenantId AND p.PathId = h.PathId
                           WHERE p.TenantId = @TenantId
                             AND p.WorkspaceId = @WorkspaceId
                             AND p.ProjectId = @ProjectId
                             AND p.SnapshotId = @SnapshotId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<SecurityEvidencePathHopOutcomeMetricReadModel> rows =
            await conn.QueryAsync<SecurityEvidencePathHopOutcomeMetricReadModel>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        scope.Project.TenantId,
                        scope.Project.WorkspaceId,
                        scope.Project.ProjectId,
                        scope.SnapshotId,
                    },
                    cancellationToken: cancellationToken));

        return rows.ToList();
    }
}
