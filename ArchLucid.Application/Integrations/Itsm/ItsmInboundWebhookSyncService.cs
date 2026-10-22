using System.Text.Json;

using ArchLucid.Core.Audit;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Thin facade for inbound Jira / ServiceNow webhook sync; delegates vendor parsing to processors and centralizes shared correlation/replay/audit.</summary>
public sealed class ItsmInboundWebhookSyncService(
    ItsmInboundJiraWebhookProcessor jiraProcessor,
    ItsmInboundServiceNowWebhookProcessor serviceNowProcessor)
{
    /// <summary>Keep equal to <c>ArchLucid.Api.Http.InboundWebhookBodyLimits.DefaultMaxUtf8Bytes</c> (TB-967).</summary>
    public const int MaxInboundWebhookPayloadUtf8Bytes = ItsmInboundWebhookSyncSupport.MaxInboundWebhookPayloadUtf8Bytes;

    private readonly ItsmInboundJiraWebhookProcessor _jiraProcessor =
        jiraProcessor ?? throw new ArgumentNullException(nameof(jiraProcessor));

    private readonly ItsmInboundServiceNowWebhookProcessor _serviceNowProcessor =
        serviceNowProcessor ?? throw new ArgumentNullException(nameof(serviceNowProcessor));

    /// <summary>
    ///     When <paramref name="inboundPayloadUtf8ByteCount" /> is set, rejects payloads larger than
    ///     <see cref="MaxInboundWebhookPayloadUtf8Bytes" /> (callers should pass the raw body byte length from the HTTP layer).
    /// </summary>
    public Task<ItsmInboundWebhookProcessResult> TryProcessJiraIssueUpdateAsync(
        JsonElement root,
        CancellationToken ct,
        int? inboundPayloadUtf8ByteCount = null,
        string? deliveryId = null,
        Guid? authenticatedTenantId = null) =>
        _jiraProcessor.TryProcessIssueUpdateAsync(
            root,
            ct,
            inboundPayloadUtf8ByteCount,
            deliveryId,
            authenticatedTenantId);

    public Task<ItsmInboundWebhookProcessResult> TryProcessServiceNowIncidentUpdateAsync(
        JsonElement root,
        CancellationToken ct,
        int? inboundPayloadUtf8ByteCount = null,
        string? deliveryId = null,
        Guid? authenticatedTenantId = null) =>
        _serviceNowProcessor.TryProcessIncidentUpdateAsync(
            root,
            ct,
            inboundPayloadUtf8ByteCount,
            deliveryId,
            authenticatedTenantId);

    /// <summary>Factory used by <c>ItsmInboundWebhooksController</c> when the raw body exceeds <see cref="MaxInboundWebhookPayloadUtf8Bytes" />.</summary>
    public static AuditEvent CreatePayloadTooLargeAudit(bool jiraVendor, int utf8ByteCount) =>
        ItsmInboundWebhookSyncSupport.CreatePayloadTooLargeAudit(jiraVendor, utf8ByteCount);
}
