using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Tests.Support;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Opens real <see cref="SqlConnection" /> instances for contract tests that need <see cref="ISqlConnectionFactory" />
///     .
/// </summary>
public sealed class TestSqlConnectionFactory(string connectionString) : ISqlConnectionFactory
{
    private readonly string _connectionString =
        connectionString ?? throw new ArgumentNullException(nameof(connectionString));

    /// <inheritdoc />
    public async Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken ct)
    {
        SqlConnection connection = new(_connectionString);
        await connection.OpenAsync(ct);

        // Pooled connections can carry SESSION_CONTEXT from other tests; FK checks on RLS-protected parents
        // (e.g. AlertRecords) require the referencing session to see the parent row.
        await PersistenceIntegrationTestRlsSession.ApplyArchLucidRlsBypassAsync(connection, ct);

        return connection;
    }
}
