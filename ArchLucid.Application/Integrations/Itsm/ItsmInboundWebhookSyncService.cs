using System.Globalization;
using System.Text.Json;

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
    private readonly IItsmFindingCorrelationRepository _correlations =
        correlations ?? throw new ArgumentNullException(nameof(correlations));

    private readonly IOptionsMonitor<IntegrationsItsmInboundOptions> _inboundOptions =
        inboundOptions ?? throw new ArgumentNullException(nameof(inboundOptions));

    private readonly ILogger<ItsmInboundWebhookSyncService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<ItsmInboundWebhookProcessResult> TryProcessJiraIssueUpdateAsync(JsonElement root, CancellationToken ct)
    {
        string? issueKey = TryReadJiraIssueKey(root);

        if (string.IsNullOrWhiteSpace(issueKey))

            return new ItsmInboundWebhookProcessResult(false, null);

        string? statusName = TryReadJiraStatusName(root);

        if (string.IsNullOrWhiteSpace(statusName))

            return new ItsmInboundWebhookProcessResult(false, null);

        IntegrationsItsmInboundOptions options = _inboundOptions.CurrentValue;
        string humanReview = MapJiraStatusToHumanReview(statusName, options);

        if (humanReview.Length == 0)

            return new ItsmInboundWebhookProcessResult(false, null);

        ItsmFindingCorrelationRecord? row =
            await _correlations.TryGetByExternalKeyAsync("Jira", issueKey, ct).ConfigureAwait(false);

        if (row is null)
        {
            _logger.LogWarning("ITSM Jira webhook: no correlation for issue {IssueKey}.", issueKey);

            return new ItsmInboundWebhookProcessResult(true, null);
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
                new
                {
                    issueKey,
                    statusName,
                    humanReviewStatus = humanReview,
                    rowsUpdated = updated
                })
        };

        return new ItsmInboundWebhookProcessResult(true, auditEvent);
    }

    public async Task<ItsmInboundWebhookProcessResult> TryProcessServiceNowIncidentUpdateAsync(JsonElement root, CancellationToken ct)
    {
        if (!TryReadServiceNowKeys(root, out string? externalKey, out string? stateRaw) ||
            string.IsNullOrWhiteSpace(externalKey) ||
            string.IsNullOrWhiteSpace(stateRaw))

            return new ItsmInboundWebhookProcessResult(false, null);

        IntegrationsItsmInboundOptions options = _inboundOptions.CurrentValue;
        string humanReview = MapServiceNowStateToHumanReview(stateRaw, options);

        if (humanReview.Length == 0)

            return new ItsmInboundWebhookProcessResult(false, null);

        ItsmFindingCorrelationRecord? row =
            await _correlations.TryGetByExternalKeyAsync("ServiceNow", externalKey, ct).ConfigureAwait(false);

        if (row is null)
        {
            _logger.LogWarning("ITSM ServiceNow webhook: no correlation for key {Key}.", externalKey);

            return new ItsmInboundWebhookProcessResult(true, null);
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
                new
                {
                    externalKey,
                    state = stateRaw,
                    humanReviewStatus = humanReview,
                    rowsUpdated = updated
                })
        };

        return new ItsmInboundWebhookProcessResult(true, auditEvent);
    }

    private static string MapJiraStatusToHumanReview(string statusName, IntegrationsItsmInboundOptions options)
    {
        string s = statusName.Trim();

        if (s.Length is 0)

            return string.Empty;

        if (TryConfiguredHumanReview(options.JiraStatusHumanReviewMap, s, out string? configured))
            return configured;

        if (s.Equals("Done", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Closed", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Resolved", StringComparison.OrdinalIgnoreCase))

            return FindingHumanReviewStatus.Approved.ToString();

        if (s.Equals("To Do", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("Open", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("In Progress", StringComparison.OrdinalIgnoreCase) ||
            s.Equals("In Development", StringComparison.OrdinalIgnoreCase))

            return FindingHumanReviewStatus.Pending.ToString();

        return string.Empty;
    }

    private static string MapServiceNowStateToHumanReview(string stateRaw, IntegrationsItsmInboundOptions options)
    {
        string trimmed = stateRaw.Trim();

        if (trimmed.Length is 0)

            return string.Empty;

        if (TryConfiguredHumanReview(options.ServiceNowStateHumanReviewMap, trimmed, out string? configured))
            return configured;

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out int state) &&
            (state is 6 or 7))

            return FindingHumanReviewStatus.Approved.ToString();

        if (int.TryParse(trimmed, NumberStyles.Integer, CultureInfo.InvariantCulture, out int openish) &&
            openish is 1 or 2 or 3)

            return FindingHumanReviewStatus.Pending.ToString();

        if (trimmed.Equals("resolved", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("closed", StringComparison.OrdinalIgnoreCase))

            return FindingHumanReviewStatus.Approved.ToString();

        if (trimmed.Equals("new", StringComparison.OrdinalIgnoreCase) ||
            trimmed.Equals("in progress", StringComparison.OrdinalIgnoreCase))

            return FindingHumanReviewStatus.Pending.ToString();

        return string.Empty;
    }

    /// <summary>
    ///     Operator-provided keys win over defaults. Invalid enum spellings in config are ignored (treated as unmapped).
    /// </summary>
    private static bool TryConfiguredHumanReview(
        Dictionary<string, string> rawMap,
        string incomingKey,
        [System.Diagnostics.CodeAnalysis.NotNullWhen(true)] out string? humanReview)
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

    private static bool TryReadServiceNowKeys(JsonElement root, out string? externalKey, out string? state)
    {
        externalKey = null;
        state = null;

        if (root.TryGetProperty("sys_id", out JsonElement sid))
            externalKey = sid.GetString();

        if (externalKey is null && root.TryGetProperty("sysId", out JsonElement sid2))
            externalKey = sid2.GetString();

        if (root.TryGetProperty("number", out JsonElement num) && externalKey is null)
            externalKey = num.GetString();

        if (root.TryGetProperty("state", out JsonElement st))
            state = st.ValueKind == JsonValueKind.String ? st.GetString() : st.GetRawText();

        if (state is null && root.TryGetProperty("incident_state", out JsonElement ist))
            state = ist.ValueKind == JsonValueKind.String ? ist.GetString() : ist.GetRawText();

        return !string.IsNullOrWhiteSpace(externalKey);
    }
}
