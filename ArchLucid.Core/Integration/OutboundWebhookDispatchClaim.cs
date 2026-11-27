namespace ArchLucid.Core.Integration;

/// <summary>A one-shot outbound reservation, scoped to a tenant, event, and hashed receiver.</summary>
public readonly record struct OutboundWebhookDispatchClaim(Guid TenantId, Guid EventId, string DestinationHash);
