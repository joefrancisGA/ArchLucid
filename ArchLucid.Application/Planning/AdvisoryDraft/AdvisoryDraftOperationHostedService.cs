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
                await ProcessAsync(item, stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
    }

    private async Task ProcessAsync(AdvisoryDraftOperationWorkItem item, CancellationToken stoppingToken)
    {
        _store.MarkRunning(item.OperationId);

        if (_cancellationRegistry.IsCancelRequested(item.Scope, item.OperationId))
        {
            _store.MarkCanceled(item.OperationId);
            return;
        }

        try
        {
            using IServiceScope scope = _scopeFactory.CreateScope();
            IArchitectureRequestDraftService draftService =
                scope.ServiceProvider.GetRequiredService<IArchitectureRequestDraftService>();

            StoreAdvisoryDraftProgress progress = new(_store, item.OperationId);

            DraftArchitectureRequestResponse response = await draftService.DraftAsync(
                item.Input,
                stoppingToken,
                progress);

            if (_cancellationRegistry.IsCancelRequested(item.Scope, item.OperationId))
            {
                _store.MarkCanceled(item.OperationId);
                return;
            }

            _store.MarkSucceeded(item.OperationId, response);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            _store.MarkCanceled(item.OperationId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Advisory draft operation failed for {OperationId}",
                item.OperationId);

            _store.MarkFailed(item.OperationId, ex.Message);
        }
    }
}
