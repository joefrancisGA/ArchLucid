using System.Data;

using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Tests.Support;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     <see cref="IDbConnectionFactory" /> for SQL contract tests that touch RLS-protected tables (governance, alerts, etc.):
///     pooled sessions may inherit <c>SESSION_CONTEXT</c> from unrelated tests, which breaks block predicates and FK visibility.
/// </summary>
public sealed class RlsBypassTestDbConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public RlsBypassTestDbConnectionFactory(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);
        _connectionString = connectionString;
    }

    /// <inheritdoc />
    public IDbConnection CreateConnection()
    {
        return new SqlConnection(_connectionString);
    }

    /// <inheritdoc />
    public async Task<IDbConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default)
    {
        SqlConnection connection = new(_connectionString);
        await connection.OpenAsync(cancellationToken);

        await PersistenceIntegrationTestRlsSession.ApplyArchLucidRlsBypassAsync(connection, cancellationToken);

        return connection;
    }
}
