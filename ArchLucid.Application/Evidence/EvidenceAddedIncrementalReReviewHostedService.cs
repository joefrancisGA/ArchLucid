using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Evidence;

public sealed class EvidenceAddedIncrementalReReviewHostedService(
    IEvidenceAddedIncrementalReReviewQueue queue,
    ILogger<EvidenceAddedIncrementalReReviewHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await foreach (Func<CancellationToken, Task> workItem in queue.ReadAllAsync(stoppingToken))
            {
                try
                {
                    await workItem(stoppingToken).ConfigureAwait(false);
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    logger.LogWarning(ex, "Evidence-added incremental re-review background work failed.");
                }
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
    }
}
