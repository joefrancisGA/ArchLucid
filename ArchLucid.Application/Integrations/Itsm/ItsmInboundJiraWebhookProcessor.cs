using System.Text.Json;

using ArchLucid.Core.Audit;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Maps inbound Jira issue-update payloads to finding human-review status and disposition trail.</summary>
public sealed class ItsmInboundJiraWebhookProcessor(
    ItsmInboundWebhookProcessPipeline pipeline,
    ItsmInboundJiraPayloadReader payloadReader,
    ItsmInboundJiraStatusMapper statusMapper)
{
    private static readonly ItsmInboundWebhookProviderDescriptor Descriptor = new()
    {
        ProviderName = "Jira",
        WebhookActorId = "jira-webhook",
        RejectedAuditEventType = AuditEventTypes.IntegrationJiraInboundWebhookRejected,
        SyncedAuditEventType = AuditEventTypes.IntegrationJiraIssueStatusSynced,
        UnknownStatusReasonCode = "jira_status_unknown",
        PayloadTooLargeAuditIsJira = true,
    };

    private readonly ItsmInboundWebhookProcessPipeline _pipeline =
        pipeline ?? throw new ArgumentNullException(nameof(pipeline));

    private readonly ItsmInboundJiraPayloadReader _payloadReader =
        payloadReader ?? throw new ArgumentNullException(nameof(payloadReader));

    private readonly ItsmInboundJiraStatusMapper _statusMapper =
        statusMapper ?? throw new ArgumentNullException(nameof(statusMapper));

    public Task<ItsmInboundWebhookProcessResult> TryProcessIssueUpdateAsync(
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
