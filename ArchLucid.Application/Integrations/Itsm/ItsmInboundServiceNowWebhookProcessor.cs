using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Persistence.Integrations;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Maps inbound ServiceNow incident-update payloads to finding human-review status and disposition trail.</summary>
public sealed class ItsmInboundServiceNowWebhookProcessor(
    ItsmInboundWebhookSyncSupport support,
    IOptionsMonitor<IntegrationsItsmInboundOptions> inboundOptions,
    ItsmInboundDispositionSync dispositionSync,
    ILogger<ItsmInboundServiceNowWebhookProcessor> logger)
{
    private const int MaxItsmExternalKeyLength = 256;

    private const int MaxServiceNowStateLength = 64;

    private static readonly Regex ServiceNowSysIdRegex = new(
        "^[a-fA-F0-9]{32}$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private readonly ItsmInboundWebhookSyncSupport _support =
        support ?? throw new ArgumentNullException(nameof(support));

    private readonly IOptionsMonitor<IntegrationsItsmInboundOptions> _inboundOptions =
        inboundOptions ?? throw new ArgumentNullException(nameof(inboundOptions));

    private readonly ItsmInboundDispositionSync _dispositionSync =
        dispositionSync ?? throw new ArgumentNullException(nameof(dispositionSync));

    private readonly ILogger<ItsmInboundServiceNowWebhookProcessor> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<ItsmInboundWebhookProcessResult> TryProcessIncidentUpdateAsync(
        JsonElement root,
        CancellationToken ct,
        int? inboundPayloadUtf8ByteCount = null,
        string? deliveryId = null,
        Guid? authenticatedTenantId = null)
    {
        if (inboundPayloadUtf8ByteCount is { } overLimit and > ItsmInboundWebhookSyncSupport.MaxInboundWebhookPayloadUtf8Bytes)
            return new ItsmInboundWebhookProcessResult(false, ItsmInboundWebhookSyncSupport.CreatePayloadTooLargeAudit(false, overLimit));

        if (!TryReadServiceNowKeys(root, out string? externalKeyRaw, out string? stateRaw) ||
            string.IsNullOrWhiteSpace(externalKeyRaw) ||
            string.IsNullOrWhiteSpace(stateRaw))
            return new ItsmInboundWebhookProcessResult(false, null);

        string externalKey = externalKeyRaw.Trim();

        if (externalKey.Length > MaxItsmExternalKeyLength)

            return RejectServiceNow(externalKey, "external_key_too_long", "ServiceNow sys_id exceeds maximum stored length.");

        if (!ServiceNowSysIdRegex.IsMatch(externalKey))

            return RejectServiceNow(
                externalKey,
                "sys_id_invalid_format",
                "ServiceNow incident key must be a 32-character hexadecimal sys_id (correlation uses the create response sys_id).");

        string stateNormalized = stateRaw.Trim();

        if (stateNormalized.Length > MaxServiceNowStateLength)

            return RejectServiceNow(externalKey, "state_too_long", "ServiceNow incident state value exceeds maximum length.");

        IntegrationsItsmInboundOptions options = _inboundOptions.CurrentValue;
        (string humanReview, bool mapped) = MapServiceNowStateToHumanReview(stateNormalized, options);

        if (!mapped)
        {
            _logger.LogWarningWithTwoSanitizedUserStrings(
                "ITSM ServiceNow webhook: state {State} for incident {ExternalKey} is not mapped to a HumanReviewStatus — ignoring state change.",
                stateNormalized,
                externalKey);

            return new ItsmInboundWebhookProcessResult(
                false,
                ItsmInboundWebhookSyncSupport.RejectedAudit(
                    AuditEventTypes.IntegrationServiceNowInboundWebhookRejected,
                    "servicenow-webhook",
                    Guid.Empty,
                    Guid.Empty,
                    Guid.Empty,
                    "servicenow_state_unknown",
                    new
                    {
                        externalKey,
                        state = stateNormalized
                    }));
        }

        if (humanReview.Length == 0)

            return new ItsmInboundWebhookProcessResult(false, null);

        ItsmFindingCorrelationRecord? row =
            await _support.TryResolveCorrelationAsync("ServiceNow", externalKey, authenticatedTenantId, ct).ConfigureAwait(false);

        if (row is null)
        {
            _logger.LogWarning("ITSM ServiceNow webhook: no correlation for key {Key}.", LogSanitizer.Sanitize(externalKey));

            return new ItsmInboundWebhookProcessResult(true, null);
        }

        if (!_support.ValidateCorrelationFindingId(
                row,
                AuditEventTypes.IntegrationServiceNowInboundWebhookRejected,
                "servicenow-webhook",
                out ItsmInboundWebhookProcessResult findingIdReject))

            return findingIdReject;

        if (!await _support.FindingRecordExistsAsync(row.TenantId, row.FindingId, row.FindingRecordId, ct).ConfigureAwait(false))
        {
            return new ItsmInboundWebhookProcessResult(
                true,
                ItsmInboundWebhookSyncSupport.RejectedAudit(
                    AuditEventTypes.IntegrationServiceNowInboundWebhookRejected,
                    "servicenow-webhook",
                    row.TenantId,
                    row.WorkspaceId,
                    row.ProjectId,
                    "finding_not_found",
                    new
                    {
                        externalKey,
                        state = stateNormalized,
                        row.FindingId
                    }));
        }

        string replayEventId = ItsmInboundWebhookReplayEventId.Resolve(deliveryId, "ServiceNow", externalKey, stateNormalized);

        if (!await _support.TryClaimReplayAsync(row.TenantId, "ServiceNow", replayEventId, ct).ConfigureAwait(false))
        {
            return new ItsmInboundWebhookProcessResult(
                true,
                _support.CreateReplayIgnoredAudit(
                    "servicenow-webhook",
                    row.TenantId,
                    row.WorkspaceId,
                    row.ProjectId,
                    replayEventId,
                    new
                    {
                        externalKey,
                        state = stateNormalized
                    }),
                ReplayIgnored: true);
        }

        try
        {
            int updated = await _support
                .UpdateHumanReviewStatusForFindingAsync(row.TenantId, row.FindingId, humanReview, row.FindingRecordId, ct)
                .ConfigureAwait(false);

            if (updated == 0)

                _logger.LogWarning(
                    "ITSM ServiceNow webhook: correlation exists but no FindingRecords updated for tenant {TenantId} finding {FindingId}.",
                    row.TenantId,
                    LogSanitizer.Sanitize(row.FindingId)); // codeql[cs/log-forging]: FindingId persisted NVARCHAR operational id; TenantId is Guid.

            FindingDisposition? mappedDisposition =
                ItsmInboundExternalStatusMapper.TryMapServiceNowStateToDisposition(stateNormalized, options);

            ItsmInboundDispositionSyncResult dispositionResult =
                await _dispositionSync
                    .TryRecordFromWebhookAsync(row, mappedDisposition, stateNormalized, "servicenow-webhook", ct)
                    .ConfigureAwait(false);

            AuditEvent auditEvent = new()
            {
                EventType = AuditEventTypes.IntegrationServiceNowIncidentStatusSynced,
                ExplicitActor = true,
                ActorUserId = "servicenow-webhook",
                ActorUserName = "servicenow-webhook",
                TenantId = row.TenantId,
                WorkspaceId = row.WorkspaceId,
                ProjectId = row.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        externalKey,
                        state = stateNormalized,
                        replayEventId,
                        humanReviewStatus = humanReview,
                        rowsUpdated = updated,
                        dispositionSynced = dispositionResult.WasRecorded,
                        disposition = dispositionResult.Disposition?.ToString(),
                        dispositionEventId = dispositionResult.DispositionEventId,
                        dispositionSkipReason = dispositionResult.SkipReason,
                    })
            };

            return new ItsmInboundWebhookProcessResult(true, auditEvent);
        }
        catch
        {
            await _support.ReleaseReplayAsync(row.TenantId, "ServiceNow", replayEventId, ct).ConfigureAwait(false);

            throw;
        }
    }

    private static ItsmInboundWebhookProcessResult RejectServiceNow(string externalKey, string reasonCode, string message) =>
        new(
            false,
            ItsmInboundWebhookSyncSupport.RejectedAudit(
                AuditEventTypes.IntegrationServiceNowInboundWebhookRejected,
                "servicenow-webhook",
                Guid.Empty,
                Guid.Empty,
                Guid.Empty,
                reasonCode,
                new
                {
                    externalKey,
                    message
                }));

    private static (string humanReview, bool mapped) MapServiceNowStateToHumanReview(
        string stateRaw,
        IntegrationsItsmInboundOptions options)
    {
        string trimmed = stateRaw.Trim();

        if (trimmed.Length is 0)

            return (string.Empty, false);

        if (TryConfiguredHumanReview(options.ServiceNowStateHumanReviewMap, trimmed, out string? configured, out bool invalidConfiguredValue))
            return (configured!, true);

        if (invalidConfiguredValue)
            return (string.Empty, false);

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out int state) &&
            (state is 6 or 7))

            return (nameof(FindingHumanReviewStatus.Approved), true);

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out int openish) &&
            openish is 1 or 2 or 3)

            return (nameof(FindingHumanReviewStatus.Pending), true);

        if (trimmed.Equals("resolved", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("closed", StringComparison.OrdinalIgnoreCase))

            return (nameof(FindingHumanReviewStatus.Approved), true);

        if (trimmed.Equals("new", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("in progress", StringComparison.OrdinalIgnoreCase))

            return (nameof(FindingHumanReviewStatus.Pending), true);

        return (string.Empty, false);
    }

    /// <summary>
    ///     Operator-provided keys win over defaults. Invalid enum spellings in config are ignored (treated as unmapped).
    /// </summary>
    private static bool TryConfiguredHumanReview(
        Dictionary<string, string> rawMap,
        string incomingKey,
        [System.Diagnostics.CodeAnalysis.NotNullWhen(true)]
        out string? humanReview,
        out bool matchedKeyWithInvalidValue)
    {
        humanReview = null;
        matchedKeyWithInvalidValue = false;

        if (rawMap.Count is 0)
            return false;

        foreach (KeyValuePair<string, string> kv in rawMap.Where(kv => !string.IsNullOrWhiteSpace(kv.Key) && !string.IsNullOrWhiteSpace(kv.Value)).Where(kv => string.Equals(kv.Key.Trim(), incomingKey, StringComparison.OrdinalIgnoreCase)))
        {
            if (!Enum.TryParse(kv.Value.Trim(), ignoreCase: true, out FindingHumanReviewStatus parsed))
            {
                matchedKeyWithInvalidValue = true;

                return false;
            }

            humanReview = parsed.ToString();

            return true;
        }

        return false;
    }

    /// <summary>Reads ServiceNow <c>sys_id</c> (or camelCase <c>sysId</c>) — inbound correlation matches outbound registration by sys_id.</summary>
    private static bool TryReadServiceNowKeys(JsonElement root, out string? externalKey, out string? state)
    {
        externalKey = null;
        state = null;

        if (root.TryGetProperty("sys_id", out JsonElement sid))
            externalKey = sid.GetString();

        if (externalKey is null && root.TryGetProperty("sysId", out JsonElement sid2))
            externalKey = sid2.GetString();

        if (root.TryGetProperty("state", out JsonElement st))
        {
            if (st.ValueKind == JsonValueKind.Null)
                state = null;
            else if (st.ValueKind == JsonValueKind.String)
                state = st.GetString();
            else
                state = st.GetRawText();
        }

        if (string.IsNullOrWhiteSpace(state) && root.TryGetProperty("incident_state", out JsonElement ist))
            state = ist.ValueKind == JsonValueKind.Null
                ? null
                : ist.ValueKind == JsonValueKind.String
                    ? ist.GetString()
                    : ist.GetRawText();

        return !string.IsNullOrWhiteSpace(externalKey);
    }
}
