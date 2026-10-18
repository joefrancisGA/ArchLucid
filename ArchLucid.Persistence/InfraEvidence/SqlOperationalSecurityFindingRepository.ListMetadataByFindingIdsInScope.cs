using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlOperationalSecurityFindingRepository
{
    public async Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingIdsInScopeAsync(
        ProjectScopeKey scope,
        IReadOnlyList<Guid> findingIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(findingIds);

        List<Guid> distinctFindingIds = findingIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();

        if (distinctFindingIds.Count == 0)
            return [];

        const string sql = """
                           SELECT m.MetadataRowId, m.FindingId, m.TenantId, m.MetadataKey, m.MetadataValue
                           FROM dbo.OperationalSecurityFindingMetadata m
                           INNER JOIN dbo.OperationalSecurityFindings f
                               ON f.TenantId = m.TenantId AND f.FindingId = m.FindingId
                           WHERE m.TenantId = @TenantId
                             AND f.WorkspaceId = @WorkspaceId
                             AND f.ProjectId = @ProjectId
                             AND m.FindingId IN @FindingIds
                           ORDER BY m.FindingId, m.MetadataKey;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<MetadataRow> rows = await conn.QueryAsync<MetadataRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    FindingIds = distinctFindingIds,
                },
                cancellationToken: cancellationToken));

        return rows.Select(MapMetadata).ToList();
    }
}
