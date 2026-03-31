using System.Text.Json;

using ArchiForge.Core.Audit;
using ArchiForge.Persistence.Archival;

using Microsoft.Extensions.Options;

namespace ArchiForge.Api.Hosted;

/// <summary>
/// Periodically applies <see cref="DataArchivalOptions"/> retention cutoffs via <see cref="IDataArchivalCoordinator"/>.
/// </summary>
public sealed class DataArchivalHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<DataArchivalOptions> optionsMonitor,
    ILogger<DataArchivalHostedService> logger) : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<DataArchivalOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<DataArchivalHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            DataArchivalOptions opts = _optionsMonitor.CurrentValue;
            TimeSpan delay = TimeSpan.FromHours(Math.Clamp(opts.IntervalHours, 1, 168));

            try
            {
                if (opts.Enabled)
                {
                    using IServiceScope scope = _scopeFactory.CreateScope();
                    IDataArchivalCoordinator coordinator =
                        scope.ServiceProvider.GetRequiredService<IDataArchivalCoordinator>();
                    await coordinator.RunOnceAsync(opts, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Data archival host loop error.");

                try
                {
                    using IServiceScope auditScope = _scopeFactory.CreateScope();
                    IAuditService audit = auditScope.ServiceProvider.GetRequiredService<IAuditService>();

                    await audit.LogAsync(
                        new AuditEvent
                        {
                            EventType = AuditEventTypes.DataArchivalHostLoopFailed,
                            DataJson = JsonSerializer.Serialize(
                                new
                                {
                                    ex.Message,
                                    ExceptionType = ex.GetType().FullName
                                })
                        },
                        CancellationToken.None);
                }
                catch (Exception auditEx)
                {
                    _logger.LogWarning(auditEx, "Failed to persist audit event for data archival host loop failure.");
                }
            }

            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
