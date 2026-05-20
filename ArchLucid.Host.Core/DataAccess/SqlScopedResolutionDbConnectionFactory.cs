using System.Data;

using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.DataAccess;

/// <summary>
/// Bridges <see cref="IDbConnectionFactory"/> (Data-layer Dapper repos, health checks) to scoped
/// <see cref="ISqlConnectionFactory"/> (resilience + optional RLS session context) without making
/// <see cref="IDbConnectionFactory"/> itself scoped (hosted health checks resolve from the root provider).
/// </summary>
/// <remarks>
/// <see cref="CreateOpenConnectionAsync"/> opens one short DI scope only to resolve
/// <see cref="ISqlConnectionFactory"/>; the returned <see cref="SqlConnection"/> outlives that scope.
/// <see cref="CreateConnection"/> returns an unopened connection for callers that manage open timing themselves
/// (e.g. synchronous admin diagnostics); prefer <see cref="CreateOpenConnectionAsync"/> when Polly-backed open retries apply.
/// When the scoped <see cref="ISqlConnectionFactory"/> is <see cref="ResilientSqlConnectionFactory"/>,
/// transient failures during open are retried and logged at Warning by <see cref="SqlOpenResilienceDefaults.BuildSqlOpenRetryPipeline"/>
/// (elapsed time and retry attempt count); connection strings are never written to logs.
/// </remarks>
public sealed class SqlScopedResolutionDbConnectionFactory(
    IServiceScopeFactory scopeFactory,
    string connectionString,
    IOptionsMonitor<SqlServerOptions> sqlServerOptions) : IDbConnectionFactory
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly string _connectionString = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(
        connectionString ?? throw new ArgumentNullException(nameof(connectionString)));

    private readonly IOptionsMonitor<SqlServerOptions> _sqlServerOptions =
        sqlServerOptions ?? throw new ArgumentNullException(nameof(sqlServerOptions));

    /// <inheritdoc />
    public IDbConnection CreateConnection()
    {
        return new SqlConnection(ResolveConnectionStringWithCommandTimeout());
    }

    /// <inheritdoc />
    public async Task<IDbConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken = default)
    {
        await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();
        ISqlConnectionFactory sql = scope.ServiceProvider.GetRequiredService<ISqlConnectionFactory>();
        SqlConnection connection = await sql.CreateOpenConnectionAsync(cancellationToken);

        return connection;
    }

    private string ResolveConnectionStringWithCommandTimeout()
    {
        int timeoutSeconds = _sqlServerOptions.CurrentValue.CommandTimeoutSeconds;

        if (timeoutSeconds <= 0)
            return _connectionString;

        SqlConnectionStringBuilder builder = new(_connectionString)
        {
            CommandTimeout = timeoutSeconds
        };

        return builder.ConnectionString;
    }
}
