namespace ArchLucid.Core.Integration;

/// <summary>
/// Publishes JSON integration events to external systems (e.g. Azure Service Bus). Default implementation is a no-op.
/// </summary>
public interface IIntegrationEventPublisher
{
    /// <param name="eventType">Logical type (canonical <c>com.archlucid.*</c>; legacy <c>com.archiforge.*</c> aliases may still appear in older rows).</param>
    /// <param name="utf8JsonPayload">UTF-8 JSON body for the message.</param>
    Task PublishAsync(string eventType, ReadOnlyMemory<byte> utf8JsonPayload, CancellationToken cancellationToken = default);

    /// <param name="messageId">
    /// Optional Service Bus message id (duplicate detection / idempotency). When null, the transport may assign an id.
    /// </param>
    Task PublishAsync(
        string eventType,
        ReadOnlyMemory<byte> utf8JsonPayload,
        string? messageId,
        CancellationToken cancellationToken);
}
