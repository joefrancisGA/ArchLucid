using ArchiForge.Decisioning.Advisory.Scheduling;
using ArchiForge.Persistence.Advisory;

namespace ArchiForge.Api.Hosted;

/// <summary>Polls due advisory scan schedules on a fixed interval (v1 — not a distributed scheduler).</summary>
public sealed class AdvisoryScanHostedService(IServiceProvider serviceProvider, ILogger<AdvisoryScanHostedService> logger)
    : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMinutes(5);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Advisory scan hosted service started (poll every {Minutes} minutes).", PollInterval.TotalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = serviceProvider.CreateScope();
                var scheduleRepository = scope.ServiceProvider.GetRequiredService<IAdvisoryScanScheduleRepository>();
                var runner = scope.ServiceProvider.GetRequiredService<IAdvisoryScanRunner>();

                var due = await scheduleRepository
                    .ListDueAsync(DateTime.UtcNow, 10, stoppingToken)
                    .ConfigureAwait(false);

                foreach (var schedule in due)
                {
                    try
                    {
                        await runner.RunScheduleAsync(schedule, stoppingToken).ConfigureAwait(false);
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Advisory scan failed for schedule {ScheduleId}.", schedule.ScheduleId);
                    }
                }
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                logger.LogError(ex, "Advisory scan poll iteration failed.");
            }

            try
            {
                await Task.Delay(PollInterval, stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
