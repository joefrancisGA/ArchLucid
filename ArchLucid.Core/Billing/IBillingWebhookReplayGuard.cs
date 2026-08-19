namespace ArchLucid.Core.Billing;

/// <summary>Rejects replayed billing webhook event identifiers within a bounded retention window.</summary>
public interface IBillingWebhookReplayGuard
{
    /// <summary>Returns <see langword="true" /> when the event id was remembered within the retention window.</summary>
    Task<bool> HasSeenAsync(string providerName, string eventId, CancellationToken cancellationToken);

    /// <summary>Remembers a successfully verified event id for replay protection.</summary>
    Task RememberAsync(string providerName, string eventId, CancellationToken cancellationToken);

    Task<bool> TryRegisterEventAsync(string providerName, string eventId, CancellationToken cancellationToken = default);
}
