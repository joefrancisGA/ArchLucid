using System.Text.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Integrations;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Shared inbound ITSM webhook processing pipeline parameterized by provider readers and mappers.</summary>
public sealed class ItsmInboundWebhookProcessPipeline(
    ItsmInboundWebhookSyncSupport support,
    IOptionsMonitor<IntegrationsItsmInboundOptions> inboundOptions,
    ItsmInboundDispositionSync dispositionSync,
    ILogger<ItsmInboundWebhookProcessPipeline> logger)
{
    private readonly ItsmInboundWebhookSyncSupport _support =
        support ?? throw new ArgumentNullException(nameof(support));

    private readonly IOptionsMonitor<IntegrationsItsmInboundOptions> _inboundOptions =
        inboundOptions ?? throw new ArgumentNullException(nameof(inboundOptions));

    private readonly ItsmInboundDispositionSync _dispositionSync =
        dispositionSync ?? throw new ArgumentNullException(nameof(dispositionSync));

    private readonly ILogger<ItsmInboundWebhookProcessPipeline> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<ItsmInboundWebhookProcessResult> TryProcessUpdateAsync(
        ItsmInboundWebhookProviderDescriptor descriptor,
        IItsmInboundPayloadReader payloadReader,
        IItsmInboundStatusMapper statusMapper,
        JsonElement root,
        CancellationToken ct,
        int? inboundPayloadUtf8ByteCount = null,
        string? deliveryId = null,
        Guid? authenticatedTenantId = null)
    {
        ArgumentNullException.ThrowIfNull(descriptor);
        ArgumentNullException.ThrowIfNull(payloadReader);
        ArgumentNullException.ThrowIfNull(statusMapper);

        if (inboundPayloadUtf8ByteCount is { } overLimit and > ItsmInboundWebhookSyncSupport.MaxInboundWebhookPayloadUtf8Bytes)
        {
            return new ItsmInboundWebhookProcessResult(
                false,
                ItsmInboundWebhookSyncSupport.CreatePayloadTooLargeAudit(descriptor.PayloadTooLargeAuditIsJira, overLimit));
        }

        ItsmInboundPayloadReadResult payload;

        try
        {
            if (!payloadReader.TryRead(root, out payload))
                return new ItsmInboundWebhookProcessResult(false, null);
        }
        catch (ItsmInboundPayloadValidationException validationException)
        {
            return Reject(
                descriptor,
                validationException.ExternalKey,
                validationException.ReasonCode,
                validationException.Message);
        }

        IntegrationsItsmInboundOptions options = _inboundOptions.CurrentValue;
        string effectiveStatusValue = payload.StatusValue;
        (string humanReview, bool mapped) = statusMapper.MapToHumanReview(payload.StatusValue, options);

        if (!mapped && !string.IsNullOrWhiteSpace(payload.AlternateStatusValue))
        {
            (humanReview, mapped) = statusMapper.MapToHumanReview(payload.AlternateStatusValue, options);

            if (mapped)
                effectiveStatusValue = payload.AlternateStatusValue.Trim();
        }

        if (!mapped)
        {
            _logger.LogWarningWithTwoSanitizedUserStrings(
                "ITSM inbound webhook: status {StatusValue} for key {ExternalKey} is not mapped to a HumanReviewStatus — ignoring state change.",
                payload.StatusValue,
                payload.ExternalKey);

            return new ItsmInboundWebhookProcessResult(
                false,
                ItsmInboundWebhookSyncSupport.RejectedAudit(
                    descriptor.RejectedAuditEventType,
                    descriptor.WebhookActorId,
                    Guid.Empty,
                    Guid.Empty,
                    Guid.Empty,
                    descriptor.UnknownStatusReasonCode,
                    CreateStatusPayload(descriptor.ProviderName, payload)));
        }

        if (humanReview.Length == 0)

            return new ItsmInboundWebhookProcessResult(false, null);

        ItsmInboundPayloadReadResult effectivePayload = new()
        {
            ExternalKey = payload.ExternalKey,
            StatusValue = effectiveStatusValue,
            AlternateStatusValue = payload.AlternateStatusValue,
        };

        ItsmFindingCorrelationRecord? row =
            await _support.TryResolveCorrelationAsync(descriptor.ProviderName, effectivePayload.ExternalKey, authenticatedTenantId, ct).ConfigureAwait(false);

        if (row is null)
        {
            _logger.LogWarning(
                "ITSM {Provider} webhook: no correlation for key {Key}.",
                descriptor.ProviderName,
                LogSanitizer.Sanitize(payload.ExternalKey));

            return new ItsmInboundWebhookProcessResult(true, null);
        }

        if (!_support.ValidateCorrelationFindingId(
                row,
                descriptor.RejectedAuditEventType,
                descriptor.WebhookActorId,
                out ItsmInboundWebhookProcessResult findingIdReject))

            return findingIdReject;

        if (!await _support.FindingRecordExistsAsync(row.TenantId, row.FindingId, row.FindingRecordId, ct).ConfigureAwait(false))
        {
            return new ItsmInboundWebhookProcessResult(
                true,
                ItsmInboundWebhookSyncSupport.RejectedAudit(
                    descriptor.RejectedAuditEventType,
                    descriptor.WebhookActorId,
                    row.TenantId,
                    row.WorkspaceId,
                    row.ProjectId,
                    "finding_not_found",
                    CreateFindingNotFoundPayload(descriptor.ProviderName, effectivePayload, row.FindingId)));
        }

        string replayEventId = ItsmInboundWebhookReplayEventId.Resolve(
            deliveryId,
            descriptor.ProviderName,
            effectivePayload.ExternalKey,
            effectivePayload.StatusValue);

        if (!await _support.TryClaimReplayAsync(row.TenantId, descriptor.ProviderName, replayEventId, ct).ConfigureAwait(false))
        {
            return new ItsmInboundWebhookProcessResult(
                true,
                _support.CreateReplayIgnoredAudit(
                    descriptor.WebhookActorId,
                    row.TenantId,
                    row.WorkspaceId,
                    row.ProjectId,
                    replayEventId,
                    CreateStatusPayload(descriptor.ProviderName, effectivePayload)),
                ReplayIgnored: true);
        }

        try
        {
            int updated = await _support
                .UpdateHumanReviewStatusForFindingAsync(row.TenantId, row.FindingId, humanReview, row.FindingRecordId, ct)
                .ConfigureAwait(false);

            if (updated == 0)

                _logger.LogWarning(
                    "ITSM {Provider} webhook: correlation exists but no FindingRecords updated for tenant {TenantId} finding {FindingId}.",
                    descriptor.ProviderName,
                    row.TenantId,
                    LogSanitizer.Sanitize(row.FindingId));

            FindingDisposition? mappedDisposition =
                statusMapper.TryMapToDisposition(effectivePayload.StatusValue, options);

            ItsmInboundDispositionSyncResult dispositionResult =
                await _dispositionSync
                    .TryRecordFromWebhookAsync(row, mappedDisposition, effectivePayload.StatusValue, descriptor.WebhookActorId, ct)
                    .ConfigureAwait(false);

            AuditEvent auditEvent = new()
            {
                EventType = descriptor.SyncedAuditEventType,
                ExplicitActor = true,
                ActorUserId = descriptor.WebhookActorId,
                ActorUserName = descriptor.WebhookActorId,
                TenantId = row.TenantId,
                WorkspaceId = row.WorkspaceId,
                ProjectId = row.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    CreateSyncedAuditPayload(descriptor.ProviderName, effectivePayload, replayEventId, humanReview, updated, dispositionResult))
            };

            return new ItsmInboundWebhookProcessResult(true, auditEvent);
        }
        catch
        {
            await _support.ReleaseReplayAsync(row.TenantId, descriptor.ProviderName, replayEventId, ct).ConfigureAwait(false);

            throw;
        }
    }

    private static ItsmInboundWebhookProcessResult Reject(
        ItsmInboundWebhookProviderDescriptor descriptor,
        string externalKey,
        string reasonCode,
        string message) =>
        new(
            false,
            ItsmInboundWebhookSyncSupport.RejectedAudit(
                descriptor.RejectedAuditEventType,
                descriptor.WebhookActorId,
                Guid.Empty,
                Guid.Empty,
                Guid.Empty,
                reasonCode,
                CreateRejectPayload(descriptor.ProviderName, externalKey, message)));

    private static object CreateStatusPayload(string providerName, ItsmInboundPayloadReadResult payload) =>
        providerName == "Jira"
            ? new
            {
                issueKey = payload.ExternalKey,
                statusName = payload.StatusValue
            }
            : new
            {
                externalKey = payload.ExternalKey,
                state = payload.StatusValue
            };

    private static object CreateFindingNotFoundPayload(
        string providerName,
        ItsmInboundPayloadReadResult payload,
        string findingId) =>
        providerName == "Jira"
            ? new
            {
                issueKey = payload.ExternalKey,
                statusName = payload.StatusValue,
                findingId
            }
            : new
            {
                externalKey = payload.ExternalKey,
                state = payload.StatusValue,
                findingId
            };

    private static object CreateRejectPayload(string providerName, string externalKey, string message) =>
        providerName == "Jira"
            ? new
            {
                issueKey = externalKey,
                message
            }
            : new
            {
                externalKey,
                message
            };

    private static object CreateSyncedAuditPayload(
        string providerName,
        ItsmInboundPayloadReadResult payload,
        string replayEventId,
        string humanReview,
        int updated,
        ItsmInboundDispositionSyncResult dispositionResult)
    {
        if (providerName == "Jira")
        {
            return new
            {
                issueKey = payload.ExternalKey,
                statusName = payload.StatusValue,
                replayEventId,
                humanReviewStatus = humanReview,
                rowsUpdated = updated,
                dispositionSynced = dispositionResult.WasRecorded,
                disposition = dispositionResult.Disposition?.ToString(),
                dispositionEventId = dispositionResult.DispositionEventId,
                dispositionSkipReason = dispositionResult.SkipReason,
            };
        }

        return new
        {
            externalKey = payload.ExternalKey,
            state = payload.StatusValue,
            replayEventId,
            humanReviewStatus = humanReview,
            rowsUpdated = updated,
            dispositionSynced = dispositionResult.WasRecorded,
            disposition = dispositionResult.Disposition?.ToString(),
            dispositionEventId = dispositionResult.DispositionEventId,
            dispositionSkipReason = dispositionResult.SkipReason,
        };
    }
}
