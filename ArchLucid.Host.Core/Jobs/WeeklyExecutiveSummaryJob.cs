using ArchLucid.Application.WeeklySponsorReport;

namespace ArchLucid.Host.Core.Jobs;

/// <summary>
///     One-shot weekly Sponsor report delivery (same body as
///     <see cref="Hosted.WeeklySponsorReportHostedService"/> iteration).
/// </summary>
public sealed class WeeklySponsorReportJob(
    IServiceProvider serviceProvider,
    ILogger<WeeklySponsorReportJob> logger) : IArchLucidJob
{
    private readonly IServiceProvider _serviceProvider =
        serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));

    private readonly ILogger<WeeklySponsorReportJob> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public string Name => ArchLucidJobNames.WeeklySponsorReport;

    /// <inheritdoc />
    public async Task<int> RunOnceAsync(CancellationToken cancellationToken)
    {
        try
        {
            using IServiceScope scope = _serviceProvider.CreateScope();
            WeeklySponsorReportDeliveryScanner scanner =
                scope.ServiceProvider.GetRequiredService<WeeklySponsorReportDeliveryScanner>();

            await scanner.PublishDueAsync(TimeProvider.System.GetUtcNow(), cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Weekly Sponsor report job failed.");

            return ArchLucidJobExitCodes.JobFailure;
        }

        return ArchLucidJobExitCodes.Success;
    }
}
