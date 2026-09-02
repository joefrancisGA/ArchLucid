namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Provider-specific audit and correlation metadata for inbound ITSM webhook processing.</summary>
public sealed class ItsmInboundWebhookProviderDescriptor
{
    public required string ProviderName { get; init; }

    public required string WebhookActorId { get; init; }

    public required string RejectedAuditEventType { get; init; }

    public required string SyncedAuditEventType { get; init; }

    public required string UnknownStatusReasonCode { get; init; }

    public required bool PayloadTooLargeAuditIsJira { get; init; }
}
