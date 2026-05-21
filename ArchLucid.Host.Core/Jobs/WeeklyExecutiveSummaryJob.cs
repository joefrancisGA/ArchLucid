using ArchLucid.Application.WeeklyExecutiveSummary;

namespace ArchLucid.Host.Core.Jobs;

/// <summary>
///     One-shot weekly executive summary delivery (same body as
///     <see cref="Hosted.WeeklyExecutiveSummaryHostedService"/> iteration).
/// </summary>
public sealed class WeeklyExecutiveSummaryJob(
    IServiceProvider serviceProvider,
    ILogger<WeeklyExecutiveSummaryJob> logger) : IArchLucidJob
{
    private readonly IServiceProvider _serviceProvider =
        serviceProvider ?? throw new ArgumentNullException(nameof(serviceProvider));

    private readonly ILogger<WeeklyExecutiveSummaryJob> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public string Name => ArchLucidJobNames.WeeklyExecutiveSummary;

    /// <inheritdoc />
    public async Task<int> RunOnceAsync(CancellationToken cancellationToken)
    {
        try
        {
            using IServiceScope scope = _serviceProvider.CreateScope();
            WeeklyExecutiveSummaryDeliveryScanner scanner =
                scope.ServiceProvider.GetRequiredService<WeeklyExecutiveSummaryDeliveryScanner>();

            await scanner.PublishDueAsync(TimeProvider.System.GetUtcNow(), cancellationToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Weekly executive summary job failed.");

            return ArchLucidJobExitCodes.JobFailure;
        }

        return ArchLucidJobExitCodes.Success;
    }
}
