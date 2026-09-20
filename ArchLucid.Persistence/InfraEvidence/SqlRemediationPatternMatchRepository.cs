using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlRemediationPatternMatchRepository(ISqlConnectionFactory connectionFactory)
    : IRemediationPatternMatchRepository
{
    public async Task DeactivateMatchesForFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE dbo.RemediationPatternMatchResults
                           SET IsActive = 0
                           WHERE TenantId = @TenantId AND FindingId = @FindingId AND IsActive = 1;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(sql, new { TenantId = tenantId, FindingId = findingId }, cancellationToken: cancellationToken));
    }

    public async Task DeactivateMatchesForFindingInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           UPDATE m
                           SET IsActive = 0
                           FROM dbo.RemediationPatternMatchResults m
                           INNER JOIN dbo.OperationalSecurityFindings f
                               ON f.TenantId = m.TenantId AND f.FindingId = m.FindingId
                           WHERE m.TenantId = @TenantId
                             AND m.FindingId = @FindingId
                             AND m.IsActive = 1
                             AND f.WorkspaceId = @WorkspaceId
                             AND f.ProjectId = @ProjectId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, FindingId = findingId },
                cancellationToken: cancellationToken));
    }

    public async Task InsertMatchResultAsync(
        RemediationPatternMatchResultRecord matchResult,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(matchResult);

        const string sql = """
                           INSERT INTO dbo.RemediationPatternMatchResults
                           (
                               MatchResultId, TenantId, FindingId, PatternId, VersionId, PatternKey, PatternVersion,
                               MatchKind, MatchSource, ExplainText, IsActive, MatchedUtc
                           )
                           VALUES
                           (
                               @MatchResultId, @TenantId, @FindingId, @PatternId, @VersionId, @PatternKey, @PatternVersion,
                               @MatchKind, @MatchSource, @ExplainText, @IsActive, @MatchedUtc
                           );
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    matchResult.MatchResultId,
                    matchResult.TenantId,
                    matchResult.FindingId,
                    matchResult.PatternId,
                    matchResult.VersionId,
                    matchResult.PatternKey,
                    matchResult.PatternVersion,
                    MatchKind = (int)matchResult.MatchKind,
                    MatchSource = (int)matchResult.MatchSource,
                    matchResult.ExplainText,
                    matchResult.IsActive,
                    matchResult.MatchedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task InsertConflictAsync(
        RemediationPatternMatchConflictRecord conflict,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(conflict);

        const string sql = """
                           INSERT INTO dbo.RemediationPatternMatchConflicts
                           (ConflictId, TenantId, FindingId, ConflictType, Description, CandidatePatternIdsJson, CreatedUtc)
                           VALUES
                           (@ConflictId, @TenantId, @FindingId, @ConflictType, @Description, @CandidatePatternIdsJson, @CreatedUtc);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    conflict.ConflictId,
                    conflict.TenantId,
                    conflict.FindingId,
                    ConflictType = (int)conflict.ConflictType,
                    conflict.Description,
                    conflict.CandidatePatternIdsJson,
                    conflict.CreatedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<RemediationPatternMatchResultRecord?> TryGetActiveMatchAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT TOP (1) MatchResultId, TenantId, FindingId, PatternId, VersionId, PatternKey, PatternVersion,
                                          MatchKind, MatchSource, ExplainText, IsActive, MatchedUtc
                           FROM dbo.RemediationPatternMatchResults
                           WHERE TenantId = @TenantId AND FindingId = @FindingId AND IsActive = 1
                           ORDER BY MatchedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        MatchResultRow? row = await conn.QuerySingleOrDefaultAsync<MatchResultRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, FindingId = findingId }, cancellationToken: cancellationToken));

        return row is null ? null : MapMatchResult(row);
    }

    public async Task<RemediationPatternMatchResultRecord?> TryGetActiveMatchInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT TOP (1) m.MatchResultId, m.TenantId, m.FindingId, m.PatternId, m.VersionId, m.PatternKey, m.PatternVersion,
                                          m.MatchKind, m.MatchSource, m.ExplainText, m.IsActive, m.MatchedUtc
                           FROM dbo.RemediationPatternMatchResults m
                           INNER JOIN dbo.OperationalSecurityFindings f
                               ON f.TenantId = m.TenantId AND f.FindingId = m.FindingId
                           WHERE m.TenantId = @TenantId
                             AND m.FindingId = @FindingId
                             AND m.IsActive = 1
                             AND f.WorkspaceId = @WorkspaceId
                             AND f.ProjectId = @ProjectId
                           ORDER BY m.MatchedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        MatchResultRow? row = await conn.QuerySingleOrDefaultAsync<MatchResultRow>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, FindingId = findingId },
                cancellationToken: cancellationToken));

        return row is null ? null : MapMatchResult(row);
    }

    public async Task<IReadOnlyList<RemediationPatternMatchResultRecord>> ListByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT MatchResultId, TenantId, FindingId, PatternId, VersionId, PatternKey, PatternVersion,
                                  MatchKind, MatchSource, ExplainText, IsActive, MatchedUtc
                           FROM dbo.RemediationPatternMatchResults
                           WHERE TenantId = @TenantId AND FindingId = @FindingId
                           ORDER BY MatchedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<MatchResultRow> rows = await conn.QueryAsync<MatchResultRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, FindingId = findingId }, cancellationToken: cancellationToken));

        return rows.Select(MapMatchResult).ToList();
    }

    public async Task<IReadOnlyList<RemediationPatternMatchResultRecord>> ListByFindingInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT m.MatchResultId, m.TenantId, m.FindingId, m.PatternId, m.VersionId, m.PatternKey, m.PatternVersion,
                                  m.MatchKind, m.MatchSource, m.ExplainText, m.IsActive, m.MatchedUtc
                           FROM dbo.RemediationPatternMatchResults m
                           INNER JOIN dbo.OperationalSecurityFindings f
                               ON f.TenantId = m.TenantId AND f.FindingId = m.FindingId
                           WHERE m.TenantId = @TenantId
                             AND m.FindingId = @FindingId
                             AND f.WorkspaceId = @WorkspaceId
                             AND f.ProjectId = @ProjectId
                           ORDER BY m.MatchedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<MatchResultRow> rows = await conn.QueryAsync<MatchResultRow>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, FindingId = findingId },
                cancellationToken: cancellationToken));

        return rows.Select(MapMatchResult).ToList();
    }

    public async Task<IReadOnlyList<RemediationPatternMatchConflictRecord>> ListConflictsByFindingAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT ConflictId, TenantId, FindingId, ConflictType, Description, CandidatePatternIdsJson, CreatedUtc
                           FROM dbo.RemediationPatternMatchConflicts
                           WHERE TenantId = @TenantId AND FindingId = @FindingId
                           ORDER BY CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ConflictRow> rows = await conn.QueryAsync<ConflictRow>(
            new CommandDefinition(sql, new { TenantId = tenantId, FindingId = findingId }, cancellationToken: cancellationToken));

        return rows.Select(MapConflict).ToList();
    }

    public async Task<IReadOnlyList<RemediationPatternMatchConflictRecord>> ListConflictsByFindingInScopeAsync(
        ProjectScopeKey scope,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT c.ConflictId, c.TenantId, c.FindingId, c.ConflictType, c.Description, c.CandidatePatternIdsJson, c.CreatedUtc
                           FROM dbo.RemediationPatternMatchConflicts c
                           INNER JOIN dbo.OperationalSecurityFindings f
                               ON f.TenantId = c.TenantId AND f.FindingId = c.FindingId
                           WHERE c.TenantId = @TenantId
                             AND c.FindingId = @FindingId
                             AND f.WorkspaceId = @WorkspaceId
                             AND f.ProjectId = @ProjectId
                           ORDER BY c.CreatedUtc DESC;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<ConflictRow> rows = await conn.QueryAsync<ConflictRow>(
            new CommandDefinition(
                sql,
                new { scope.TenantId, scope.WorkspaceId, scope.ProjectId, FindingId = findingId },
                cancellationToken: cancellationToken));

        return rows.Select(MapConflict).ToList();
    }

    private static RemediationPatternMatchResultRecord MapMatchResult(MatchResultRow row) =>
        new()
        {
            MatchResultId = row.MatchResultId,
            TenantId = row.TenantId,
            FindingId = row.FindingId,
            PatternId = row.PatternId,
            VersionId = row.VersionId,
            PatternKey = row.PatternKey,
            PatternVersion = row.PatternVersion,
            MatchKind = (RemediationPatternMatchKind)row.MatchKind,
            MatchSource = (RemediationPatternMatchSource)row.MatchSource,
            ExplainText = row.ExplainText,
            IsActive = row.IsActive,
            MatchedUtc = row.MatchedUtc,
        };

    private static RemediationPatternMatchConflictRecord MapConflict(ConflictRow row) =>
        new()
        {
            ConflictId = row.ConflictId,
            TenantId = row.TenantId,
            FindingId = row.FindingId,
            ConflictType = (RemediationPatternMatchConflictType)row.ConflictType,
            Description = row.Description,
            CandidatePatternIdsJson = row.CandidatePatternIdsJson,
            CreatedUtc = row.CreatedUtc,
        };

    private sealed class MatchResultRow
    {
        public Guid MatchResultId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid FindingId
        {
            get;
            init;
        }

        public Guid PatternId
        {
            get;
            init;
        }

        public Guid VersionId
        {
            get;
            init;
        }

        public string PatternKey
        {
            get;
            init;
        } = string.Empty;

        public string PatternVersion
        {
            get;
            init;
        } = string.Empty;

        public int MatchKind
        {
            get;
            init;
        }

        public int MatchSource
        {
            get;
            init;
        }

        public string ExplainText
        {
            get;
            init;
        } = string.Empty;

        public bool IsActive
        {
            get;
            init;
        }

        public DateTime MatchedUtc
        {
            get;
            init;
        }
    }

    private sealed class ConflictRow
    {
        public Guid ConflictId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public Guid FindingId
        {
            get;
            init;
        }

        public int ConflictType
        {
            get;
            init;
        }

        public string Description
        {
            get;
            init;
        } = string.Empty;

        public string CandidatePatternIdsJson
        {
            get;
            init;
        } = "[]";

        public DateTime CreatedUtc
        {
            get;
            init;
        }
    }
}
