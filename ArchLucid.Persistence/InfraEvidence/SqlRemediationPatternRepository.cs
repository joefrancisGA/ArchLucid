using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlRemediationPatternRepository(ISqlConnectionFactory connectionFactory)
    : IRemediationPatternRepository
{
    public async Task InsertPatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(pattern);

        const string sql = """
                           INSERT INTO dbo.RemediationPatterns
                           (
                               PatternId, TenantId, PatternKey, DisplayName, Description,
                               CurrentApprovedVersion, CreatedByActorKey, CreatedUtc, UpdatedUtc
                           )
                           VALUES
                           (
                               @PatternId, @TenantId, @PatternKey, @DisplayName, @Description,
                               @CurrentApprovedVersion, @CreatedByActorKey, @CreatedUtc, @UpdatedUtc
                           );
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(new CommandDefinition(sql, pattern, cancellationToken: cancellationToken));
    }

    public async Task InsertVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(version);

        const string sql = """
                           INSERT INTO dbo.RemediationPatternVersions
                           (
                               VersionId, PatternId, TenantId, Version, Status, ControlObjective, ContentJson,
                               MatchProvider, MatchResourceType, MatchControlId, MatchSeverityMin, MatchPropertyEqualsJson,
                               AutomationLevel, AuthorActorKey, ApprovedByActorKey, ApprovedUtc, CreatedUtc, UpdatedUtc
                           )
                           VALUES
                           (
                               @VersionId, @PatternId, @TenantId, @Version, @Status, @ControlObjective, @ContentJson,
                               @MatchProvider, @MatchResourceType, @MatchControlId, @MatchSeverityMin, @MatchPropertyEqualsJson,
                               @AutomationLevel, @AuthorActorKey, @ApprovedByActorKey, @ApprovedUtc, @CreatedUtc, @UpdatedUtc
                           );
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(new CommandDefinition(sql, MapVersionParameters(version), cancellationToken: cancellationToken));
    }

    public async Task UpdateVersionAsync(RemediationPatternVersionRecord version, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(version);

        const string sql = """
                           UPDATE dbo.RemediationPatternVersions
                           SET Status = @Status,
                               ApprovedByActorKey = @ApprovedByActorKey,
                               ApprovedUtc = @ApprovedUtc,
                               UpdatedUtc = @UpdatedUtc
                           WHERE TenantId = @TenantId AND VersionId = @VersionId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    version.VersionId,
                    version.TenantId,
                    Status = (int)version.Status,
                    version.ApprovedByActorKey,
                    version.ApprovedUtc,
                    version.UpdatedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task UpdatePatternAsync(RemediationPatternRecord pattern, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(pattern);

        const string sql = """
                           UPDATE dbo.RemediationPatterns
                           SET CurrentApprovedVersion = @CurrentApprovedVersion,
                               UpdatedUtc = @UpdatedUtc
                           WHERE TenantId = @TenantId AND PatternId = @PatternId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    pattern.PatternId,
                    pattern.TenantId,
                    pattern.CurrentApprovedVersion,
                    pattern.UpdatedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<RemediationPatternRecord?> TryGetPatternByIdAsync(
        Guid tenantId,
        Guid patternId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT PatternId, TenantId, PatternKey, DisplayName, Description,
                                  CurrentApprovedVersion, CreatedByActorKey, CreatedUtc, UpdatedUtc
                           FROM dbo.RemediationPatterns
                           WHERE TenantId = @TenantId AND PatternId = @PatternId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        PatternRow? row = await conn.QuerySingleOrDefaultAsync<PatternRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, PatternId = patternId }, cancellationToken: cancellationToken));

        return row is null ? null : MapPattern(row);
    }

    public async Task<RemediationPatternRecord?> TryGetPatternByKeyAsync(
        Guid tenantId,
        string patternKey,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT PatternId, TenantId, PatternKey, DisplayName, Description,
                                  CurrentApprovedVersion, CreatedByActorKey, CreatedUtc, UpdatedUtc
                           FROM dbo.RemediationPatterns
                           WHERE TenantId = @TenantId AND PatternKey = @PatternKey;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        PatternRow? row = await conn.QuerySingleOrDefaultAsync<PatternRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, PatternKey = patternKey }, cancellationToken: cancellationToken));

        return row is null ? null : MapPattern(row);
    }

    public async Task<RemediationPatternVersionRecord?> TryGetVersionAsync(
        Guid tenantId,
        Guid patternId,
        string version,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT VersionId, PatternId, TenantId, Version, Status, ControlObjective, ContentJson,
                                  MatchProvider, MatchResourceType, MatchControlId, MatchSeverityMin, MatchPropertyEqualsJson,
                                  AutomationLevel, AuthorActorKey, ApprovedByActorKey, ApprovedUtc, CreatedUtc, UpdatedUtc
                           FROM dbo.RemediationPatternVersions
                           WHERE TenantId = @TenantId AND PatternId = @PatternId AND Version = @Version;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        VersionRow? row = await conn.QuerySingleOrDefaultAsync<VersionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, PatternId = patternId, Version = version },
                cancellationToken: cancellationToken));

        return row is null ? null : MapVersion(row);
    }

    public async Task<IReadOnlyList<RemediationPatternRecord>> ListPatternsAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT PatternId, TenantId, PatternKey, DisplayName, Description,
                                  CurrentApprovedVersion, CreatedByActorKey, CreatedUtc, UpdatedUtc
                           FROM dbo.RemediationPatterns
                           WHERE TenantId = @TenantId
                           ORDER BY UpdatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<PatternRow> rows = await conn.QueryAsync<PatternRow>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return rows.Select(MapPattern).ToList();
    }

    public async Task<IReadOnlyList<RemediationPatternVersionRecord>> ListVersionsByPatternAsync(
        Guid tenantId,
        Guid patternId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT VersionId, PatternId, TenantId, Version, Status, ControlObjective, ContentJson,
                                  MatchProvider, MatchResourceType, MatchControlId, MatchSeverityMin, MatchPropertyEqualsJson,
                                  AutomationLevel, AuthorActorKey, ApprovedByActorKey, ApprovedUtc, CreatedUtc, UpdatedUtc
                           FROM dbo.RemediationPatternVersions
                           WHERE TenantId = @TenantId AND PatternId = @PatternId
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<VersionRow> rows = await conn.QueryAsync<VersionRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, PatternId = patternId }, cancellationToken: cancellationToken));

        return rows.Select(MapVersion).ToList();
    }

    public async Task<IReadOnlyList<RemediationPatternApprovedVersionRecord>> ListApprovedVersionsForTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT v.VersionId, v.PatternId, v.TenantId, v.Version, v.Status, v.ControlObjective, v.ContentJson,
                                  v.MatchProvider, v.MatchResourceType, v.MatchControlId, v.MatchSeverityMin, v.MatchPropertyEqualsJson,
                                  v.AutomationLevel, v.AuthorActorKey, v.ApprovedByActorKey, v.ApprovedUtc, v.CreatedUtc, v.UpdatedUtc,
                                  p.PatternKey, p.DisplayName, p.Description, p.CurrentApprovedVersion, p.CreatedByActorKey,
                                  p.CreatedUtc AS PatternCreatedUtc, p.UpdatedUtc AS PatternUpdatedUtc
                           FROM dbo.RemediationPatternVersions v
                           INNER JOIN dbo.RemediationPatterns p
                               ON p.TenantId = v.TenantId AND p.PatternId = v.PatternId
                           WHERE v.TenantId = @TenantId AND v.Status = @ApprovedStatus
                           ORDER BY p.PatternKey, v.Version;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ApprovedVersionRow> rows = await conn.QueryAsync<ApprovedVersionRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, ApprovedStatus = (int)RemediationPatternStatus.Approved },
                cancellationToken: cancellationToken));

        return rows.Select(MapApprovedVersion).ToList();
    }

    private static RemediationPatternApprovedVersionRecord MapApprovedVersion(ApprovedVersionRow row) =>
        new()
        {
            Pattern = new RemediationPatternRecord
            {
                PatternId = row.PatternId,
                TenantId = row.TenantId,
                PatternKey = row.PatternKey,
                DisplayName = row.DisplayName,
                Description = row.Description,
                CurrentApprovedVersion = row.CurrentApprovedVersion,
                CreatedByActorKey = row.CreatedByActorKey,
                CreatedUtc = row.PatternCreatedUtc,
                UpdatedUtc = row.PatternUpdatedUtc,
            },
            Version = MapVersion(row),
        };

    private sealed class ApprovedVersionRow : VersionRow
    {
        public string PatternKey
        {
            get;
            init;
        } = string.Empty;

        public string DisplayName
        {
            get;
            init;
        } = string.Empty;

        public string? Description
        {
            get;
            init;
        }

        public string? CurrentApprovedVersion
        {
            get;
            init;
        }

        public string CreatedByActorKey
        {
            get;
            init;
        } = string.Empty;

        public DateTime PatternCreatedUtc
        {
            get;
            init;
        }

        public DateTime PatternUpdatedUtc
        {
            get;
            init;
        }
    }

    private static object MapVersionParameters(RemediationPatternVersionRecord version) =>
        new
        {
            version.VersionId,
            version.PatternId,
            version.TenantId,
            version.Version,
            Status = (int)version.Status,
            version.ControlObjective,
            version.ContentJson,
            MatchProvider = version.MatchProvider.HasValue ? (int?)version.MatchProvider.Value : null,
            version.MatchResourceType,
            version.MatchControlId,
            version.MatchSeverityMin,
            version.MatchPropertyEqualsJson,
            AutomationLevel = (int)version.AutomationLevel,
            version.AuthorActorKey,
            version.ApprovedByActorKey,
            version.ApprovedUtc,
            version.CreatedUtc,
            version.UpdatedUtc,
        };

    private static RemediationPatternRecord MapPattern(PatternRow row) =>
        new()
        {
            PatternId = row.PatternId,
            TenantId = row.TenantId,
            PatternKey = row.PatternKey,
            DisplayName = row.DisplayName,
            Description = row.Description,
            CurrentApprovedVersion = row.CurrentApprovedVersion,
            CreatedByActorKey = row.CreatedByActorKey,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
        };

    private static RemediationPatternVersionRecord MapVersion(VersionRow row) =>
        new()
        {
            VersionId = row.VersionId,
            PatternId = row.PatternId,
            TenantId = row.TenantId,
            Version = row.Version,
            Status = (RemediationPatternStatus)row.Status,
            ControlObjective = row.ControlObjective,
            ContentJson = row.ContentJson,
            MatchProvider = row.MatchProvider.HasValue ? (CloudProvider)row.MatchProvider.Value : null,
            MatchResourceType = row.MatchResourceType,
            MatchControlId = row.MatchControlId,
            MatchSeverityMin = row.MatchSeverityMin,
            MatchPropertyEqualsJson = row.MatchPropertyEqualsJson,
            AutomationLevel = (RemediationAutomationLevel)row.AutomationLevel,
            AuthorActorKey = row.AuthorActorKey,
            ApprovedByActorKey = row.ApprovedByActorKey,
            ApprovedUtc = row.ApprovedUtc,
            CreatedUtc = row.CreatedUtc,
            UpdatedUtc = row.UpdatedUtc,
        };

    private sealed class PatternRow
    {
        public Guid PatternId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string PatternKey
        {
            get;
            init;
        } = string.Empty;

        public string DisplayName
        {
            get;
            init;
        } = string.Empty;

        public string? Description
        {
            get;
            init;
        }

        public string? CurrentApprovedVersion
        {
            get;
            init;
        }

        public string CreatedByActorKey
        {
            get;
            init;
        } = string.Empty;

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }
    }

    private class VersionRow
    {
        public Guid VersionId
        {
            get;
            init;
        }

        public Guid PatternId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public string Version
        {
            get;
            init;
        } = string.Empty;

        public int Status
        {
            get;
            init;
        }

        public string ControlObjective
        {
            get;
            init;
        } = string.Empty;

        public string ContentJson
        {
            get;
            init;
        } = string.Empty;

        public int? MatchProvider
        {
            get;
            init;
        }

        public string? MatchResourceType
        {
            get;
            init;
        }

        public string? MatchControlId
        {
            get;
            init;
        }

        public string? MatchSeverityMin
        {
            get;
            init;
        }

        public string? MatchPropertyEqualsJson
        {
            get;
            init;
        }

        public int AutomationLevel
        {
            get;
            init;
        }

        public string AuthorActorKey
        {
            get;
            init;
        } = string.Empty;

        public string? ApprovedByActorKey
        {
            get;
            init;
        }

        public DateTime? ApprovedUtc
        {
            get;
            init;
        }

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public DateTime UpdatedUtc
        {
            get;
            init;
        }
    }
}
