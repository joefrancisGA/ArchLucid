using System.Text.Json;

using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlRemediationPatternRepository
{
    /// <inheritdoc />
    public async Task<RemediationPatternApprovedVersionRecord?> TryGetCurrentApprovedVersionAsync(
        Guid tenantId,
        Guid patternId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (tenantId == Guid.Empty || patternId == Guid.Empty)
            return null;

        // One SQL statement binds the tenant, current pointer and Approved
        // status. A separate pattern lookup followed by TryGetVersionAsync
        // can race a replacement, retirement or revocation of that pointer.
        const string sql = """
                           SELECT v.VersionId, v.PatternId, v.TenantId, v.Version, v.Status, v.ControlObjective,
                                  v.ContentJson, v.MatchProvider, v.MatchResourceType, v.MatchControlId,
                                  v.MatchSeverityMin, v.MatchPropertyEqualsJson, v.AutomationLevel,
                                  v.AuthorActorKey, v.ApprovedByActorKey, v.ApprovedUtc, v.CreatedUtc, v.UpdatedUtc,
                                  p.PatternKey, p.DisplayName, p.Description, p.CurrentApprovedVersion,
                                  p.CreatedByActorKey, p.CreatedUtc AS PatternCreatedUtc,
                                  p.UpdatedUtc AS PatternUpdatedUtc
                           FROM dbo.RemediationPatterns p
                           INNER JOIN dbo.RemediationPatternVersions v
                             ON v.TenantId = p.TenantId
                            AND v.PatternId = p.PatternId
                            AND v.Version = p.CurrentApprovedVersion
                           WHERE p.TenantId = @TenantId
                             AND p.PatternId = @PatternId
                             AND v.Status = @ApprovedStatus
                             AND v.ApprovedUtc IS NOT NULL
                             AND v.ApprovedByActorKey IS NOT NULL
                             AND LTRIM(RTRIM(v.ApprovedByActorKey)) <> N'';
                           """;

        using System.Data.IDbConnection conn =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ApprovedVersionRow? row = await conn.QuerySingleOrDefaultAsync<ApprovedVersionRow>(
            new CommandDefinition(sql,
                new
                {
                    TenantId = tenantId,
                    PatternId = patternId,
                    ApprovedStatus = (int)RemediationPatternStatus.Approved
                },
                cancellationToken: cancellationToken));

        return row is null ? null : MapApprovedVersion(row);
    }

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
