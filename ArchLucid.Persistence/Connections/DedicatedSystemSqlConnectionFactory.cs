using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     <see cref="ISystemSqlConnectionFactory" /> backed by a fixed encrypted connection string (dedicated system catalog).
/// </summary>
public sealed class DedicatedSystemSqlConnectionFactory : ISystemSqlConnectionFactory
{
    private readonly string _connectionString;

    public DedicatedSystemSqlConnectionFactory(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);
        _connectionString = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(connectionString);
    }

    public async Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken)
    {
        SqlConnection connection = new(_connectionString);
        await connection.OpenAsync(cancellationToken);
        return connection;
    }
}
