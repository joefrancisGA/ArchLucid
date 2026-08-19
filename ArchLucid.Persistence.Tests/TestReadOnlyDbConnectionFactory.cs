using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Mirrors a primary SQL connection for tests that need both write and read factories.
/// </summary>
public sealed class TestReadOnlyDbConnectionFactory : IReadOnlyDbConnectionFactory
{
    private readonly Func<CancellationToken, Task<SqlConnection>> _open;

    public TestReadOnlyDbConnectionFactory(ISqlConnectionFactory inner)
    {
        ArgumentNullException.ThrowIfNull(inner);
        _open = inner.CreateOpenConnectionAsync;
    }

    public TestReadOnlyDbConnectionFactory(string connectionString)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);
        string cs = new SqlConnectionStringBuilder(connectionString)
        {
            ConnectRetryCount = 3,
            ConnectRetryInterval = 10
        }.ConnectionString;

        _open = async ct =>
        {
            SqlConnection connection = new(cs);
            await connection.OpenAsync(ct);
            return connection;
        };
    }

    public TestReadOnlyDbConnectionFactory(IDbConnectionFactory inner)
    {
        ArgumentNullException.ThrowIfNull(inner);
        _open = async ct =>
        {
            System.Data.IDbConnection opened = await inner.CreateOpenConnectionAsync(ct);

            if (opened is not SqlConnection sql)
            {
                opened.Dispose();
                throw new InvalidOperationException(
                    "Test read-only factory expects SqlConnection from the primary IDbConnectionFactory.");
            }

            return sql;
        };
    }

    /// <inheritdoc />
    public Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken) =>
        _open(cancellationToken);
}
