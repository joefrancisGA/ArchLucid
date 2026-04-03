using ArchiForge.Persistence.Retrieval;

namespace ArchiForge.Host.Core.Hosted;

/// <summary>
/// Periodically drains <see cref="IRetrievalIndexingOutboxRepository"/> so retrieval indexing runs after the authority UOW commits.
/// </summary>
public sealed class RetrievalIndexingOutboxHostedService(
    IRetrievalIndexingOutboxProcessor processor,
    ILogger<RetrievalIndexingOutboxHostedService> logger) : BackgroundService
{
    private readonly IRetrievalIndexingOutboxProcessor _processor =
        processor ?? throw new ArgumentNullException(nameof(processor));

    private readonly ILogger<RetrievalIndexingOutboxHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await _processor.ProcessPendingBatchAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Retrieval indexing outbox host loop error.");
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}
