using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class SqlPromptVariantStatsRepository(IDbConnectionFactory connectionFactory) : IPromptVariantStatsRepository
{
    public async Task<IReadOnlyList<PromptVariantStatsRow>> GetStatsByTemplateAsync(
        string promptTemplateName,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(promptTemplateName);

        const string sql = """
                           SELECT
                               PromptVariantKey AS VariantKey,
                               COUNT(*) AS SampleCount,
                               AVG(SemanticScore) AS MeanSemanticScore,
                               PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY SemanticScore) AS MedianSemanticScore,
                               AVG(CAST(QualityGatePassed AS FLOAT)) AS QualityGatePassRate
                           FROM dbo.AgentOutputEvaluations
                           WHERE PromptTemplateName = @PromptTemplateName
                           GROUP BY PromptVariantKey
                           ORDER BY PromptVariantKey;
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        List<AggregateRow> aggregates = (await connection.QueryAsync<AggregateRow>(
            new CommandDefinition(sql, new { PromptTemplateName = promptTemplateName }, cancellationToken: cancellationToken)))
            .ToList();

        return aggregates
            .Select(a => new PromptVariantStatsRow
            {
                VariantKey = a.VariantKey,
                SampleCount = a.SampleCount,
                MeanSemanticScore = a.MeanSemanticScore,
                MedianSemanticScore = a.MedianSemanticScore,
                QualityGatePassRate = a.QualityGatePassRate
            })
            .ToList();
    }

    private sealed class AggregateRow
    {
        public string VariantKey
        {
            get;
            init;
        } = string.Empty;

        public int SampleCount
        {
            get;
            init;
        }

        public double MeanSemanticScore
        {
            get;
            init;
        }

        public double MedianSemanticScore
        {
            get;
            init;
        }

        public double QualityGatePassRate
        {
            get;
            init;
        }
    }
}
