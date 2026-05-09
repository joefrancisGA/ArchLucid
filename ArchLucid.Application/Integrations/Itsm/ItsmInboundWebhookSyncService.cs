using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Integrations;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Maps inbound Jira / ServiceNow payloads to <c>FindingRecords.HumanReviewStatus</c>; emits durable audit via API layer.</summary>
public sealed class ItsmInboundWebhookSyncService(
    IItsmFindingCorrelationRepository correlations,
    IOptionsMonitor<IntegrationsItsmInboundOptions> inboundOptions,
    ILogger<ItsmInboundWebhookSyncService> logger)
{
    public const int MaxInboundWebhookPayloadUtf8Bytes = 65536;

    private const int MaxFindingIdPersistedLength = 200;

    private const int MaxItsmExternalKeyLength = 256;

    private const int MaxJiraStatusNameLength = 128;

    private const int MaxServiceNowStateLength = 64;

    private static readonly Regex JiraIssueKeyRegex = new(
        @"^[A-Za-z][A-Za-z0-9_]+-\d+$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private static readonly Regex ServiceNowSysIdRegex = new(
        @"^[a-fA-F0-9]{32}$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private readonly IItsmFindingCorrelationRepository _correlations =
        correlations ?? throw new ArgumentNullException(nameof(correlations));

    private readonly IOptionsMonitor<IntegrationsItsmInboundOptions> _inboundOptions =
        inboundOptions ?? throw new ArgumentNullException(nameof(inboundOptions));

    private readonly ILogger<ItsmInboundWebhookSyncService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <summary>
    ///     When <paramref name="inboundPayloadUtf8ByteCount" /> is set, rejects payloads larger than
    ///     <see cref="MaxInboundWebhookPayloadUtf8Bytes" /> (callers should pass the raw body byte length from the HTTP layer).
    /// </summary>
    public async Task<ItsmInboundWebhookProcessResult> TryProcessJiraIssueUpdateAsync(
        JsonElement root,
        CancellationToken ct,
        int? inboundPayloadUtf8ByteCount = null)
    {
        if (inboundPayloadUtf8ByteCount is int overLimit && overLimit > MaxInboundWebhookPayloadUtf8Bytes)
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
            _logger.LogWarning(
                "ITSM Jira webhook: status {StatusName} for issue {IssueKey} is not mapped to a HumanReviewStatus — ignoring state change.",
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
                    new { issueKey, statusName }));
        }

        if (humanReview.Length == 0)

            return new ItsmInboundWebhookProcessResult(false, null);

        ItsmFindingCorrelationRecord? row =
            await _correlations.TryGetByExternalKeyAsync("Jira", issueKey, ct).ConfigureAwait(false);

        if (row is null)
        {
            _logger.LogWarning("ITSM Jira webhook: no correlation for issue {IssueKey}.", issueKey);

            return new ItsmInboundWebhookProcessResult(true, null);
        }

        if (!ValidateCorrelationFindingId(
                row,
                AuditEventTypes.IntegrationJiraInboundWebhookRejected,
                "jira-webhook",
                out ItsmInboundWebhookProcessResult findingIdReject))

            return findingIdReject;

        if (!await _correlations.FindingRecordExistsAsync(row.TenantId, row.FindingId, ct).ConfigureAwait(false))
        {
            return new ItsmInboundWebhookProcessResult(
                false,
                RejectedAudit(
                    AuditEventTypes.IntegrationJiraInboundWebhookRejected,
                    "jira-webhook",
                    row.TenantId,
                    row.WorkspaceId,
                    row.ProjectId,
                    "finding_not_found",
                    new { issueKey, statusName, row.FindingId }));
        }

        int updated = await _correlations
            .UpdateHumanReviewStatusForFindingAsync(row.TenantId, row.FindingId, humanReview, ct)
            .ConfigureAwait(false);

        if (updated == 0)

            _logger.LogWarning(
                "ITSM Jira webhook: correlation exists but no FindingRecords updated for tenant {TenantId} finding {FindingId}.",
                row.TenantId,
                row.FindingId);

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
                new { issueKey, statusName, humanReviewStatus = humanReview, rowsUpdated = updated })
        };

        return new ItsmInboundWebhookProcessResult(true, auditEvent);
    }

    public async Task<ItsmInboundWebhookProcessResult> TryProcessServiceNowIncidentUpdateAsync(
        JsonElement root,
        CancellationToken ct,
        int? inboundPayloadUtf8ByteCount = null)
    {
        if (inboundPayloadUtf8ByteCount is int overLimit && overLimit > MaxInboundWebhookPayloadUtf8Bytes)
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
            _logger.LogWarning(
                "ITSM ServiceNow webhook: state {State} for incident {ExternalKey} is not mapped to a HumanReviewStatus — ignoring state change.",
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
                    new { externalKey, state = stateNormalized }));
        }

        if (humanReview.Length == 0)

            return new ItsmInboundWebhookProcessResult(false, null);

        ItsmFindingCorrelationRecord? row =
            await _correlations.TryGetByExternalKeyAsync("ServiceNow", externalKey, ct).ConfigureAwait(false);

        if (row is null)
        {
            _logger.LogWarning("ITSM ServiceNow webhook: no correlation for key {Key}.", externalKey);

            return new ItsmInboundWebhookProcessResult(true, null);
        }

        if (!ValidateCorrelationFindingId(
                row,
                AuditEventTypes.IntegrationServiceNowInboundWebhookRejected,
                "servicenow-webhook",
                out ItsmInboundWebhookProcessResult findingIdReject))

            return findingIdReject;

        if (!await _correlations.FindingRecordExistsAsync(row.TenantId, row.FindingId, ct).ConfigureAwait(false))
        {
            return new ItsmInboundWebhookProcessResult(
                false,
                RejectedAudit(
                    AuditEventTypes.IntegrationServiceNowInboundWebhookRejected,
                    "servicenow-webhook",
                    row.TenantId,
                    row.WorkspaceId,
                    row.ProjectId,
                    "finding_not_found",
                    new { externalKey, state = stateNormalized, row.FindingId }));
        }

        int updated = await _correlations
            .UpdateHumanReviewStatusForFindingAsync(row.TenantId, row.FindingId, humanReview, ct)
            .ConfigureAwait(false);

        if (updated == 0)

            _logger.LogWarning(
                "ITSM ServiceNow webhook: correlation exists but no FindingRecords updated for tenant {TenantId} finding {FindingId}.",
                row.TenantId,
                row.FindingId);

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
                new { externalKey, state = stateNormalized, humanReviewStatus = humanReview, rowsUpdated = updated })
        };

        return new ItsmInboundWebhookProcessResult(true, auditEvent);
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
                new { issueKey, message }));

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
                new { externalKey, message }));

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

    private static bool ValidateCorrelationFindingId(
        ItsmFindingCorrelationRecord row,
        string rejectedEventType,
        string actor,
        out ItsmInboundWebhookProcessResult reject)
    {
        string fid = row.FindingId.Trim();

        if (fid.Length is 0 || fid.Length > MaxFindingIdPersistedLength)
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
                    new { row.FindingId }));

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

        if (TryConfiguredHumanReview(options.JiraStatusHumanReviewMap, s, out string? configured))
            return (configured!, true);

        if (s.Equals("Done", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Closed", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Resolved", StringComparison.OrdinalIgnoreCase))

            return (FindingHumanReviewStatus.Approved.ToString(), true);

        if (s.Equals("To Do", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Open", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("In Progress", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("In Development", StringComparison.OrdinalIgnoreCase))

            return (FindingHumanReviewStatus.Pending.ToString(), true);

        return (string.Empty, false);
    }

    private static (string humanReview, bool mapped) MapServiceNowStateToHumanReview(
        string stateRaw,
        IntegrationsItsmInboundOptions options)
    {
        string trimmed = stateRaw.Trim();

        if (trimmed.Length is 0)

            return (string.Empty, false);

        if (TryConfiguredHumanReview(options.ServiceNowStateHumanReviewMap, trimmed, out string? configured))
            return (configured!, true);

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out int state) &&
            (state is 6 or 7))

            return (FindingHumanReviewStatus.Approved.ToString(), true);

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out int openish) &&
            openish is 1 or 2 or 3)

            return (FindingHumanReviewStatus.Pending.ToString(), true);

        if (trimmed.Equals("resolved", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("closed", StringComparison.OrdinalIgnoreCase))

            return (FindingHumanReviewStatus.Approved.ToString(), true);

        if (trimmed.Equals("new", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("in progress", StringComparison.OrdinalIgnoreCase))

            return (FindingHumanReviewStatus.Pending.ToString(), true);

        return (string.Empty, false);
    }

    /// <summary>
    ///     Operator-provided keys win over defaults. Invalid enum spellings in config are ignored (treated as unmapped).
    /// </summary>
    private static bool TryConfiguredHumanReview(
        Dictionary<string, string> rawMap,
        string incomingKey,
        [System.Diagnostics.CodeAnalysis.NotNullWhen(true)]
        out string? humanReview)
    {
        humanReview = null;

        if (rawMap.Count is 0)
            return false;

        foreach (KeyValuePair<string, string> kv in rawMap)
        {
            if (string.IsNullOrWhiteSpace(kv.Key) || string.IsNullOrWhiteSpace(kv.Value))
                continue;

            if (!string.Equals(kv.Key.Trim(), incomingKey, StringComparison.OrdinalIgnoreCase))
                continue;

            if (!Enum.TryParse(kv.Value.Trim(), ignoreCase: true, out FindingHumanReviewStatus parsed))
                return false;

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

        if (status.TryGetProperty("name", out JsonElement name))

            return name.GetString();

        return null;
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
            state = st.ValueKind == JsonValueKind.String ? st.GetString() : st.GetRawText();

        if (state is null && root.TryGetProperty("incident_state", out JsonElement ist))
            state = ist.ValueKind == JsonValueKind.String ? ist.GetString() : ist.GetRawText();

        return !string.IsNullOrWhiteSpace(externalKey);
    }
}
