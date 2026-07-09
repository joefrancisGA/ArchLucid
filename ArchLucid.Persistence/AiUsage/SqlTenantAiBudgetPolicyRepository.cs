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
}
