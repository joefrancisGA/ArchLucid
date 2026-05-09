using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories.LlmMonthlyTenantBudget;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Durable LLM monthly estimated-USD counters per tenant UTC month.</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration or in-memory test double.")]
public sealed class SqlLlmMonthlyTenantBudgetStateRepository(IDbConnectionFactory connectionFactory)
    : ILlmMonthlyTenantBudgetStateRepository
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<LlmMonthlyTenantBudgetStateReadModel> GetOrCreateAsync(
        Guid tenantId,
        int utcYear,
        int utcMonth,
        CancellationToken cancellationToken = default)
    {
        ValidateUtcYearMonth(utcYear, utcMonth);

        using IDbConnection connection = await _connectionFactory
            .CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        LlmMonthlyTenantBudgetStateReadModel? row = await SelectAsync(connection, tenantId, utcYear, utcMonth, cancellationToken)
            .ConfigureAwait(false);

        if (row is not null)
            return row;

        const string insert = """
                              INSERT INTO dbo.LlmMonthlyTenantBudgetState (TenantId, UtcYear, UtcMonth, SpentUsd, WarnedApproaching, LastUpdatedUtc)
                              VALUES (@TenantId, @UtcYear, @UtcMonth, 0, 0, SYSUTCDATETIME());
                              """;

        try
        {
            await connection
                .ExecuteAsync(new CommandDefinition(insert, new { TenantId = tenantId, UtcYear = utcYear, UtcMonth = utcMonth }, cancellationToken: cancellationToken))
                .ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number is 2601 or 2627)
        {
            // Another replica inserted the same month bucket — fall through to re-select.
        }

        row = await SelectAsync(connection, tenantId, utcYear, utcMonth, cancellationToken).ConfigureAwait(false);

        return row ?? throw new InvalidOperationException("Failed to read LLM monthly budget row after insert.");
    }

    /// <inheritdoc />
    public async Task<LlmMonthlyTenantBudgetSpendUpdateResult> TryIncrementSpendAsync(
        Guid tenantId,
        int utcYear,
        int utcMonth,
        decimal addUsd,
        decimal warnAtUsd,
        byte[] expectedRowVersion,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(expectedRowVersion);

        ValidateUtcYearMonth(utcYear, utcMonth);

        if (addUsd <= 0m)
        {
            using IDbConnection zeroPathConnection =
                await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
            LlmMonthlyTenantBudgetStateReadModel? current = await SelectAsync(zeroPathConnection, tenantId, utcYear, utcMonth, cancellationToken)
                .ConfigureAwait(false);

            return current is null
                ? new LlmMonthlyTenantBudgetSpendUpdateResult { ConcurrencyConflict = true }
                : new LlmMonthlyTenantBudgetSpendUpdateResult
                {
                    ConcurrencyConflict = false,
                    NewState = current,
                    ShouldEmitWarnAudit = false
                };
        }

        const string sql = """
                           UPDATE dbo.LlmMonthlyTenantBudgetState
                           SET SpentUsd = SpentUsd + @AddUsd,
                               WarnedApproaching = CASE
                                   WHEN WarnedApproaching = 1 THEN 1
                                   WHEN SpentUsd < @WarnAt AND SpentUsd + @AddUsd >= @WarnAt THEN 1
                                   ELSE WarnedApproaching
                                   END,
                               LastUpdatedUtc = SYSUTCDATETIME()
                           OUTPUT INSERTED.SpentUsd AS NewSpentUsd,
                                  INSERTED.WarnedApproaching AS NewWarned,
                                  DELETED.SpentUsd AS OldSpentUsd,
                                  DELETED.WarnedApproaching AS OldWarned
                           WHERE TenantId = @TenantId
                             AND UtcYear = @UtcYear
                             AND UtcMonth = @UtcMonth
                             AND RowVersion = @RowVersion;
                           """;

        using IDbConnection updateConnection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        SpendUpdateOutput? updated = await updateConnection
            .QuerySingleOrDefaultAsync<SpendUpdateOutput>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TenantId = tenantId,
                        UtcYear = utcYear,
                        UtcMonth = utcMonth,
                        AddUsd = addUsd,
                        WarnAt = warnAtUsd,
                        RowVersion = expectedRowVersion
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        if (updated is null)
            return new LlmMonthlyTenantBudgetSpendUpdateResult { ConcurrencyConflict = true };

        LlmMonthlyTenantBudgetStateReadModel newModel = await SelectAsync(updateConnection, tenantId, utcYear, utcMonth, cancellationToken)
            .ConfigureAwait(false)
            ?? throw new InvalidOperationException("Monthly budget row disappeared after update.");

        bool shouldAudit = !updated.OldWarned && updated.OldSpentUsd < warnAtUsd && updated.NewSpentUsd >= warnAtUsd;

        return new LlmMonthlyTenantBudgetSpendUpdateResult
        {
            ConcurrencyConflict = false,
            NewState = newModel,
            ShouldEmitWarnAudit = shouldAudit
        };
    }

    private static void ValidateUtcYearMonth(int utcYear, int utcMonth)
    {
        if (utcYear is < 2000 or > 2100)
            throw new ArgumentOutOfRangeException(nameof(utcYear));

        if (utcMonth is < 1 or > 12)
            throw new ArgumentOutOfRangeException(nameof(utcMonth));
    }

    private static Task<LlmMonthlyTenantBudgetStateReadModel?> SelectAsync(
        IDbConnection connection,
        Guid tenantId,
        int utcYear,
        int utcMonth,
        CancellationToken cancellationToken)
    {
        const string sel = """
                           SELECT SpentUsd, WarnedApproaching, RowVersion
                           FROM dbo.LlmMonthlyTenantBudgetState
                           WHERE TenantId = @TenantId AND UtcYear = @UtcYear AND UtcMonth = @UtcMonth;
                           """;

        return connection.QuerySingleOrDefaultAsync<LlmMonthlyTenantBudgetStateReadModel>(
            new CommandDefinition(sel, new { TenantId = tenantId, UtcYear = utcYear, UtcMonth = utcMonth }, cancellationToken: cancellationToken));
    }

    private sealed class SpendUpdateOutput
    {
        public decimal NewSpentUsd { get; set; }

        public bool NewWarned { get; set; }

        public decimal OldSpentUsd { get; set; }

        public bool OldWarned { get; set; }
    }
}
