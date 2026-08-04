namespace ArchLucid.Core.Integrations.Itsm;

/// <summary>
///     Rejects replayed ITSM inbound webhook delivery / synthetic event ids within a bounded retention window (TB-968).
/// </summary>
public interface IItsmInboundWebhookReplayGuard
{
    /// <summary>Returns <see langword="true"/> when the event was remembered within the retention window.</summary>
    Task<bool> HasSeenAsync(Guid tenantId, string providerName, string eventId, CancellationToken cancellationToken = default);

    /// <summary>Remembers a successfully processed event id (call only after durable mutation succeeds).</summary>
    Task RememberAsync(Guid tenantId, string providerName, string eventId, CancellationToken cancellationToken = default);
}
