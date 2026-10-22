using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlSecurityEvidenceCutPointRepository
{
    public async Task<IReadOnlyList<SecurityEvidenceCutPointRecord>> ListBySnapshotsInScopeAsync(
        ProjectScopeKey scope,
        IReadOnlyCollection<Guid> snapshotIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(snapshotIds);

        Guid[] distinctIds = snapshotIds.Where(snapshotId => snapshotId != Guid.Empty).Distinct().ToArray();

        if (distinctIds.Length == 0)
        {
            return [];
        }

        const string sql = """
                           SELECT c.CutPointId, c.TenantId, c.SnapshotId, c.RuleVersion, c.CutKind, c.CutKey,
                                  c.FromNodeId, c.ToNodeId, c.EdgeType, c.PathsCollapsedCount, c.OperationalCostClass,
                                  c.LeverageScore, c.CutOrder, c.EvidenceReferencesJson, c.CollapsedPathIdsJson,
                                  c.SuggestedPatternKey, c.CloudResourceId, c.ResourceType, c.ComputedUtc
                           FROM dbo.SecurityEvidenceCutPoints c
                           WHERE c.TenantId = @TenantId
                             AND c.SnapshotId IN @SnapshotIds
                             AND EXISTS (
                                 SELECT 1
                                 FROM dbo.SecurityEvidencePaths p
                                 WHERE p.TenantId = c.TenantId
                                   AND p.SnapshotId = c.SnapshotId
                                   AND p.WorkspaceId = @WorkspaceId
                                   AND p.ProjectId = @ProjectId
                             )
                           ORDER BY c.CutOrder, c.CutPointId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<CutPointRow> rows = await conn.QueryAsync<CutPointRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    SnapshotIds = distinctIds,
                },
                cancellationToken: cancellationToken));

        return rows.Select(MapCutPoint).ToList();
    }
}
