using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;

using Polly;

namespace ArchLucid.Persistence.Connections;

/// <summary>
///     <see cref="ISystemSqlConnectionFactory" /> backed by a fixed encrypted connection string (dedicated system catalog).
/// </summary>
/// <remarks>
///     When <paramref name="sqlOpenRetryPipeline" /> retries, only exceptions classified as transient by
///     <see cref="SqlTransientDetector" /> are retried (not authentication/login failures).
/// </remarks>
public sealed class DedicatedSystemSqlConnectionFactory : ISystemSqlConnectionFactory
{
    private readonly string _connectionString;

    private readonly ResiliencePipeline _sqlOpenRetryPipeline;

    /// <summary>Uses <paramref name="sqlOpenRetryPipeline" /> for open attempts; omit or pass a no-op pipeline when retries are undesirable (e.g. contract tests).</summary>
    public DedicatedSystemSqlConnectionFactory(
        string connectionString,
        ResiliencePipeline? sqlOpenRetryPipeline = null,
        bool enforceServerCertificateTrust = false)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);
        _connectionString = SqlConnectionStringSecurity.EnsureSqlClientEncryptMandatory(
            connectionString,
            enforceServerCertificateTrust);
        _sqlOpenRetryPipeline =
            sqlOpenRetryPipeline ?? SqlOpenResilienceDefaults.BuildSqlOpenRetryPipeline(maxRetryAttempts: 0);
    }

    /// <inheritdoc />
    public string SystemConnectionString => _connectionString;

    /// <inheritdoc />
    public async Task<SqlConnection> CreateOpenConnectionAsync(CancellationToken cancellationToken)
    {
        SqlConnection opened = await _sqlOpenRetryPipeline.ExecuteAsync(
            async ct =>
            {
                SqlConnection connection = new(_connectionString);

                await connection.OpenAsync(ct);

                return connection;
            },
            cancellationToken);

        return opened;
    }
}
