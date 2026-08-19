using ArchLucid.Contracts.Analytics;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Analytics;

/// <summary>SQL read path for k-anonymous pattern insight aggregates (TB-880).</summary>
public sealed class DapperPatternInsightAggregateRepository(ISqlConnectionFactory connectionFactory)
    : IPatternInsightAggregateRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<IReadOnlyList<PatternInsightCard>> ListPublishedAsync(
        string? industryVertical,
        int minimumContributingTenants,
        CancellationToken cancellationToken)
    {
        string sql = """
                     SELECT PatternKey,
                            IndustryVertical,
                            Summary,
                            ContributingTenantCount
                     FROM dbo.PatternInsightAggregate
                     WHERE ContributingTenantCount >= @MinimumContributingTenants
                     """;

        if (!string.IsNullOrWhiteSpace(industryVertical))
        {
            sql += """

                   AND (
                       IndustryVertical = @IndustryVertical
                       OR IndustryVertical = N'General'
                   )
                   """;
        }

        sql += " ORDER BY ContributingTenantCount DESC, PatternKey ASC;";

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<PatternInsightCard> rows = await connection.QueryAsync<PatternInsightCard>(
            new CommandDefinition(
                sql,
                new
                {
                    MinimumContributingTenants = minimumContributingTenants,
                    IndustryVertical = industryVertical?.Trim(),
                },
                cancellationToken: cancellationToken));

        return rows.ToList();
    }
}
