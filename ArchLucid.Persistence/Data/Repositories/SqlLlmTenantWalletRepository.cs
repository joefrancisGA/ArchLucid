using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration or in-memory test double.")]
public sealed partial class SqlLlmTenantWalletRepository(IDbConnectionFactory connectionFactory) : ILlmTenantWalletRepository
{
    private const int MaxOptimisticRetries = 12;

    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private static async Task<LlmTenantWalletStateReadModel?> SelectAsync(
        IDbConnection connection,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TenantId,
                                  BalanceUsd,
                                  AutoReplenishEnabled,
                                  RefillIncrementUsd,
                                  RefillTriggerThresholdUsd,
                                  MonthlyCapUsd,
                                  AutoRefillsThisUtcMonthCount,
                                  AutoRefillsThisUtcMonthYearMonth,
                                  LastRefillUtc,
                                  StripeCustomerId,
                                  StripePaymentMethodId,
                                  RowVersion
                           FROM dbo.LlmTenantWalletState
                           WHERE TenantId = @TenantId;
                           """;

        WalletRow? row = await connection
            .QuerySingleOrDefaultAsync<WalletRow>(
                new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        if (row is null)
            return null;

        return new LlmTenantWalletStateReadModel
        {
            TenantId = row.TenantId,
            BalanceUsd = row.BalanceUsd,
            AutoReplenishEnabled = row.AutoReplenishEnabled,
            RefillIncrementUsd = row.RefillIncrementUsd,
            RefillTriggerThresholdUsd = row.RefillTriggerThresholdUsd,
            MonthlyCapUsd = row.MonthlyCapUsd,
            AutoRefillsThisUtcMonthCount = row.AutoRefillsThisUtcMonthCount,
            AutoRefillsThisUtcMonthYearMonth = row.AutoRefillsThisUtcMonthYearMonth,
            LastRefillUtc = row.LastRefillUtc.HasValue
                ? new DateTimeOffset(DateTime.SpecifyKind(row.LastRefillUtc.Value, DateTimeKind.Utc))
                : null,
            StripeCustomerId = row.StripeCustomerId,
            StripePaymentMethodId = row.StripePaymentMethodId,
            RowVersion = row.RowVersion ?? [],
        };
    }

    private sealed class WalletRow
    {
        public Guid TenantId { get; init; }

        public decimal BalanceUsd { get; init; }

        public bool AutoReplenishEnabled { get; init; }

        public decimal RefillIncrementUsd { get; init; }

        public decimal RefillTriggerThresholdUsd { get; init; }

        public decimal MonthlyCapUsd { get; init; }

        public int AutoRefillsThisUtcMonthCount { get; init; }

        public int AutoRefillsThisUtcMonthYearMonth { get; init; }

        public DateTime? LastRefillUtc { get; init; }

        public string? StripeCustomerId { get; init; }

        public string? StripePaymentMethodId { get; init; }

        public byte[]? RowVersion { get; init; }
    }
}
