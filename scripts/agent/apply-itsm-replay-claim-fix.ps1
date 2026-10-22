#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-RepoRoot {
    $dir = $PSScriptRoot
    while ($null -ne $dir) {
        if (Test-Path -LiteralPath (Join-Path $dir '.git')) {
            return (Resolve-Path -LiteralPath $dir).Path
        }

        $parent = Split-Path -Parent $dir

        if ([string]::IsNullOrEmpty($parent) -or $parent -eq $dir) {
            break
        }

        $dir = $parent
    }

    throw 'Could not locate git repository root.'
}

function Write-Utf8NoBom([string]$Path, [string]$Content) {
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

$repoRoot = Get-RepoRoot
Set-Location -LiteralPath $repoRoot

Write-Utf8NoBom (Join-Path $repoRoot 'ArchLucid.Core/Integrations/Itsm/IItsmInboundWebhookReplayGuard.cs') @'
namespace ArchLucid.Core.Integrations.Itsm;

/// <summary>
///     Rejects replayed ITSM inbound webhook delivery / synthetic event ids within a bounded retention window (TB-968).
/// </summary>
public interface IItsmInboundWebhookReplayGuard
{
    /// <summary>Returns <see langword="true"/> when the event was remembered within the retention window.</summary>
    Task<bool> HasSeenAsync(Guid tenantId, string providerName, string eventId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Atomically claims an event id before mutation. Returns <see langword="true"/> only for the first claimant
    ///     within the retention window; concurrent duplicate deliveries receive <see langword="false"/>.
    /// </summary>
    Task<bool> TryClaimAsync(Guid tenantId, string providerName, string eventId, CancellationToken cancellationToken = default);

    /// <summary>Remembers a successfully processed event id (call only after durable mutation succeeds).</summary>
    Task RememberAsync(Guid tenantId, string providerName, string eventId, CancellationToken cancellationToken = default);

    /// <summary>Releases a prior <see cref="TryClaimAsync"/> claim so a failed delivery can be retried.</summary>
    Task ReleaseAsync(Guid tenantId, string providerName, string eventId, CancellationToken cancellationToken = default);
}
'@

Write-Utf8NoBom (Join-Path $repoRoot 'ArchLucid.Persistence/Integrations/MemoryCacheItsmInboundWebhookReplayGuard.cs') @'
using ArchLucid.Core.Integrations.Itsm;

using Microsoft.Extensions.Caching.Memory;

namespace ArchLucid.Persistence.Integrations;

/// <summary>Tracks processed ITSM inbound webhook event ids for 24 hours to block replay mutations (TB-968).</summary>
public sealed class MemoryCacheItsmInboundWebhookReplayGuard(IMemoryCache memoryCache, TimeProvider clock)
    : IItsmInboundWebhookReplayGuard
{
    internal static readonly TimeSpan Retention = TimeSpan.FromHours(24);

    private readonly IMemoryCache _memoryCache =
        memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));

    private readonly TimeProvider _clock = clock ?? throw new ArgumentNullException(nameof(clock));

    /// <inheritdoc />
    public Task<bool> HasSeenAsync(
        Guid tenantId,
        string providerName,
        string eventId,
        CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        return Task.FromResult(_memoryCache.TryGetValue(BuildCacheKey(tenantId, providerName, eventId), out _));
    }

    /// <inheritdoc />
    public Task<bool> TryClaimAsync(
        Guid tenantId,
        string providerName,
        string eventId,
        CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        bool claimed = false;

        _ = _memoryCache.GetOrCreate(
            BuildCacheKey(tenantId, providerName, eventId),
            entry =>
            {
                claimed = true;
                ConfigureEntry(entry);

                return true;
            });

        return Task.FromResult(claimed);
    }

    /// <inheritdoc />
    public Task RememberAsync(
        Guid tenantId,
        string providerName,
        string eventId,
        CancellationToken cancellationToken = default)
    {
        _ = TryClaimAsync(tenantId, providerName, eventId, cancellationToken);

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task ReleaseAsync(
        Guid tenantId,
        string providerName,
        string eventId,
        CancellationToken cancellationToken = default)
    {
        _ = cancellationToken;

        ArgumentException.ThrowIfNullOrWhiteSpace(providerName);
        ArgumentException.ThrowIfNullOrWhiteSpace(eventId);

        _memoryCache.Remove(BuildCacheKey(tenantId, providerName, eventId));

        return Task.CompletedTask;
    }

    private void ConfigureEntry(ICacheEntry entry)
    {
        entry.AbsoluteExpiration = _clock.GetUtcNow().Add(Retention);
        entry.Size = 1;
    }

    internal static string BuildCacheKey(Guid tenantId, string providerName, string eventId) =>
        $"itsm-inbound-webhook-replay:{tenantId:D}:{providerName.Trim().ToLowerInvariant()}:{eventId.Trim()}";
}
'@

$syncPath = Join-Path $repoRoot 'ArchLucid.Application/Integrations/Itsm/ItsmInboundWebhookSyncService.cs'
$sync = [System.IO.File]::ReadAllText($syncPath)

$jiraMutation = @'
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
'@

$serviceNowMutation = @'
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
'@

$sync = $sync.Replace(
    'if (await _replayGuard.HasSeenAsync(row.TenantId, "Jira", replayEventId, ct).ConfigureAwait(false))',
    'if (!await _replayGuard.TryClaimAsync(row.TenantId, "Jira", replayEventId, ct).ConfigureAwait(false))')

$sync = $sync.Replace(
    'if (await _replayGuard.HasSeenAsync(row.TenantId, "ServiceNow", replayEventId, ct).ConfigureAwait(false))',
    'if (!await _replayGuard.TryClaimAsync(row.TenantId, "ServiceNow", replayEventId, ct).ConfigureAwait(false))')

$jiraPattern = '(?s)        int updated = await _correlations\r?\n            \.UpdateHumanReviewStatusForFindingAsync\(row\.TenantId, row\.FindingId, humanReview, row\.FindingRecordId, ct\)\r?\n            \.ConfigureAwait\(false\);\r?\n\r?\n        if \(updated == 0\)\r?\n\r?\n            _logger\.LogWarning\(\r?\n                "ITSM Jira webhook:.*?\r?\n        return new ItsmInboundWebhookProcessResult\(true, auditEvent\);\r?\n    \}\r?\n\r?\n    public async Task<ItsmInboundWebhookProcessResult> TryProcessServiceNowIncidentUpdateAsync'

if ($sync -notmatch 'TryClaimAsync\(row\.TenantId, "Jira"') {
    throw 'Jira TryClaimAsync replacement failed.'
}

if ($sync -match $jiraPattern) {
    $sync = [regex]::Replace($sync, $jiraPattern, ($jiraMutation + "`r`n    }`r`n`r`n    public async Task<ItsmInboundWebhookProcessResult> TryProcessServiceNowIncidentUpdateAsync"), 1)
}
else {
    throw 'Jira mutation block pattern not found.'
}

$serviceNowPattern = '(?s)        int updated = await _correlations\r?\n            \.UpdateHumanReviewStatusForFindingAsync\(row\.TenantId, row\.FindingId, humanReview, row\.FindingRecordId, ct\)\r?\n            \.ConfigureAwait\(false\);\r?\n\r?\n        if \(updated == 0\)\r?\n\r?\n            _logger\.LogWarning\(\r?\n                "ITSM ServiceNow webhook:.*?\r?\n        return new ItsmInboundWebhookProcessResult\(true, auditEvent\);\r?\n    \}\r?\n\r?\n    /// <summary>Factory used by'

if ($sync -match $serviceNowPattern) {
    $sync = [regex]::Replace($sync, $serviceNowPattern, ($serviceNowMutation + "`r`n    }`r`n`r`n    /// <summary>Factory used by"), 1)
}
else {
    throw 'ServiceNow mutation block pattern not found.'
}

Write-Utf8NoBom $syncPath $sync

Write-Host 'Applied ITSM replay TryClaimAsync fix to production files.'
