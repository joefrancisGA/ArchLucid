using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlSecurityEvidencePathRepository
{
    public async Task<IReadOnlyList<SecurityEvidencePathRecord>> ListByIdsInScopeAsync(
        ProjectScopeKey scope,
        IReadOnlyCollection<Guid> pathIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(pathIds);

        Guid[] distinctIds = pathIds.Where(pathId => pathId != Guid.Empty).Distinct().ToArray();

        if (distinctIds.Length == 0)
        {
            return [];
        }

        const string sql = """
                           SELECT PathId, TenantId, WorkspaceId, ProjectId, SnapshotId, PathKind, PathConfidenceBand,
                                  CanonicalHopHashSha256, WeakestHopOrdinal, WeakestHopReason, CrownJewelAssertionId,
                                  CreatedUtc, UpdatedUtc
                           FROM dbo.SecurityEvidencePaths
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND PathId IN @PathIds;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<PathRow> rows = await conn.QueryAsync<PathRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    PathIds = distinctIds,
                },
                cancellationToken: cancellationToken));

        return rows.Select(MapPath).ToList();
    }
}
