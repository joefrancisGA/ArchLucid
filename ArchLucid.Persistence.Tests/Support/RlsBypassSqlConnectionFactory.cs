using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests.Support;

/// <summary>
///     Opens SQL connections with <see cref="PersistenceIntegrationTestRlsSession.ApplyArchLucidRlsBypassAsync" /> so
///     FK checks and reads against RLS-protected tables behave like admin sessions in CI.
/// </summary>
internal sealed class RlsBypassSqlConnectionFactory : ISqlConnectionFactory
{
    private readonly string _connectionString;

    public RlsBypassSqlConnectionFactory(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);
        _connectionString = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(connectionString);
    }

    public async Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken ct)
    {
        SqlConnection connection = new(_connectionString);
        await connection.OpenAsync(ct);
        await PersistenceIntegrationTestRlsSession.ApplyArchLucidRlsBypassAsync(connection, ct);
        return connection;
    }
}
