using System.Text.Json;

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

        const string sql = """
                           SELECT VersionId, PatternId, TenantId, Version, Status, ControlObjective, ContentJson,
                                  MatchProvider, MatchResourceType, MatchControlId, MatchSeverityMin, MatchPropertyEqualsJson,
                                  AutomationLevel, AuthorActorKey, ApprovedByActorKey, ApprovedUtc, CreatedUtc, UpdatedUtc
                           FROM dbo.RemediationPatternVersions v
                           WHERE v.TenantId = @TenantId
                             AND EXISTS (
                                 SELECT 1
                                 FROM OPENJSON(@KeysJson) WITH (
                                     PatternId uniqueidentifier '$.PatternId',
                                     Version nvarchar(max) '$.Version'
                                 ) k
                                 WHERE k.PatternId = v.PatternId AND k.Version = v.Version
                             );
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<VersionRow> rows = await conn.QueryAsync<VersionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, KeysJson = JsonSerializer.Serialize(distinctKeys) },
                cancellationToken: cancellationToken));

        return rows.Select(MapVersion).ToList();
    }
}
