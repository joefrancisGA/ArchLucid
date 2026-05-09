using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories.LlmDailyTenantTokenWindow;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Data.Repositories;

/// <summary>Durable LLM daily token counters per tenant UTC day.</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via integration or in-memory test double.")]
public sealed class SqlLlmDailyTenantTokenWindowStateRepository(IDbConnectionFactory connectionFactory)
    : ILlmDailyTenantTokenWindowStateRepository
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<LlmDailyTenantTokenWindowStateReadModel> GetOrCreateAsync(
        Guid tenantId,
        DateOnly utcDay,
        CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory
            .CreateOpenConnectionAsync(cancellationToken)
            .ConfigureAwait(false);

        LlmDailyTenantTokenWindowStateReadModel? row = await SelectAsync(connection, tenantId, utcDay, cancellationToken)
            .ConfigureAwait(false);

        if (row is not null)
            return row;

        DateTime utcDayDate = utcDay.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        const string insert = """
                              INSERT INTO dbo.LlmDailyTenantTokenWindowState (TenantId, UtcDay, TotalTokens, WarnedApproaching, LastUpdatedUtc)
                              VALUES (@TenantId, @UtcDay, 0, 0, SYSUTCDATETIME());
                              """;

        try
        {
            await connection
                .ExecuteAsync(
                    new CommandDefinition(
                        insert,
                        new { TenantId = tenantId, UtcDay = utcDayDate },
                        cancellationToken: cancellationToken))
                .ConfigureAwait(false);
        }
        catch (SqlException ex) when (ex.Number is 2601 or 2627)
        {
            // Another replica inserted the same day bucket — fall through to re-select.
        }

        row = await SelectAsync(connection, tenantId, utcDay, cancellationToken).ConfigureAwait(false);

        return row ?? throw new InvalidOperationException("Failed to read LLM daily token window row after insert.");
    }

    /// <inheritdoc />
    public async Task<LlmDailyTenantTokenWindowTokensUpdateResult> TryIncrementTokensAsync(
        Guid tenantId,
        DateOnly utcDay,
        long addTokens,
        long warnAtTokens,
        byte[] expectedRowVersion,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(expectedRowVersion);

        DateTime utcDayDate = utcDay.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        if (addTokens <= 0)
        {
            using IDbConnection zeroPathConnection =
                await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);
            LlmDailyTenantTokenWindowStateReadModel? current =
                await SelectAsync(zeroPathConnection, tenantId, utcDay, cancellationToken).ConfigureAwait(false);

            return current is null
                ? new LlmDailyTenantTokenWindowTokensUpdateResult { ConcurrencyConflict = true }
                : new LlmDailyTenantTokenWindowTokensUpdateResult
                {
                    ConcurrencyConflict = false,
                    NewState = current,
                    ShouldEmitWarnAudit = false
                };
        }

        const string sql = """
                           UPDATE dbo.LlmDailyTenantTokenWindowState
                           SET TotalTokens = TotalTokens + @AddTokens,
                               WarnedApproaching = CASE
                                   WHEN WarnedApproaching = 1 THEN 1
                                   WHEN TotalTokens < @WarnAt AND TotalTokens + @AddTokens >= @WarnAt THEN 1
                                   ELSE WarnedApproaching
                                   END,
                               LastUpdatedUtc = SYSUTCDATETIME()
                           OUTPUT INSERTED.TotalTokens AS NewTotalTokens,
                                  INSERTED.WarnedApproaching AS NewWarned,
                                  DELETED.TotalTokens AS OldTotalTokens,
                                  DELETED.WarnedApproaching AS OldWarned
                           WHERE TenantId = @TenantId
                             AND UtcDay = @UtcDay
                             AND RowVersion = @RowVersion;
                           """;

        using IDbConnection updateConnection =
            await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        TokensUpdateOutput? updated = await updateConnection
            .QuerySingleOrDefaultAsync<TokensUpdateOutput>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TenantId = tenantId,
                        UtcDay = utcDayDate,
                        AddTokens = addTokens,
                        WarnAt = warnAtTokens,
                        RowVersion = expectedRowVersion
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        if (updated is null)
            return new LlmDailyTenantTokenWindowTokensUpdateResult { ConcurrencyConflict = true };

        LlmDailyTenantTokenWindowStateReadModel newModel =
            await SelectAsync(updateConnection, tenantId, utcDay, cancellationToken).ConfigureAwait(false)
            ?? throw new InvalidOperationException("Daily token window row disappeared after update.");

        bool shouldAudit =
            !updated.OldWarned && updated.OldTotalTokens < warnAtTokens && updated.NewTotalTokens >= warnAtTokens;

        return new LlmDailyTenantTokenWindowTokensUpdateResult
        {
            ConcurrencyConflict = false,
            NewState = newModel,
            ShouldEmitWarnAudit = shouldAudit
        };
    }

    private static Task<LlmDailyTenantTokenWindowStateReadModel?> SelectAsync(
        IDbConnection connection,
        Guid tenantId,
        DateOnly utcDay,
        CancellationToken cancellationToken)
    {
        DateTime utcDayDate = utcDay.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        const string sel = """
                           SELECT TotalTokens, WarnedApproaching, RowVersion
                           FROM dbo.LlmDailyTenantTokenWindowState
                           WHERE TenantId = @TenantId AND UtcDay = @UtcDay;
                           """;

        return connection.QuerySingleOrDefaultAsync<LlmDailyTenantTokenWindowStateReadModel>(
            new CommandDefinition(sel, new { TenantId = tenantId, UtcDay = utcDayDate }, cancellationToken: cancellationToken));
    }

    private sealed class TokensUpdateOutput
    {
        public long NewTotalTokens
        {
            get;
            set;
        }

        public bool NewWarned
        {
            get;
            set;
        }

        public long OldTotalTokens
        {
            get;
            set;
        }

        public bool OldWarned
        {
            get;
            set;
        }
    }
}
