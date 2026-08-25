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

/// <summary>Maps inbound Jira issue-update payloads to finding human-review status and disposition trail.</summary>
public sealed class ItsmInboundJiraWebhookProcessor(
    ItsmInboundWebhookSyncSupport support,
    IOptionsMonitor<IntegrationsItsmInboundOptions> inboundOptions,
    ItsmInboundDispositionSync dispositionSync,
    ILogger<ItsmInboundJiraWebhookProcessor> logger)
{
    private const int MaxItsmExternalKeyLength = 256;

    private const int MaxJiraStatusNameLength = 128;

    private static readonly Regex JiraIssueKeyRegex = new(
        @"^[A-Za-z][A-Za-z0-9_]+-\d+$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private readonly ItsmInboundWebhookSyncSupport _support =
        support ?? throw new ArgumentNullException(nameof(support));

    private readonly IOptionsMonitor<IntegrationsItsmInboundOptions> _inboundOptions =
        inboundOptions ?? throw new ArgumentNullException(nameof(inboundOptions));

    private readonly ItsmInboundDispositionSync _dispositionSync =
        dispositionSync ?? throw new ArgumentNullException(nameof(dispositionSync));

    private readonly ILogger<ItsmInboundJiraWebhookProcessor> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<ItsmInboundWebhookProcessResult> TryProcessIssueUpdateAsync(
        JsonElement root,
        CancellationToken ct,
        int? inboundPayloadUtf8ByteCount = null,
        string? deliveryId = null,
        Guid? authenticatedTenantId = null)
    {
        if (inboundPayloadUtf8ByteCount is { } overLimit and > ItsmInboundWebhookSyncSupport.MaxInboundWebhookPayloadUtf8Bytes)
            return new ItsmInboundWebhookProcessResult(false, ItsmInboundWebhookSyncSupport.CreatePayloadTooLargeAudit(true, overLimit));

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
                "ITSM Jira webhook: status {StatusName} for issue {IssueKey} is not mapped to a HumanReviewStatus — ignoring state change.",
                statusName,
                issueKey);

            return new ItsmInboundWebhookProcessResult(
                false,
                ItsmInboundWebhookSyncSupport.RejectedAudit(
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
            await _support.TryResolveCorrelationAsync("Jira", issueKey, authenticatedTenantId, ct).ConfigureAwait(false);

        if (row is null)
        {
            _logger.LogWarning("ITSM Jira webhook: no correlation for issue {IssueKey}.", LogSanitizer.Sanitize(issueKey));

            return new ItsmInboundWebhookProcessResult(true, null);
        }

        if (!_support.ValidateCorrelationFindingId(
                row,
                AuditEventTypes.IntegrationJiraInboundWebhookRejected,
                "jira-webhook",
                out ItsmInboundWebhookProcessResult findingIdReject))

            return findingIdReject;

        if (!await _support.FindingRecordExistsAsync(row.TenantId, row.FindingId, row.FindingRecordId, ct).ConfigureAwait(false))
        {
            return new ItsmInboundWebhookProcessResult(
                true,
                ItsmInboundWebhookSyncSupport.RejectedAudit(
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

        if (!await _support.TryClaimReplayAsync(row.TenantId, "Jira", replayEventId, ct).ConfigureAwait(false))
        {
            return new ItsmInboundWebhookProcessResult(
                true,
                _support.CreateReplayIgnoredAudit(
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
            int updated = await _support
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
            await _support.ReleaseReplayAsync(row.TenantId, "Jira", replayEventId, ct).ConfigureAwait(false);

            throw;
        }
    }

    private static ItsmInboundWebhookProcessResult RejectJira(string issueKey, string reasonCode, string message) =>
        new(
            false,
            ItsmInboundWebhookSyncSupport.RejectedAudit(
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
}
