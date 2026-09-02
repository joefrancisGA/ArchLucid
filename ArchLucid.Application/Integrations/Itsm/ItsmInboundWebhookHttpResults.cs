using ArchLucid.Core.Audit;
using ArchLucid.Core.Integrations.Itsm;

namespace ArchLucid.Application.Integrations.Itsm;

public enum ItsmInboundWebhookHttpOutcome
{
    Success,
    Unauthorized,
    ValidationFailed,
    PayloadTooLarge,
}

public sealed record ItsmInboundWebhookProcessRequest
{
    public required TenantItsmConnectorProvider Provider { get; init; }

    public Guid? TenantId { get; init; }

    public required string RawBody { get; init; }

    public required int PayloadUtf8Bytes { get; init; }

    public string? VendorToken { get; init; }

    public string? DeliveryId { get; init; }

    public string? HmacSignature { get; init; }

    public string? TimestampHeader { get; init; }
}

public sealed record ItsmInboundWebhookProcessHttpResult
{
    public required ItsmInboundWebhookHttpOutcome Outcome { get; init; }

    public AuditEvent? DurableAuditEvent { get; init; }

    public string? Message { get; init; }
}
