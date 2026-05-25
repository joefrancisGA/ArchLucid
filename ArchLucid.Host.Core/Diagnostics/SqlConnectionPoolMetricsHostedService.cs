using System.Diagnostics.Metrics;

using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Diagnostics;

/// <summary>
///     Publishes Microsoft.Data.SqlClient pool counters as OTel observable gauges for Prometheus scrape.
/// </summary>
public sealed class SqlConnectionPoolMetricsHostedService : IHostedService, IDisposable
{
    private readonly ILogger<SqlConnectionPoolMetricsHostedService> _logger;

    private Meter? _meter;

    public SqlConnectionPoolMetricsHostedService(ILogger<SqlConnectionPoolMetricsHostedService> logger)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <inheritdoc />
    public Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            SqlClientPoolEventCounterListener.EnsureStarted();

            _meter = new Meter("ArchLucid.SqlPool", "1.0.0");

            _meter.CreateObservableGauge(
                "archlucid_sql_pool_active_connections",
                () => SqlClientMetrics.GetActiveConnections(),
                description: "Number of active SQL connections in use (not pooled).");

            _meter.CreateObservableGauge(
                "archlucid_sql_pool_idle_connections",
                () => SqlClientMetrics.GetIdleConnections(),
                description: "Number of idle SQL connections available in pool.");

            _meter.CreateObservableGauge(
                "archlucid_sql_pool_wait_time_ms",
                () => SqlClientMetrics.GetPoolWaitTimeMs(),
                description: "Time in ms waiting for a connection from the pool.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "SQL connection pool metrics listener failed to start; continuing without pool gauges.");
        }

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task StopAsync(CancellationToken cancellationToken)
    {
        _meter?.Dispose();
        _meter = null;

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public void Dispose() => _meter?.Dispose();
}
