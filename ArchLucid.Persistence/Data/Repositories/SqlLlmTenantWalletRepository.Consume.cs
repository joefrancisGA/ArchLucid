using System.Data;

using ArchLucid.Core.Budgeting;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

public sealed partial class SqlLlmTenantWalletRepository
{
    public async Task<LlmTenantWalletStateReadModel> GetOrCreateAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory
            .CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        LlmTenantWalletStateReadModel? row = await SelectAsync(connection, tenantId, cancellationToken).ConfigureAwait(false);

        if (row is not null)
            return row;

        const string insert = """
                              INSERT INTO dbo.LlmTenantWalletState (TenantId)
                              VALUES (@TenantId);
                              """;

        try
        {
            await connection
                .ExecuteAsync(new CommandDefinition(insert, new { TenantId = tenantId }, cancellationToken: cancellationToken))
                .ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number is 2627 or 2601)
        {
            // concurrent create
        }

        return await SelectAsync(connection, tenantId, cancellationToken).ConfigureAwait(false)
               ?? throw new InvalidOperationException("Wallet row missing after insert.");
    }

    public async Task<LlmTenantWalletStateReadModel?> UpdateSettingsAsync(
        LlmTenantWalletUpdateSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            LlmTenantWalletStateReadModel current = await GetOrCreateAsync(request.TenantId, cancellationToken).ConfigureAwait(false);

            if (request.ExpectedRowVersion.Length > 0 && !current.RowVersion.SequenceEqual(request.ExpectedRowVersion))
                return null;

            using IDbConnection connection = await _connectionFactory
                .CreateOpenConnectionAsync(cancellationToken)
                .ConfigureAwait(false);

            const string sql = """
                               UPDATE dbo.LlmTenantWalletState
                               SET AutoReplenishEnabled = COALESCE(@AutoReplenishEnabled, AutoReplenishEnabled),
                                   MonthlyCapUsd = COALESCE(@MonthlyCapUsd, MonthlyCapUsd),
                                   StripeCustomerId = COALESCE(@StripeCustomerId, StripeCustomerId),
                                   StripePaymentMethodId = COALESCE(@StripePaymentMethodId, StripePaymentMethodId)
                               WHERE TenantId = @TenantId
                                 AND RowVersion = @ExpectedRowVersion;
                               """;

            int rows = await connection.ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        request.TenantId,
                        request.AutoReplenishEnabled,
                        request.MonthlyCapUsd,
                        request.StripeCustomerId,
                        request.StripePaymentMethodId,
                        ExpectedRowVersion = request.ExpectedRowVersion.Length > 0 ? request.ExpectedRowVersion : current.RowVersion,
                    },
                    cancellationToken: cancellationToken)).ConfigureAwait(false);

            if (rows == 1)
                return await SelectAsync(connection, request.TenantId, cancellationToken).ConfigureAwait(false);

            await Task.Delay(5 * (attempt + 1), cancellationToken).ConfigureAwait(false);
        }

        return null;
    }

    public async Task<LlmTenantWalletConsumeResult> TryConsumeAsync(
        Guid tenantId,
        decimal amountUsd,
        Guid correlationId,
        byte[] expectedRowVersion,
        CancellationToken cancellationToken = default)
    {
        if (amountUsd <= 0m)
            return LlmTenantWalletConsumeResult.Ok(0m);

        for (int attempt = 0; attempt < MaxOptimisticRetries; attempt++)
        {
            LlmTenantWalletStateReadModel state = await GetOrCreateAsync(tenantId, cancellationToken).ConfigureAwait(false);
            byte[] rowVersion = expectedRowVersion.Length > 0 ? expectedRowVersion : state.RowVersion;

            if (state.BalanceUsd < amountUsd)
                return LlmTenantWalletConsumeResult.NotEnough();

            decimal balanceAfter = decimal.Round(state.BalanceUsd - amountUsd, 2, MidpointRounding.AwayFromZero);

            using IDbConnection connection = await _connectionFactory
                .CreateOpenConnectionAsync(cancellationToken)
                .ConfigureAwait(false);

            using IDbTransaction transaction = connection.BeginTransaction(IsolationLevel.Serializable);

            const string update = """
                                  UPDATE dbo.LlmTenantWalletState
                                  SET BalanceUsd = @BalanceAfterUsd
                                  WHERE TenantId = @TenantId
                                    AND RowVersion = @ExpectedRowVersion
                                    AND BalanceUsd >= @AmountUsd;
                                  """;

            int rows = await connection.ExecuteAsync(
                new CommandDefinition(
                    update,
                    new
                    {
                        TenantId = tenantId,
                        BalanceAfterUsd = balanceAfter,
                        AmountUsd = amountUsd,
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
                        EntryType = LlmTenantWalletLedgerEntryTypes.Consume,
                        AmountUsd = -amountUsd,
                        BalanceAfterUsd = balanceAfter,
                        CorrelationId = correlationId,
                    },
                    transaction: transaction,
                    cancellationToken: cancellationToken)).ConfigureAwait(false);

            transaction.Commit();

            return LlmTenantWalletConsumeResult.Ok(balanceAfter);
        }

        return LlmTenantWalletConsumeResult.Conflict();
    }
}
