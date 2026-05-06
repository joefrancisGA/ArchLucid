using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

/// <summary>Adapts the scoped tenant-plane <see cref="ISqlConnectionFactory" /> to <see cref="ITenantSqlConnectionFactory" />.</summary>
public sealed class DelegatingTenantSqlConnectionFactory(ISqlConnectionFactory inner) : ITenantSqlConnectionFactory
{
    private readonly ISqlConnectionFactory _inner = inner ?? throw new ArgumentNullException(nameof(inner));

    public Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default) =>
        _inner.CreateOpenConnectionAsync(cancellationToken);
}
