using System.Data;

using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class SqlLlmTenantWalletRepository
{
    public async Task<LlmTenantWalletCreditResult> TryCreditRefillAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        string? stripePaymentIntentId,
        int utcYearMonth,
        byte[] expectedRowVersion,
        CancellationToken cancellationToken = default)
    {
        if (amountUsd <= 0m)
            return LlmTenantWalletCreditResult.Ok(0m);

        if (!string.IsNullOrWhiteSpace(stripePaymentIntentId)
            && await LedgerContainsPaymentIntentAsync(stripePaymentIntentId, cancellationToken).ConfigureAwait(false))
        {
            return LlmTenantWalletCreditResult.Duplicate();
        }

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            LlmTenantWalletStateReadModel state = await GetOrCreateAsync(tenantId, cancellationToken).ConfigureAwait(false);
            byte[] rowVersion = expectedRowVersion.Length > 0 ? expectedRowVersion : state.RowVersion;

            int monthCount = state.AutoRefillsThisUtcMonthYearMonth == utcYearMonth
                ? state.AutoRefillsThisUtcMonthCount + 1
                : 1;

            decimal balanceAfter = decimal.Round(state.BalanceUsd + amountUsd, 2, MidpointRounding.AwayFromZero);

            using IDbConnection connection = await _connectionFactory
                .CreateOpenConnectionAsync(cancellationToken)
                .ConfigureAwait(false);

            using IDbTransaction transaction = connection.BeginTransaction(IsolationLevel.Serializable);

            const string update = """
                                  UPDATE dbo.LlmTenantWalletState
                                  SET BalanceUsd = @BalanceAfterUsd,
                                      AutoRefillsThisUtcMonthCount = @MonthCount,
                                      AutoRefillsThisUtcMonthYearMonth = @UtcYearMonth,
                                      LastRefillUtc = SYSUTCDATETIME()
                                  WHERE TenantId = @TenantId
                                    AND RowVersion = @ExpectedRowVersion;
                                  """;

            int rows = await connection.ExecuteAsync(
                new CommandDefinition(
                    update,
                    new
                    {
                        TenantId = tenantId,
                        BalanceAfterUsd = balanceAfter,
                        MonthCount = monthCount,
                        UtcYearMonth = utcYearMonth,
                        ExpectedRowVersion = rowVersion,
                    },
                    transaction: transaction,
                    cancellationToken: cancellationToken)).ConfigureAwait(false);

            if (rows == 0)
            {
                transaction.Rollback();
                await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                continue;
            }

            const string ledger = """
                                  INSERT INTO dbo.LlmTenantWalletLedger
                                      (TenantId, EntryType, AmountUsd, BalanceAfterUsd, StripePaymentIntentId, CorrelationId)
                                  VALUES
                                      (@TenantId, @EntryType, @AmountUsd, @BalanceAfterUsd, @StripePaymentIntentId, @CorrelationId);
                                  """;

            await connection.ExecuteAsync(
                new CommandDefinition(
                    ledger,
                    new
                    {
                        TenantId = tenantId,
                        EntryType = LlmTenantWalletLedgerEntryTypes.Refill,
                        AmountUsd = amountUsd,
                        BalanceAfterUsd = balanceAfter,
                        StripePaymentIntentId = stripePaymentIntentId,
                        CorrelationId = correlationId,
                    },
                    transaction: transaction,
                    cancellationToken: cancellationToken)).ConfigureAwait(false);

            transaction.Commit();

            return LlmTenantWalletCreditResult.Ok(balanceAfter);
        }

        return LlmTenantWalletCreditResult.Conflict();
    }

    public async Task<LlmTenantWalletCreditResult> TryCreditAdjustmentAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        byte[] expectedRowVersion,
        CancellationToken cancellationToken = default)
    {
        if (amountUsd <= 0m)
            return LlmTenantWalletCreditResult.Ok(0m);

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            LlmTenantWalletStateReadModel state = await GetOrCreateAsync(tenantId, cancellationToken).ConfigureAwait(false);
            byte[] rowVersion = expectedRowVersion.Length > 0 ? expectedRowVersion : state.RowVersion;

            decimal balanceAfter = decimal.Round(state.BalanceUsd + amountUsd, 2, MidpointRounding.AwayFromZero);

            using IDbConnection connection = await _connectionFactory
                .CreateOpenConnectionAsync(cancellationToken)
                .ConfigureAwait(false);

            using IDbTransaction transaction = connection.BeginTransaction(IsolationLevel.Serializable);

            const string update = """
                                  UPDATE dbo.LlmTenantWalletState
                                  SET BalanceUsd = @BalanceAfterUsd
                                  WHERE TenantId = @TenantId
                                    AND RowVersion = @ExpectedRowVersion;
                                  """;

            int rows = await connection.ExecuteAsync(
                new CommandDefinition(
                    update,
                    new
                    {
                        TenantId = tenantId,
                        BalanceAfterUsd = balanceAfter,
                        ExpectedRowVersion = rowVersion,
                    },
                    transaction: transaction,
                    cancellationToken: cancellationToken)).ConfigureAwait(false);

            if (rows == 0)
            {
                transaction.Rollback();
                await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);

                continue;
            }

            const string ledger = """
                                  INSERT INTO dbo.LlmTenantWalletLedger
                                      (TenantId, EntryType, AmountUsd, BalanceAfterUsd, StripePaymentIntentId, CorrelationId)
                                  VALUES
                                      (@TenantId, @EntryType, @AmountUsd, @BalanceAfterUsd, NULL, @CorrelationId);
                                  """;

            await connection.ExecuteAsync(
                new CommandDefinition(
                    ledger,
                    new
                    {
                        TenantId = tenantId,
                        EntryType = LlmTenantWalletLedgerEntryTypes.OperatorAdjustment,
                        AmountUsd = amountUsd,
                        BalanceAfterUsd = balanceAfter,
                        CorrelationId = correlationId,
                    },
                    transaction: transaction,
                    cancellationToken: cancellationToken)).ConfigureAwait(false);

            transaction.Commit();

            return LlmTenantWalletCreditResult.Ok(balanceAfter);
        }

        return LlmTenantWalletCreditResult.Conflict();
    }

    public async Task<bool> TryInsertStripeWebhookIdempotencyAsync(
        string stripeEventId,
        string eventType,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory
            .CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        const string sql = """
                           INSERT INTO dbo.StripeWebhookIdempotency (StripeEventId, EventType)
                           VALUES (@StripeEventId, @EventType);
                           """;

        try
        {
            await connection.ExecuteAsync(
                new CommandDefinition(sql, new { StripeEventId = stripeEventId, EventType = eventType }, cancellationToken: cancellationToken))
                .ConfigureAwait(false);

            return true;
        }
        catch (SqlException ex) when (ex.Number is 2627 or 2601)
        {
            return false;
        }
    }

    public async Task<bool> LedgerContainsPaymentIntentAsync(
        string stripePaymentIntentId,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory
            .CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        const string sql = """
                           SELECT CAST(1 AS bit)
                           FROM dbo.LlmTenantWalletLedger
                           WHERE StripePaymentIntentId = @StripePaymentIntentId;
                           """;

        bool? found = await connection.ExecuteScalarAsync<bool?>(
            new CommandDefinition(sql, new { StripePaymentIntentId = stripePaymentIntentId }, cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return found == true;
    }
}
