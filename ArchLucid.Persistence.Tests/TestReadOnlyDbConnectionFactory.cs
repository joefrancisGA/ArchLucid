using ArchLucid.Persistence.Connections;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Mirrors a primary <see cref="ISqlConnectionFactory" /> for tests that need both write and read factories.
/// </summary>
public sealed class TestReadOnlyDbConnectionFactory(ISqlConnectionFactory inner) : IReadOnlyDbConnectionFactory
{
    private readonly ISqlConnectionFactory _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    /// <inheritdoc />
    public Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken) =>
        _inner.CreateOpenConnectionAsync(cancellationToken);
}
