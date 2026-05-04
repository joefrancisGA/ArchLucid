using System.Data;

using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Tests.Support;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     <see cref="IDbConnectionFactory" /> for SQL contract tests that touch RLS-protected tables (governance, alerts, etc.):
///     pooled sessions may inherit <c>SESSION_CONTEXT</c> from unrelated tests, which breaks block predicates and FK visibility.
///     Uses the same connection-string normalization as <see cref="RlsBypassSqlConnectionFactory" /> so priming and writes hit the same endpoint.
/// </summary>
public sealed class RlsBypassTestDbConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public RlsBypassTestDbConnectionFactory(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);
        _connectionString = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(connectionString.Trim());
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
