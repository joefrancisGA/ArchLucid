namespace ArchLucid.Persistence.Integration;

/// <summary>Drains <see cref="IIntegrationEventOutboxRepository"/> and publishes via <see cref="ArchLucid.Core.Integration.IIntegrationEventPublisher"/>.</summary>
public interface IIntegrationEventOutboxProcessor
{
    Task ProcessPendingBatchAsync(CancellationToken ct);
}
