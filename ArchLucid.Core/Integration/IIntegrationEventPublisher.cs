namespace ArchLucid.Core.Integration;

/// <summary>
///     Publishes JSON integration events to external systems (e.g. Azure Service Bus). Default implementation is a no-op.
/// </summary>
public interface IIntegrationEventPublisher
{
    /// <param name="eventType">
    ///     Logical type (canonical <c>com.archlucid.*</c>; older persisted rows may still use legacy V1
    ///     aliases from <see cref="IntegrationEventTypes" />).
    /// </param>
    /// <param name="utf8JsonPayload">UTF-8 JSON body for the message.</param>
    /// <param name="cancellationToken"></param>
    Task PublishAsync(string eventType, ReadOnlyMemory<byte> utf8JsonPayload,
        CancellationToken cancellationToken = default);

    /// <param name="messageId"></param>
    /// <param name="applicationProperties">
    ///     Optional user properties merged with <c>event_type</c> (e.g.
    ///     <see cref="IntegrationEventServiceBusApplicationProperties.PromotionEnvironmentPropertyName" /> for SQL
    ///     subscription filters).
    /// </param>
    /// <param name="eventType"></param>
    /// <param name="utf8JsonPayload"></param>
    /// <param name="cancellationToken"></param>
    Task PublishAsync(
        string eventType,
        ReadOnlyMemory<byte> utf8JsonPayload,
        string? messageId,
        IReadOnlyDictionary<string, object>? applicationProperties,
        CancellationToken cancellationToken);
}
