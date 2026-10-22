using System.Text.Json;

using ArchLucid.Core.Audit;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Maps inbound ServiceNow incident-update payloads to finding human-review status and disposition trail.</summary>
public sealed class ItsmInboundServiceNowWebhookProcessor(
    ItsmInboundWebhookProcessPipeline pipeline,
    ItsmInboundServiceNowPayloadReader payloadReader,
    ItsmInboundServiceNowStatusMapper statusMapper)
{
    private static readonly ItsmInboundWebhookProviderDescriptor Descriptor = new()
    {
        ProviderName = "ServiceNow",
        WebhookActorId = "servicenow-webhook",
        RejectedAuditEventType = AuditEventTypes.IntegrationServiceNowInboundWebhookRejected,
        SyncedAuditEventType = AuditEventTypes.IntegrationServiceNowIncidentStatusSynced,
        UnknownStatusReasonCode = "servicenow_state_unknown",
        PayloadTooLargeAuditIsJira = false,
    };

    private readonly ItsmInboundWebhookProcessPipeline _pipeline =
        pipeline ?? throw new ArgumentNullException(nameof(pipeline));

    private readonly ItsmInboundServiceNowPayloadReader _payloadReader =
        payloadReader ?? throw new ArgumentNullException(nameof(payloadReader));

    private readonly ItsmInboundServiceNowStatusMapper _statusMapper =
        statusMapper ?? throw new ArgumentNullException(nameof(statusMapper));

    public Task<ItsmInboundWebhookProcessResult> TryProcessIncidentUpdateAsync(
        JsonElement root,
        CancellationToken ct,
        int? inboundPayloadUtf8ByteCount = null,
        string? deliveryId = null,
        Guid? authenticatedTenantId = null) =>
        _pipeline.TryProcessUpdateAsync(
            Descriptor,
            _payloadReader,
            _statusMapper,
            root,
            ct,
            inboundPayloadUtf8ByteCount,
            deliveryId,
            authenticatedTenantId);
}
