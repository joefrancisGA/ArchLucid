using System.Data;

using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     <see cref="IDbConnectionFactory" /> over a fixed connection string for SQL-backed contract tests.
/// </summary>
public sealed class TestSqlDbConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public TestSqlDbConnectionFactory(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);
        SqlConnectionStringBuilder builder = new(connectionString)
        {
            ConnectRetryCount = 3,
            ConnectRetryInterval = 10
        };
        _connectionString = builder.ConnectionString;
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
        return connection;
    }
}
