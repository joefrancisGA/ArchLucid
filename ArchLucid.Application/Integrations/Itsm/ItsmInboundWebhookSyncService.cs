using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Integrations.Itsm;
using ArchLucid.Persistence.Integrations;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Maps inbound Jira / ServiceNow payloads to <c>FindingRecords.HumanReviewStatus</c> and optional disposition trail; emits durable audit via API layer.</summary>
public sealed class ItsmInboundWebhookSyncService(
    IItsmFindingCorrelationRepository correlations,
    IOptionsMonitor<IntegrationsItsmInboundOptions> inboundOptions,
    ItsmInboundDispositionSync dispositionSync,
    IItsmInboundWebhookReplayGuard replayGuard,
    ILogger<ItsmInboundWebhookSyncService> logger)
{
    /// <summary>Keep equal to <c>ArchLucid.Api.Http.InboundWebhookBodyLimits.DefaultMaxUtf8Bytes</c> (TB-967).</summary>
    public const int MaxInboundWebhookPayloadUtf8Bytes = 65536;

    private const int MaxFindingIdPersistedLength = 200;

    private const int MaxItsmExternalKeyLength = 256;

    private const int MaxJiraStatusNameLength = 128;

    private const int MaxServiceNowStateLength = 64;

    private static readonly Regex JiraIssueKeyRegex = new(
        @"^[A-Za-z][A-Za-z0-9_]+-\d+$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex ServiceNowSysIdRegex = new(
        "^[a-fA-F0-9]{32}$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private readonly IItsmFindingCorrelationRepository _correlations =
        correlations ?? throw new ArgumentNullException(nameof(correlations));

    private readonly IOptionsMonitor<IntegrationsItsmInboundOptions> _inboundOptions =
        inboundOptions ?? throw new ArgumentNullException(nameof(inboundOptions));

    private readonly ItsmInboundDispositionSync _dispositionSync =
        dispositionSync ?? throw new ArgumentNullException(nameof(dispositionSync));

    private readonly IItsmInboundWebhookReplayGuard _replayGuard =
        replayGuard ?? throw new ArgumentNullException(nameof(replayGuard));

    private readonly ILogger<ItsmInboundWebhookSyncService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>
    ///     When <paramref name="inboundPayloadUtf8ByteCount" /> is set, rejects payloads larger than
    ///     <see cref="MaxInboundWebhookPayloadUtf8Bytes" /> (callers should pass the raw body byte length from the HTTP layer).
    /// </summary>
    public async Task<ItsmInboundWebhookProcessResult> TryProcessJiraIssueUpdateAsync(
        JsonElement root,
        CancellationToken ct,
        int? inboundPayloadUtf8ByteCount = null,
        string? deliveryId = null,
        Guid? authenticatedTenantId = null)
    {
        if (inboundPayloadUtf8ByteCount is { } overLimit and > MaxInboundWebhookPayloadUtf8Bytes)
            return new ItsmInboundWebhookProcessResult(false, CreatePayloadTooLargeAudit(true, overLimit));

        string? issueKeyRaw = TryReadJiraIssueKey(root);

        if (string.IsNullOrWhiteSpace(issueKeyRaw))

            return new ItsmInboundWebhookProcessResult(false, null);

        string issueKey = issueKeyRaw.Trim();

        if (issueKey.Length > MaxItsmExternalKeyLength)

            return RejectJira(issueKey, "issue_key_too_long", "Jira issue key exceeds maximum stored length.");

        if (!JiraIssueKeyRegex.IsMatch(issueKey))

            return RejectJira(issueKey, "issue_key_invalid_format", "Jira issue key does not match expected PROJECT-NUMBER format.");

        string? statusNameRaw = TryReadJiraStatusName(root);

        if (string.IsNullOrWhiteSpace(statusNameRaw))

            return new ItsmInboundWebhookProcessResult(false, null);

        string statusName = statusNameRaw.Trim();

        if (statusName.Length > MaxJiraStatusNameLength)

            return RejectJira(issueKey, "status_name_too_long", "Jira status name exceeds maximum length.");

        IntegrationsItsmInboundOptions options = _inboundOptions.CurrentValue;
        (string humanReview, bool mapped) = MapJiraStatusToHumanReview(statusName, options);

        if (!mapped)
        {
            _logger.LogWarningWithTwoSanitizedUserStrings(
                "ITSM Jira webhook: status {StatusName} for issue {IssueKey} is not mapped to a HumanReviewStatus â€” ignoring state change.",
                statusName,
                issueKey);

            return new ItsmInboundWebhookProcessResult(
                false,
                RejectedAudit(
                    AuditEventTypes.IntegrationJiraInboundWebhookRejected,
                    "jira-webhook",
                    Guid.Empty,
                    Guid.Empty,
                    Guid.Empty,
                    "jira_status_unknown",
                    new
                    {
                        issueKey,
                        statusName
                    }));
        }

        if (humanReview.Length == 0)

            return new ItsmInboundWebhookProcessResult(false, null);

        ItsmFindingCorrelationRecord? row =
            await TryResolveCorrelationAsync("Jira", issueKey, authenticatedTenantId, ct).ConfigureAwait(false);

        if (row is null)
        {
            _logger.LogWarning("ITSM Jira webhook: no correlation for issue {IssueKey}.", LogSanitizer.Sanitize(issueKey));

            return new ItsmInboundWebhookProcessResult(true, null);
        }

        if (!ValidateCorrelationFindingId(
                row,
                AuditEventTypes.IntegrationJiraInboundWebhookRejected,
                "jira-webhook",
                out ItsmInboundWebhookProcessResult findingIdReject))

            return findingIdReject;

        if (!await _correlations.FindingRecordExistsAsync(row.TenantId, row.FindingId, row.FindingRecordId, ct).ConfigureAwait(false))
        {
            return new ItsmInboundWebhookProcessResult(
                true,
                RejectedAudit(
                    AuditEventTypes.IntegrationJiraInboundWebhookRejected,
                    "jira-webhook",
                    row.TenantId,
                    row.WorkspaceId,
                    row.ProjectId,
                    "finding_not_found",
                    new
                    {
                        issueKey,
                        statusName,
                        row.FindingId
                    }));
        }

        string replayEventId = ItsmInboundWebhookReplayEventId.Resolve(deliveryId, "Jira", issueKey, statusName);

        if (!await _replayGuard.TryClaimAsync(row.TenantId, "Jira", replayEventId, ct).ConfigureAwait(false))
        {
            return new ItsmInboundWebhookProcessResult(
                true,
                CreateReplayIgnoredAudit(
                    "jira-webhook",
                    row.TenantId,
                    row.WorkspaceId,
                    row.ProjectId,
                    replayEventId,
                    new
                    {
                        issueKey,
                        statusName
                    }),
                ReplayIgnored: true);
        }

        try
        {
            int updated = await _correlations
                .UpdateHumanReviewStatusForFindingAsync(row.TenantId, row.FindingId, humanReview, row.FindingRecordId, ct)
                .ConfigureAwait(false);

            if (updated == 0)

                _logger.LogWarning(
                    "ITSM Jira webhook: correlation exists but no FindingRecords updated for tenant {TenantId} finding {FindingId}.",
                    row.TenantId,
                    LogSanitizer.Sanitize(row.FindingId)); // codeql[cs/log-forging]: FindingId persisted NVARCHAR operational id; TenantId is Guid.

            FindingDisposition? mappedDisposition =
                ItsmInboundExternalStatusMapper.TryMapJiraStatusToDisposition(statusName, options);

            ItsmInboundDispositionSyncResult dispositionResult =
                await _dispositionSync
                    .TryRecordFromWebhookAsync(row, mappedDisposition, statusName, "jira-webhook", ct)
                    .ConfigureAwait(false);

            AuditEvent auditEvent = new()
            {
                EventType = AuditEventTypes.IntegrationJiraIssueStatusSynced,
                ExplicitActor = true,
                ActorUserId = "jira-webhook",
                ActorUserName = "jira-webhook",
                TenantId = row.TenantId,
                WorkspaceId = row.WorkspaceId,
                ProjectId = row.ProjectId,
                DataJson = JsonSerializer.Serialize(
                    new
                    {
                        issueKey,
                        statusName,
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
            await _replayGuard.ReleaseAsync(row.TenantId, "Jira", replayEventId, ct).ConfigureAwait(false);

            throw;
        }
    }

    public async Task<ItsmInboundWebhookProcessResult> TryProcessServiceNowIncidentUpdateAsync(
        JsonElement root,
        CancellationToken ct,
        int? inboundPayloadUtf8ByteCount = null,
        string? deliveryId = null,
        Guid? authenticatedTenantId = null)
    {
        if (inboundPayloadUtf8ByteCount is { } overLimit and > MaxInboundWebhookPayloadUtf8Bytes)
            return new ItsmInboundWebhookProcessResult(false, CreatePayloadTooLargeAudit(false, overLimit));

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
                "ITSM ServiceNow webhook: state {State} for incident {ExternalKey} is not mapped to a HumanReviewStatus â€” ignoring state change.",
                stateNormalized,
                externalKey);

            return new ItsmInboundWebhookProcessResult(
                false,
                RejectedAudit(
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
            await TryResolveCorrelationAsync("ServiceNow", externalKey, authenticatedTenantId, ct).ConfigureAwait(false);

        if (row is null)
        {
            _logger.LogWarning("ITSM ServiceNow webhook: no correlation for key {Key}.", LogSanitizer.Sanitize(externalKey));

            return new ItsmInboundWebhookProcessResult(true, null);
        }

        if (!ValidateCorrelationFindingId(
                row,
                AuditEventTypes.IntegrationServiceNowInboundWebhookRejected,
                "servicenow-webhook",
                out ItsmInboundWebhookProcessResult findingIdReject))

            return findingIdReject;

        if (!await _correlations.FindingRecordExistsAsync(row.TenantId, row.FindingId, row.FindingRecordId, ct).ConfigureAwait(false))
        {
            return new ItsmInboundWebhookProcessResult(
                true,
                RejectedAudit(
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

        if (!await _replayGuard.TryClaimAsync(row.TenantId, "ServiceNow", replayEventId, ct).ConfigureAwait(false))
        {
            return new ItsmInboundWebhookProcessResult(
                true,
                CreateReplayIgnoredAudit(
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
            int updated = await _correlations
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
            await _replayGuard.ReleaseAsync(row.TenantId, "ServiceNow", replayEventId, ct).ConfigureAwait(false);

            throw;
        }
    }

    /// <summary>Factory used by <c>ItsmInboundWebhooksController</c> when the raw body exceeds <see cref="MaxInboundWebhookPayloadUtf8Bytes" />.</summary>
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

    private static AuditEvent CreateReplayIgnoredAudit(
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

    private static ItsmInboundWebhookProcessResult RejectJira(string issueKey, string reasonCode, string message) =>
        new(
            false,
            RejectedAudit(
                AuditEventTypes.IntegrationJiraInboundWebhookRejected,
                "jira-webhook",
                Guid.Empty,
                Guid.Empty,
                Guid.Empty,
                reasonCode,
                new
                {
                    issueKey,
                    message
                }));

    private static ItsmInboundWebhookProcessResult RejectServiceNow(string externalKey, string reasonCode, string message) =>
        new(
            false,
            RejectedAudit(
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

    private static AuditEvent RejectedAudit(
        string eventType,
        string actor,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string reasonCode,
        object detail)
    {
        return new AuditEvent
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
    }

    private async Task<ItsmFindingCorrelationRecord?> TryResolveCorrelationAsync(
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

    private static bool ValidateCorrelationFindingId(
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

    private static (string humanReview, bool mapped) MapJiraStatusToHumanReview(
        string statusName,
        IntegrationsItsmInboundOptions options)
    {
        string s = statusName.Trim();

        if (s.Length is 0)

            return (string.Empty, false);

        if (TryConfiguredHumanReview(options.JiraStatusHumanReviewMap, s, out string? configured, out bool invalidConfiguredValue))
            return (configured!, true);

        if (invalidConfiguredValue)
            return (string.Empty, false);

        if (s.Equals("Done", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Closed", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Resolved", StringComparison.OrdinalIgnoreCase))

            return (nameof(FindingHumanReviewStatus.Approved), true);

        if (s.Equals("To Do", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Open", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("In Progress", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("In Development", StringComparison.OrdinalIgnoreCase))

            return (nameof(FindingHumanReviewStatus.Pending), true);

        return (string.Empty, false);
    }

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

    private static string? TryReadJiraIssueKey(JsonElement root)
    {
        if (root.TryGetProperty("issue", out JsonElement issue) &&
            issue.TryGetProperty("key", out JsonElement keyEl))

            return keyEl.GetString();

        return null;
    }

    private static string? TryReadJiraStatusName(JsonElement root)
    {
        if (!root.TryGetProperty("issue", out JsonElement issue))
            return null;

        if (!issue.TryGetProperty("fields", out JsonElement fields))
            return null;

        if (!fields.TryGetProperty("status", out JsonElement status))
            return null;

        return status.TryGetProperty("name", out JsonElement name) ? name.GetString() : null;
    }

    /// <summary>Reads ServiceNow <c>sys_id</c> (or camelCase <c>sysId</c>) â€” inbound correlation matches outbound registration by sys_id.</summary>
    private static bool TryReadServiceNowKeys(JsonElement root, out string? externalKey, out string? state)
    {
        externalKey = null;
        state = null;

        if (root.TryGetProperty("sys_id", out JsonElement sid))
            externalKey = sid.GetString();

        if (externalKey is null && root.TryGetProperty("sysId", out JsonElement sid2))
            externalKey = sid2.GetString();

        if (root.TryGetProperty("state", out JsonElement st))
            state = st.ValueKind == JsonValueKind.String ? st.GetString() : st.GetRawText();

        if (state is null && root.TryGetProperty("incident_state", out JsonElement ist))
            state = ist.ValueKind == JsonValueKind.String ? ist.GetString() : ist.GetRawText();

        return !string.IsNullOrWhiteSpace(externalKey);
    }
}
