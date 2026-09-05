using ArchLucid.Core.InfraEvidence;
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
