using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlRemediationPatternRepository
{
    public async Task<IReadOnlyList<RemediationPatternVersionRecord>> TryGetVersionsAsync(
        Guid tenantId,
        IReadOnlyList<RemediationPatternVersionKey> keys,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(keys);

        List<RemediationPatternVersionKey> distinctKeys = keys
            .Where(item => item.PatternId != Guid.Empty && !string.IsNullOrWhiteSpace(item.Version))
            .Distinct()
            .ToList();

        if (distinctKeys.Count == 0)
            return [];

        List<string> compositeKeys = distinctKeys
            .Select(item => $"{item.PatternId:N}|{item.Version}")
            .ToList();

        const string sql = """
                           SELECT VersionId, PatternId, TenantId, Version, Status, ControlObjective, ContentJson,
                                  MatchProvider, MatchResourceType, MatchControlId, MatchSeverityMin, MatchPropertyEqualsJson,
                                  AutomationLevel, AuthorActorKey, ApprovedByActorKey, ApprovedUtc, CreatedUtc, UpdatedUtc
                           FROM dbo.RemediationPatternVersions
                           WHERE TenantId = @TenantId
                             AND CONCAT(CONVERT(char(36), PatternId), '|', Version) IN @CompositeKeys;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<VersionRow> rows = await conn.QueryAsync<VersionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, CompositeKeys = compositeKeys },
                cancellationToken: cancellationToken));

        return rows.Select(MapVersion).ToList();
    }
}
