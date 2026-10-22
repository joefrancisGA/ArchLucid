using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.QuickScan;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Architecture;

/// <inheritdoc cref="IQuickScanUsageRecordStore" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent store; covered via in-memory counterpart in unit tests.")]
public sealed class DapperQuickScanUsageRecordStore(IDbConnectionFactory connectionFactory) : IQuickScanUsageRecordStore
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task InsertAsync(QuickScanUsageRecord record, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(record);

        const string sql = """
                           INSERT INTO dbo.QuickScanUsageRecords
                           (
                               UsageId,
                               ReservationId,
                               Status,
                               RouteKind,
                               ClientIpHash,
                               SessionIdHash,
                               ReservedUsd,
                               ActualCostUsd,
                               InputTokens,
                               OutputTokens,
                               ModelLabel,
                               RejectionReason,
                               DurationMs,
                               OccurredUtc
                           )
                           VALUES
                           (
                               @UsageId,
                               @ReservationId,
                               @Status,
                               @RouteKind,
                               @ClientIpHash,
                               @SessionIdHash,
                               @ReservedUsd,
                               @ActualCostUsd,
                               @InputTokens,
                               @OutputTokens,
                               @ModelLabel,
                               @RejectionReason,
                               @DurationMs,
                               @OccurredUtc
                           );
                           """;

        using System.Data.IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        await connection.ExecuteAsync(
            new CommandDefinition(sql, record, cancellationToken: cancellationToken)).ConfigureAwait(false);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<QuickScanUsageRecord>> ListRecentAsync(
        int limit,
        CancellationToken cancellationToken = default)
    {
        int take = Math.Clamp(limit, 1, 100);

        const string sql = """
                           SELECT TOP (@Take)
                               UsageId,
                               ReservationId,
                               Status,
                               RouteKind,
                               ClientIpHash,
                               SessionIdHash,
                               ReservedUsd,
                               ActualCostUsd,
                               InputTokens,
                               OutputTokens,
                               ModelLabel,
                               RejectionReason,
                               DurationMs,
                               OccurredUtc
                           FROM dbo.QuickScanUsageRecords
                           ORDER BY OccurredUtc DESC;
                           """;

        using System.Data.IDbConnection connection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        IEnumerable<QuickScanUsageRecord> rows = await connection.QueryAsync<QuickScanUsageRecord>(
            new CommandDefinition(sql, new { Take = take }, cancellationToken: cancellationToken)).ConfigureAwait(false);

        return rows.ToList();
    }
}
