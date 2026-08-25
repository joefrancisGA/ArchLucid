using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Budgeting;

public sealed class LlmWalletSettlementHostedService(
    LlmWalletSettlementQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<LlmWalletSettlementHostedService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (LlmWalletSettlementWorkItem item in queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await using AsyncServiceScope scope = scopeFactory.CreateAsyncScope();
                LlmTenantWalletService walletService = scope.ServiceProvider.GetRequiredService<LlmTenantWalletService>();

                if (item.Kind == LlmWalletSettlementKind.Consume)
                {
                    if (item.AuthorizedUsd > 0m)
                    {
                        await walletService
                            .ReconcileOverageInternalAsync(
                                item.TenantId,
                                item.AmountUsd,
                                item.AuthorizedUsd,
                                item.CorrelationId,
                                stoppingToken)
                            .ConfigureAwait(false);
                    }
                    else
                    {
                        await walletService
                            .ConsumeInternalAsync(item.TenantId, item.AmountUsd, item.CorrelationId, stoppingToken)
                            .ConfigureAwait(false);
                    }
                }
                else
                {
                    await walletService.TryAutoRefillAsync(item.TenantId, item.CorrelationId, stoppingToken).ConfigureAwait(false);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(
                    ex,
                    "LLM wallet settlement failed for tenant {TenantId} kind {Kind}.",
                    item.TenantId,
                    item.Kind);
            }
        }
    }
}
