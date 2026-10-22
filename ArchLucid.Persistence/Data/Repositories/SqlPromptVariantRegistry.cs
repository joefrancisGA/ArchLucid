using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Persistence.Agents.PromptVariants;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Dapper loader for <c>dbo.PromptVariants</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class SqlPromptVariantRegistry(IDbConnectionFactory connectionFactory) : IPromptVariantRegistry
{
    public async Task<IReadOnlyList<PromptVariantRecord>> GetActiveVariantsAsync(
        string promptTemplateName,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(promptTemplateName);

        const string sql = """
                           SELECT
                               PromptTemplateName,
                               VariantKey,
                               WeightBps,
                               PromptBody
                           FROM dbo.PromptVariants
                           WHERE PromptTemplateName = @PromptTemplateName
                             AND IsActive = 1
                             AND RetiredUtc IS NULL
                           ORDER BY VariantKey;
                           """;

        using IDbConnection connection =
            await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<PromptVariantRow> rows = await connection.QueryAsync<PromptVariantRow>(
            new CommandDefinition(sql, new { PromptTemplateName = promptTemplateName }, cancellationToken: cancellationToken));

        return rows
            .Select(r => new PromptVariantRecord
            {
                PromptTemplateName = r.PromptTemplateName,
                VariantKey = r.VariantKey,
                WeightBps = r.WeightBps,
                PromptBody = r.PromptBody
            })
            .ToList();
    }

    private sealed class PromptVariantRow
    {
        public string PromptTemplateName
        {
            get;
            init;
        } = string.Empty;

        public string VariantKey
        {
            get;
            init;
        } = string.Empty;

        public int WeightBps
        {
            get;
            init;
        }

        public string? PromptBody
        {
            get;
            init;
        }
    }
}
