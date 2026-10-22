namespace ArchLucid.Core.Integrations.Itsm;

/// <summary>
///     Rejects replayed ITSM inbound webhook delivery / synthetic event ids within a bounded retention window (TB-968).
/// </summary>
public interface IItsmInboundWebhookReplayGuard
{
    /// <summary>Returns <see langword="true"/> when the event was remembered within the retention window.</summary>
    Task<bool> HasSeenAsync(Guid tenantId, string providerName, string eventId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Atomically claims an event id before mutation. Returns <see langword="true"/> only for the first claimant
    ///     within the retention window; concurrent duplicate deliveries receive <see langword="false"/>.
    /// </summary>
    Task<bool> TryClaimAsync(Guid tenantId, string providerName, string eventId, CancellationToken cancellationToken = default);

    /// <summary>Remembers a successfully processed event id (call only after durable mutation succeeds).</summary>
    Task RememberAsync(Guid tenantId, string providerName, string eventId, CancellationToken cancellationToken = default);

    /// <summary>Releases a prior <see cref="TryClaimAsync"/> claim so a failed delivery can be retried.</summary>
    Task ReleaseAsync(Guid tenantId, string providerName, string eventId, CancellationToken cancellationToken = default);
}