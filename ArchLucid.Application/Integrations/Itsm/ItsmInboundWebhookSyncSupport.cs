using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Persistence.Integrations;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Shared correlation, replay-guard, and audit helpers for inbound ITSM webhook processors.</summary>
public sealed class ItsmInboundWebhookSyncSupport(
    IItsmFindingCorrelationRepository correlations,
    IItsmInboundWebhookReplayGuard replayGuard)
{
    /// <summary>Keep equal to <c>ArchLucid.Api.Http.InboundWebhookBodyLimits.DefaultMaxUtf8Bytes</c> (TB-967).</summary>
    public const int MaxInboundWebhookPayloadUtf8Bytes = 65536;

    internal const int MaxFindingIdPersistedLength = 200;

    private readonly IItsmFindingCorrelationRepository _correlations =
        correlations ?? throw new ArgumentNullException(nameof(correlations));

    private readonly IItsmInboundWebhookReplayGuard _replayGuard =
        replayGuard ?? throw new ArgumentNullException(nameof(replayGuard));

    public static AuditEvent CreatePayloadTooLargeAudit(bool jiraVendor, int utf8ByteCount) =>
        new()
        {
            EventType = AuditEventTypes.IntegrationItsmInboundWebhookPayloadRejected,
            ExplicitActor = true,
            ActorUserId = jiraVendor ? "jira-webhook" : "servicenow-webhook",
            ActorUserName = jiraVendor ? "jira-webhook" : "servicenow-webhook",
            TenantId = Guid.Empty,
            WorkspaceId = Guid.Empty,
            ProjectId = Guid.Empty,
            DataJson = JsonSerializer.Serialize(
                new
                {
                    vendor = jiraVendor ? "Jira" : "ServiceNow",
                    reasonCode = "payload_too_large",
                    utf8ByteCount,
                    maxBytes = MaxInboundWebhookPayloadUtf8Bytes
                })
        };

    public AuditEvent CreateReplayIgnoredAudit(
        string actor,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string replayEventId,
        object detail) =>
        new()
        {
            EventType = AuditEventTypes.IntegrationItsmInboundWebhookReplayIgnored,
            ExplicitActor = true,
            ActorUserId = actor,
            ActorUserName = actor,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            DataJson = JsonSerializer.Serialize(new { replayEventId, detail })
        };

    public static AuditEvent RejectedAudit(
        string eventType,
        string actor,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string reasonCode,
        object detail) =>
        new()
        {
            EventType = eventType,
            ExplicitActor = true,
            ActorUserId = actor,
            ActorUserName = actor,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            DataJson = JsonSerializer.Serialize(new { reasonCode, detail })
        };

    public async Task<ItsmFindingCorrelationRecord?> TryResolveCorrelationAsync(
        string provider,
        string externalKey,
        Guid? authenticatedTenantId,
        CancellationToken ct)
    {
        if (authenticatedTenantId is { } tenantId && tenantId != Guid.Empty)
        {
            return await _correlations
                .TryGetByExternalKeyForTenantAsync(tenantId, provider, externalKey, ct)
                .ConfigureAwait(false);
        }

        return await _correlations.TryGetByExternalKeyAsync(provider, externalKey, ct).ConfigureAwait(false);
    }

    public bool ValidateCorrelationFindingId(
        ItsmFindingCorrelationRecord row,
        string rejectedEventType,
        string actor,
        out ItsmInboundWebhookProcessResult reject)
    {
        string fid = row.FindingId.Trim();

        if (fid.Length is 0 or > MaxFindingIdPersistedLength)
        {
            reject = new ItsmInboundWebhookProcessResult(
                false,
                RejectedAudit(
                    rejectedEventType,
                    actor,
                    row.TenantId,
                    row.WorkspaceId,
                    row.ProjectId,
                    "finding_id_invalid_length",
                    new
                    {
                        row.FindingId
                    }));

            return false;
        }

        reject = default;

        return true;
    }

    public Task<bool> TryClaimReplayAsync(Guid tenantId, string provider, string replayEventId, CancellationToken ct) =>
        _replayGuard.TryClaimAsync(tenantId, provider, replayEventId, ct);

    public Task ReleaseReplayAsync(Guid tenantId, string provider, string replayEventId, CancellationToken ct) =>
        _replayGuard.ReleaseAsync(tenantId, provider, replayEventId, ct);

    public Task<bool> FindingRecordExistsAsync(
        Guid tenantId,
        string findingId,
        Guid? findingRecordId,
        CancellationToken ct) =>
        _correlations.FindingRecordExistsAsync(tenantId, findingId, findingRecordId, ct);

    public Task<int> UpdateHumanReviewStatusForFindingAsync(
        Guid tenantId,
        string findingId,
        string humanReview,
        Guid? findingRecordId,
        CancellationToken ct) =>
        _correlations.UpdateHumanReviewStatusForFindingAsync(tenantId, findingId, humanReview, findingRecordId, ct);
}
