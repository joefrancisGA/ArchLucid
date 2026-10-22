using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Marketing;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Marketing;

/// <inheritdoc />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository.")]
public sealed class SqlMarketingPricingQuoteRequestFollowUpRepository(ISqlConnectionFactory connectionFactory)
    : IMarketingPricingQuoteRequestFollowUpRepository
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<bool> AcknowledgeAsync(Guid requestId, string? assignedOwner, CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.MarketingPricingQuoteRequests
                           SET
                               FirstResponseUtc = COALESCE(FirstResponseUtc, SYSUTCDATETIME()),
                               AssignedOwner = COALESCE(@AssignedOwner, AssignedOwner)
                           WHERE Id = @Id
                             AND Status = @OpenStatus;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int rows = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    Id = requestId,
                    AssignedOwner = assignedOwner,
                    OpenStatus = MarketingPricingQuoteRequestStatus.Open,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        return rows > 0;
    }

    /// <inheritdoc />
    public async Task<bool> CloseAsync(Guid requestId, CancellationToken cancellationToken)
    {
        const string sql = """
                           UPDATE dbo.MarketingPricingQuoteRequests
                           SET
                               Status = @ClosedStatus,
                               ClosedUtc = SYSUTCDATETIME(),
                               FirstResponseUtc = COALESCE(FirstResponseUtc, SYSUTCDATETIME())
                           WHERE Id = @Id
                             AND Status = @OpenStatus;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        int rows = await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    Id = requestId,
                    OpenStatus = MarketingPricingQuoteRequestStatus.Open,
                    ClosedStatus = MarketingPricingQuoteRequestStatus.Closed,
                },
                cancellationToken: cancellationToken)).ConfigureAwait(false);

        return rows > 0;
    }
}
