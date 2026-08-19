using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.AiUsage;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.AiUsage;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository.")]
public sealed class SqlTenantAiBudgetPolicyRepository(IDbConnectionFactory connectionFactory) : ITenantAiBudgetPolicyRepository
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<TenantAiBudgetPolicyRow?> GetByTenantIdAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        const string sql = """
            SELECT TenantId, BudgetAmountUsd, HardStopEnabled, AllowCustomerAiProvider, TrialExpirationUtc
            FROM dbo.TenantAiBudgetPolicy
            WHERE TenantId = @TenantId
            """;

        return await connection
            .QuerySingleOrDefaultAsync<TenantAiBudgetPolicyRow>(
                new CommandDefinition(sql, new { TenantId = tenantId }, cancellationToken: cancellationToken))
            .ConfigureAwait(false);
    }

    public async Task<bool> EnsureDefaultTrialPolicyIfAbsentAsync(
        Guid tenantId,
        decimal budgetAmountUsd,
        DateTimeOffset trialExpirationUtc,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
        {
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));
        }

        if (budgetAmountUsd <= 0m)
        {
            throw new ArgumentOutOfRangeException(nameof(budgetAmountUsd), budgetAmountUsd, "Budget amount must be positive.");
        }

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken).ConfigureAwait(false);

        const string sql = """
            IF NOT EXISTS (SELECT 1 FROM dbo.TenantAiBudgetPolicy WITH (UPDLOCK, HOLDLOCK) WHERE TenantId = @TenantId)
            BEGIN
                INSERT INTO dbo.TenantAiBudgetPolicy
                    (TenantId, BudgetAmountUsd, HardStopEnabled, AllowCustomerAiProvider, TrialExpirationUtc, LastUpdatedUtc)
                VALUES
                    (@TenantId, @BudgetAmountUsd, 1, 0, @TrialExpirationUtc, SYSUTCDATETIME());
            END
            """;

        int rows = await connection
            .ExecuteAsync(
                new CommandDefinition(
                    sql,
                    new
                    {
                        TenantId = tenantId,
                        BudgetAmountUsd = budgetAmountUsd,
                        TrialExpirationUtc = trialExpirationUtc.UtcDateTime,
                    },
                    cancellationToken: cancellationToken))
            .ConfigureAwait(false);

        return rows > 0;
    }
}
