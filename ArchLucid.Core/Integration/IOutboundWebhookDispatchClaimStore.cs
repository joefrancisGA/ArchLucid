namespace ArchLucid.Core.Integration;

public interface IOutboundWebhookDispatchClaimStore
{
    /// <summary>Returns true for the sole automatic dispatch attempt. Does not record remote receipt.</summary>
    Task<bool> TryClaimAsync(OutboundWebhookDispatchClaim claim, CancellationToken cancellationToken);
}
