using ArchiForge.Core.Integration;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArchiForge.Persistence.Integration;

/// <inheritdoc cref="IIntegrationEventOutboxProcessor" />
public sealed class IntegrationEventOutboxProcessor(
    IServiceScopeFactory scopeFactory,
    ILogger<IntegrationEventOutboxProcessor> logger) : IIntegrationEventOutboxProcessor
{
    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly ILogger<IntegrationEventOutboxProcessor> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task ProcessPendingBatchAsync(CancellationToken ct)
    {
        using IServiceScope scope = _scopeFactory.CreateScope();
        IIntegrationEventOutboxRepository outbox = scope.ServiceProvider.GetRequiredService<IIntegrationEventOutboxRepository>();
        IIntegrationEventPublisher publisher = scope.ServiceProvider.GetRequiredService<IIntegrationEventPublisher>();

        IReadOnlyList<IntegrationEventOutboxEntry> batch = await outbox.DequeuePendingAsync(25, ct);

        foreach (IntegrationEventOutboxEntry entry in batch)
        {
            try
            {
                await publisher.PublishAsync(
                    entry.EventType,
                    entry.PayloadUtf8,
                    entry.MessageId,
                    ct);

                await outbox.MarkProcessedAsync(entry.OutboxId, ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(
                    ex,
                    "Integration event outbox publish failed for outbox {OutboxId}, event type {EventType}.",
                    entry.OutboxId,
                    entry.EventType);
            }
        }
    }
}
