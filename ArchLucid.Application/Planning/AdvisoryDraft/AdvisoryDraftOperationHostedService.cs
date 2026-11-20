using ArchLucid.Application.Operations;
using ArchLucid.Contracts.Operations;
using ArchLucid.Contracts.Requests;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Planning.AdvisoryDraft;

public sealed class AdvisoryDraftOperationHostedService(
    AdvisoryDraftOperationQueue queue,
    IServiceScopeFactory scopeFactory,
    IAdvisoryDraftOperationStore store,
    IOperationCancellationRegistry cancellationRegistry,
    ILogger<AdvisoryDraftOperationHostedService> logger) : BackgroundService
{
    private readonly AdvisoryDraftOperationQueue _queue =
        queue ?? throw new ArgumentNullException(nameof(queue));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IAdvisoryDraftOperationStore _store =
        store ?? throw new ArgumentNullException(nameof(store));

    private readonly IOperationCancellationRegistry _cancellationRegistry =
        cancellationRegistry ?? throw new ArgumentNullException(nameof(cancellationRegistry));

    private readonly ILogger<AdvisoryDraftOperationHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await foreach (AdvisoryDraftOperationWorkItem item in _queue.Reader.ReadAllAsync(stoppingToken))
            {
                try
                {
                    await ProcessAsync(item, stoppingToken);
                }
                catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
                {
                    _logger.LogWarning(ex, "Could not persist advisory draft operation {OperationId} outcome.",
                        item.OperationId);
                }
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
    }

    private async Task ProcessAsync(AdvisoryDraftOperationWorkItem item, CancellationToken stoppingToken)
    {
        try
        {
            await _store.MarkRunningAsync(item.Scope, item.OperationId, stoppingToken);
        }
        catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
        {
            await ReportFailureAsync(item, ex, stoppingToken);
            return;
        }

        if (_cancellationRegistry.IsCancelRequested(item.Scope, item.OperationId))
        {
            await _store.MarkCanceledAsync(item.Scope, item.OperationId, stoppingToken);
            return;
        }

        try
        {
            using IServiceScope scope = _scopeFactory.CreateScope();
            IArchitectureRequestDraftService draftService =
                scope.ServiceProvider.GetRequiredService<IArchitectureRequestDraftService>();

            StoreAdvisoryDraftProgress progress = new(_store, item.Scope, item.OperationId);

            DraftArchitectureRequestResponse response = await draftService.DraftAsync(
                item.Input,
                stoppingToken,
                progress);

            if (_cancellationRegistry.IsCancelRequested(item.Scope, item.OperationId))
            {
                await _store.MarkCanceledAsync(item.Scope, item.OperationId, stoppingToken);
                return;
            }

            await _store.MarkSucceededAsync(item.Scope, item.OperationId, response, stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            await _store.MarkCanceledAsync(item.Scope, item.OperationId, stoppingToken);
        }
        catch (Exception ex)
        {
            await ReportFailureAsync(item, ex, stoppingToken);
        }
    }

    private Task ReportFailureAsync(AdvisoryDraftOperationWorkItem item, Exception error, CancellationToken cancellationToken)
    {
        _logger.LogWarning(error, "Advisory draft operation failed for {OperationId}", item.OperationId);

        return _store.MarkFailedAsync(item.Scope, item.OperationId, error.Message, cancellationToken);
    }
}
