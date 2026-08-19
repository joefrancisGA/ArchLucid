using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class AgentConfidenceCalibrationSampleRepository(IDbConnectionFactory connectionFactory)
    : IAgentConfidenceCalibrationSampleRepository
{
    public async Task AppendAsync(
        AgentType agentType,
        double rawConfidence,
        double semanticScore,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           INSERT INTO AgentOutputCalibrationSamples
                           (
                               AgentType,
                               RawConfidence,
                               SemanticScore,
                               CreatedUtc
                           )
                           VALUES
                           (
                               @AgentType,
                               @RawConfidence,
                               @SemanticScore,
                               @CreatedUtc
                           );
                           """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, null, cancellationToken);

        try
        {
            await conn.ExecuteAsync(new CommandDefinition(
                sql,
                new
                {
                    AgentType = agentType.ToString(),
                    RawConfidence = rawConfidence,
                    SemanticScore = semanticScore,
                    CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime
                },
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }
    }

    public async Task<IReadOnlyList<AgentConfidenceCalibrationSampleRow>> GetRecentByAgentTypeAsync(
        AgentType agentType,
        int maxCount,
        CancellationToken cancellationToken = default)
    {
        if (maxCount <= 0)
            return [];

        string sql = $"""
                      SELECT RawConfidence, SemanticScore
                      FROM AgentOutputCalibrationSamples
                      WHERE AgentType = @AgentType
                      ORDER BY CreatedUtc DESC
                      {SqlPagingSyntax.FirstRowsOnly(maxCount)};
                      """;

        (IDbConnection conn, bool ownsConnection) =
            await ExternalDbConnection.ResolveAsync(connectionFactory, null, cancellationToken);

        IEnumerable<AgentConfidenceCalibrationSampleRow> rows;
        try
        {
            rows = await conn.QueryAsync<AgentConfidenceCalibrationSampleRow>(new CommandDefinition(
                sql,
                new { AgentType = agentType.ToString() },
                cancellationToken: cancellationToken));
        }
        finally
        {
            ExternalDbConnection.DisposeIfOwned(conn, ownsConnection);
        }

        return rows.ToList();
    }
}
