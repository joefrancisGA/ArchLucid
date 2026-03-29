namespace ArchiForge.Api.Hosted;

/// <summary>
/// Background worker that polls due advisory scan schedules on a fixed interval (v1 — not a distributed scheduler).
/// </summary>
/// <remarks>
/// Creates a scope per iteration and delegates to <see cref="AdvisoryDueScheduleProcessor"/> (same semantics as before extraction).
/// Per-schedule failures are logged and do not stop the loop; a missed lock means multiple hosts could run the same schedule (acceptable for v1).
/// </remarks>
public sealed class AdvisoryScanHostedService(IServiceProvider serviceProvider, ILogger<AdvisoryScanHostedService> logger)
    : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(5);

    /// <summary>
    /// Polls every <see cref="PollInterval"/> until cancellation, swallowing iteration errors except when shutting down.
    /// </summary>
    /// <param name="stoppingToken">Host shutdown token.</param>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Advisory scan hosted service started (poll every {Minutes} minutes).", PollInterval.TotalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using IServiceScope scope = serviceProvider.CreateScope();
                AdvisoryDueScheduleProcessor processor = scope.ServiceProvider.GetRequiredService<AdvisoryDueScheduleProcessor>();

                await processor
                    .ProcessDueAsync(DateTime.UtcNow, 10, stoppingToken)
                    ;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                logger.LogError(ex, "Advisory scan poll iteration failed.");
            }

            try
            {
                await Task.Delay(PollInterval, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
