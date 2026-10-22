using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     Placeholder for <see cref="ISystemSqlConnectionFactory" /> when storage is InMemory so health checks and DI graphs
///     can construct; the host system-plane readiness check skips before opening a connection in that mode.
/// </summary>
public sealed class UnusedSystemSqlConnectionFactory : ISystemSqlConnectionFactory
{
    /// <inheritdoc />
    public string SystemConnectionString => string.Empty;

    public Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default) =>
        throw new InvalidOperationException(
            "System SQL connections are not available when ArchLucid storage is InMemory.");
}
