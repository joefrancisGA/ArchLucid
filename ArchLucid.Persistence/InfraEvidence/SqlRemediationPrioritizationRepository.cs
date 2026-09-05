using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.InfraEvidence;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class SqlRemediationPrioritizationRepository(ISqlConnectionFactory connectionFactory)
    : IRemediationPrioritizationRepository
{
    public async Task<RemediationPrioritizationWeightsRecord?> TryGetWeightsAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT TenantId, WeightsJson, UpdatedByActorKey, UpdatedUtc
                           FROM dbo.RemediationPrioritizationWeights
                           WHERE TenantId = @TenantId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        WeightsRow? row = await conn.QuerySingleOrDefaultAsync<WeightsRow>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return row is null
            ? null
            : new RemediationPrioritizationWeightsRecord
            {
                TenantId = row.TenantId,
                WeightsJson = row.WeightsJson,
                UpdatedByActorKey = row.UpdatedByActorKey,
                UpdatedUtc = row.UpdatedUtc,
            };
    }

    public async Task UpsertWeightsAsync(
        RemediationPrioritizationWeightsRecord weights,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           MERGE dbo.RemediationPrioritizationWeights AS target
                           USING (SELECT @TenantId AS TenantId) AS source
                           ON target.TenantId = source.TenantId
                           WHEN MATCHED THEN
                               UPDATE SET WeightsJson = @WeightsJson,
                                          UpdatedByActorKey = @UpdatedByActorKey,
                                          UpdatedUtc = @UpdatedUtc
                           WHEN NOT MATCHED THEN
                               INSERT (TenantId, WeightsJson, UpdatedByActorKey, UpdatedUtc)
                               VALUES (@TenantId, @WeightsJson, @UpdatedByActorKey, @UpdatedUtc);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    weights.TenantId,
                    weights.WeightsJson,
                    weights.UpdatedByActorKey,
                    weights.UpdatedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task UpsertScoreAsync(
        RemediationPrioritizationScoreRecord score,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           MERGE dbo.RemediationPrioritizationScores AS target
                           USING (SELECT @TenantId AS TenantId, @FindingId AS FindingId) AS source
                           ON target.TenantId = source.TenantId AND target.FindingId = source.FindingId
                           WHEN MATCHED THEN
                               UPDATE SET TotalScore = @TotalScore,
                                          BreakdownJson = @BreakdownJson,
                                          ExplanationSummary = @ExplanationSummary,
                                          RuleVersion = @RuleVersion,
                                          ComputedUtc = @ComputedUtc
                           WHEN NOT MATCHED THEN
                               INSERT (FindingId, TenantId, TotalScore, BreakdownJson, ExplanationSummary, RuleVersion, ComputedUtc)
                               VALUES (@FindingId, @TenantId, @TotalScore, @BreakdownJson, @ExplanationSummary, @RuleVersion, @ComputedUtc);
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await conn.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    score.FindingId,
                    score.TenantId,
                    score.TotalScore,
                    score.BreakdownJson,
                    score.ExplanationSummary,
                    score.RuleVersion,
                    score.ComputedUtc,
                },
                cancellationToken: cancellationToken));
    }

    public async Task<RemediationPrioritizationScoreRecord?> TryGetScoreAsync(
        Guid tenantId,
        Guid findingId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT FindingId, TenantId, TotalScore, BreakdownJson, ExplanationSummary, RuleVersion, ComputedUtc
                           FROM dbo.RemediationPrioritizationScores
                           WHERE TenantId = @TenantId AND FindingId = @FindingId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ScoreRow? row = await conn.QuerySingleOrDefaultAsync<ScoreRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, FindingId = findingId },
                cancellationToken: cancellationToken));

        return row is null ? null : MapScore(row);
    }

    public async Task<IReadOnlyList<RemediationPrioritizationScoreRecord>> ListScoresByTenantAsync(
        Guid tenantId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT FindingId, TenantId, TotalScore, BreakdownJson, ExplanationSummary, RuleVersion, ComputedUtc
                           FROM dbo.RemediationPrioritizationScores
                           WHERE TenantId = @TenantId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<ScoreRow> rows = await conn.QueryAsync<ScoreRow>(
            new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken));

        return rows.Select(MapScore).ToList();
    }

    private static RemediationPrioritizationScoreRecord MapScore(ScoreRow row) =>
        new()
        {
            FindingId = row.FindingId,
            TenantId = row.TenantId,
            TotalScore = row.TotalScore,
            BreakdownJson = row.BreakdownJson,
            ExplanationSummary = row.ExplanationSummary,
            RuleVersion = row.RuleVersion,
            ComputedUtc = row.ComputedUtc,
        };

    private sealed class WeightsRow
    {
        public Guid TenantId
        {
            get;
            init;
        }

        public string WeightsJson
        {
            get;
            init;
        } = string.Empty;

        public string UpdatedByActorKey
        {
            get;
            init;
        } = string.Empty;

        public DateTime UpdatedUtc
        {
            get;
            init;
        }
    }

    private sealed class ScoreRow
    {
        public Guid FindingId
        {
            get;
            init;
        }

        public Guid TenantId
        {
            get;
            init;
        }

        public decimal TotalScore
        {
            get;
            init;
        }

        public string BreakdownJson
        {
            get;
            init;
        } = string.Empty;

        public string ExplanationSummary
        {
            get;
            init;
        } = string.Empty;

        public string RuleVersion
        {
            get;
            init;
        } = string.Empty;

        public DateTime ComputedUtc
        {
            get;
            init;
        }
    }
}
