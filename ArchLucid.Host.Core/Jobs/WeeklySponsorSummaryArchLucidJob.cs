using ArchLucid.Application.WeeklySponsorSummary;

namespace ArchLucid.Host.Core.Jobs;

/// <summary>
///     One-shot weekly sponsor summary delivery (same body as
///     <see cref="Hosted.WeeklySponsorSummaryHostedService"/> iteration).
/// </summary>
public sealed class WeeklySponsorSummaryArchLucidJob(
    IServiceProvider serviceProvider,
    ILogger<WeeklySponsorSummaryArchLucidJob> logger) : IArchLucidJob
{
    private readonly IServiceProvider _serviceProvider =
        serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));

    private readonly ILogger<WeeklySponsorSummaryArchLucidJob> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public string Name => ArchLucidJobNames.WeeklySponsorSummary;

    /// <inheritdoc />
    public async Task<int> RunOnceAsync(CancellationToken cancellationToken)
    {
        try
        {
            using IServiceScope scope = _serviceProvider.CreateScope();
            WeeklySponsorSummaryDeliveryScanner scanner =
                scope.ServiceProvider.GetRequiredService<WeeklySponsorSummaryDeliveryScanner>();

            await scanner.PublishDueAsync(TimeProvider.System.GetUtcNow(), cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Weekly sponsor summary job failed.");

            return ArchLucidJobExitCodes.JobFailure;
        }

        return ArchLucidJobExitCodes.Success;
    }
}
