using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Marketing;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Marketing;

/// <inheritdoc />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository.")]
public sealed class SqlMarketingPricingQuoteRequestAgingReader(ISqlConnectionFactory connectionFactory)
    : IMarketingPricingQuoteRequestAgingReader
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<IReadOnlyList<MarketingPricingQuoteRequestAgingRow>> ListAsync(CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT
                               Id,
                               WorkEmail,
                               CompanyName,
                               TierInterest,
                               CreatedUtc,
                               Status,
                               FirstResponseUtc,
                               AssignedOwner,
                               AgeHours,
                               BreachStatus
                           FROM dbo.MarketingPricingQuoteRequestsAging
                           ORDER BY CreatedUtc ASC;
                           """;

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AgingRow> rows = await connection.QueryAsync<AgingRow>(
            new CommandDefinition(sql, cancellationToken: cancellationToken)).ConfigureAwait(false);

        return rows
            .Select(static row => new MarketingPricingQuoteRequestAgingRow(
                row.Id,
                row.WorkEmail,
                row.CompanyName,
                row.TierInterest,
                row.CreatedUtc,
                row.Status,
                row.FirstResponseUtc,
                row.AssignedOwner,
                row.AgeHours,
                row.BreachStatus))
            .ToList();
    }

    [SuppressMessage("ReSharper", "UnusedAutoPropertyAccessor.Local", Justification = "Dapper.")]
    private sealed class AgingRow
    {
        public Guid Id
        {
            get;
            init;
        }

        public string WorkEmail
        {
            get;
            init;
        } = string.Empty;

        public string CompanyName
        {
            get;
            init;
        } = string.Empty;

        public string TierInterest
        {
            get;
            init;
        } = string.Empty;

        public DateTime CreatedUtc
        {
            get;
            init;
        }

        public string Status
        {
            get;
            init;
        } = string.Empty;

        public DateTime? FirstResponseUtc
        {
            get;
            init;
        }

        public string? AssignedOwner
        {
            get;
            init;
        }

        public double AgeHours
        {
            get;
            init;
        }

        public string BreachStatus
        {
            get;
            init;
        } = string.Empty;
    }
}
