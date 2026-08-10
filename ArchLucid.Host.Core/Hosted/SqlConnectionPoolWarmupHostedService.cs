using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Persistence.Data.Infrastructure;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Opens a small batch of product-catalog SQL connections at startup so the first authenticated
///     request does not pay full TLS + pool cold-start cost. Fail-open; runs once (not leader-elected)
///     so every replica warms its own process pool.
/// </summary>
public sealed class SqlConnectionPoolWarmupHostedService(
    IConfiguration configuration,
    IOptionsMonitor<SqlConnectionPoolWarmupOptions> optionsMonitor,
    IOptionsMonitor<SqlConnectionPoolOptions> poolOptionsMonitor,
    ILogger<SqlConnectionPoolWarmupHostedService> logger) : IHostedService
{
    private readonly IConfiguration _configuration =
        configuration ?? throw new ArgumentNullException(nameof(configuration));

    private readonly IOptionsMonitor<SqlConnectionPoolWarmupOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly IOptionsMonitor<SqlConnectionPoolOptions> _poolOptionsMonitor =
        poolOptionsMonitor ?? throw new ArgumentNullException(nameof(poolOptionsMonitor));

    private readonly ILogger<SqlConnectionPoolWarmupHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        SqlConnectionPoolWarmupOptions opts = _optionsMonitor.CurrentValue;

        if (!opts.Enabled)
            return;

        string? connectionString = ArchLucidConfigurationBridge.ResolveSqlConnectionString(_configuration);

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            if (_logger.IsEnabled(LogLevel.Debug))
                _logger.LogDebug("SQL pool warmup skipped: product catalog connection string is empty.");

            return;
        }

        string normalized = SqlConnectionStringPoolNormalizer.Apply(
            connectionString,
            _poolOptionsMonitor.CurrentValue);

        int count = Math.Clamp(opts.ConnectionCount, 1, 32);
        List<SqlConnection> opened = new(count);

        try
        {
            for (int i = 0; i < count; i++)
            {
                if (cancellationToken.IsCancellationRequested)
                    break;

                SqlConnection connection = new(normalized);
                await connection.OpenAsync(cancellationToken).ConfigureAwait(false);

                await using (SqlCommand command = connection.CreateCommand())
                {
                    command.CommandText = "SELECT 1";
                    command.CommandTimeout = 5;
                    _ = await command.ExecuteScalarAsync(cancellationToken).ConfigureAwait(false);
                }

                opened.Add(connection);
            }

            if (_logger.IsEnabled(LogLevel.Information))
                _logger.LogInformation("SQL connection pool warmup opened {ConnectionCount} connection(s).", opened.Count);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // Host shutting down during startup — ignore.
        }
        catch (Exception ex)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
                _logger.LogWarning(ex, "SQL connection pool warmup failed; continuing fail-open.");
        }
        finally
        {
            foreach (SqlConnection connection in opened)
                await connection.DisposeAsync().ConfigureAwait(false);
        }
    }

    /// <inheritdoc />
    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
