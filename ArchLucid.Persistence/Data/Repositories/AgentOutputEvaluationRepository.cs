using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class AgentOutputEvaluationRepository(IDbConnectionFactory connectionFactory)
    : IAgentOutputEvaluationRepository
{
    public async Task AppendAsync(AgentOutputEvaluationInsert row, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(row);

        const string sql = """
                           INSERT INTO dbo.AgentOutputEvaluations
                           (
                               ResultId,
                               RunId,
                               PromptTemplateName,
                               PromptVariantKey,
                               AgentType,
                               SemanticScore,
                               QualityGatePassed,
                               CreatedUtc
                           )
                           VALUES
                           (
                               @ResultId,
                               @RunId,
                               @PromptTemplateName,
                               @PromptVariantKey,
                               @AgentType,
                               @SemanticScore,
                               @QualityGatePassed,
                               @CreatedUtc
                           );
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    row.ResultId,
                    row.RunId,
                    row.PromptTemplateName,
                    row.PromptVariantKey,
                    AgentType = row.AgentType.ToString(),
                    row.SemanticScore,
                    row.QualityGatePassed,
                    row.CreatedUtc
                },
                cancellationToken: cancellationToken));
    }
}
