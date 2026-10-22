using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     Placeholder for in-memory storage hosts so DI can resolve <see cref="IReadOnlyDbConnectionFactory" />; never opens SQL.
/// </summary>
public sealed class InMemoryReadOnlyDbConnectionFactory : IReadOnlyDbConnectionFactory
{
    /// <inheritdoc />
    public Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken) =>
        throw new InvalidOperationException(
            "Read-only SQL connections are unavailable when ArchLucid:StorageProvider is InMemory.");
}
