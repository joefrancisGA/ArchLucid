using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     Placeholder for <see cref="ITenantSqlConnectionFactory" /> when storage is InMemory (composition parity with Sql).
/// </summary>
public sealed class UnusedTenantSqlConnectionFactory : ITenantSqlConnectionFactory
{
    public Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException(
            "Tenant SQL connections are not available when ArchLucid storage is InMemory.");
}
