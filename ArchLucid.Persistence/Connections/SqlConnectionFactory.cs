using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Connections;

[ExcludeFromCodeCoverage(Justification = "Requires live SQL Server connection; tested via integration tests.")]
public sealed class SqlConnectionFactory : ISqlConnectionFactory
{
    private readonly string _connectionString;

    public SqlConnectionFactory(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);
        string secureString = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(connectionString);
        SqlConnectionStringBuilder builder = new(secureString)
        {
            CommandTimeout = 30
        };
        _connectionString = builder.ConnectionString;
    }

    public async Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken ct)
    {
        SqlConnection connection = new(_connectionString);
        await connection.OpenAsync(ct);
        return connection;
    }
}
