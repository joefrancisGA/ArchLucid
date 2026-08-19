using System.Text.Json;

using ArchLucid.Contracts.Drafts;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Drafts;

/// <inheritdoc cref="IDraftIntakeReaperService" />
public sealed class DraftIntakeReaperService(
    IDraftRequestRepository draftRepository,
    IPlatformAuditRepository platformAuditRepository,
    IOptionsMonitor<DraftIntakeReaperOptions> optionsMonitor,
    ILogger<DraftIntakeReaperService> logger) : IDraftIntakeReaperService
{
    private readonly IDraftRequestRepository _draftRepository =
        draftRepository ?? throw new ArgumentNullException(nameof(draftRepository));

    private readonly IPlatformAuditRepository _platformAuditRepository =
        platformAuditRepository ?? throw new ArgumentNullException(nameof(platformAuditRepository));

    private readonly IOptionsMonitor<DraftIntakeReaperOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    private readonly ILogger<DraftIntakeReaperService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<DraftIntakeReaperResult> PurgeExpiredTerminalDraftsAsync(
        DateTimeOffset updatedBeforeUtc,
        CancellationToken cancellationToken)
    {
        DraftIntakeReaperOptions opts = _optionsMonitor.CurrentValue;
        int batchSize = Math.Clamp(opts.BatchSize, 1, 10_000);
        int totalDeleted = 0;

        while (true)
        {
            DraftIntakeReaperBatchResult batch = await _draftRepository.HardDeleteTerminalDraftsBatchAsync(
                updatedBeforeUtc,
                batchSize,
                cancellationToken);

            if (batch.DeletedDraftIds.Count == 0)
                break;

            totalDeleted += batch.DeletedDraftIds.Count;

            if (batch.DeletedDraftIds.Count < batchSize)
                break;
        }

        if (totalDeleted == 0)
            return new DraftIntakeReaperResult { DraftsDeleted = 0 };

        string dataJson = JsonSerializer.Serialize(new { draftsDeleted = totalDeleted, trigger = "ttl_expiry" });

        await _platformAuditRepository.AppendAsync(
            new PlatformAuditEvent
            {
                EventType = AuditEventTypes.DraftIntakeTerminalPurged,
                ActorUserId = "system",
                ActorUserName = "draft-intake-reaper",
                SubjectTenantId = Guid.Empty,
                DataJson = dataJson,
            },
            cancellationToken);

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Draft intake reaper completed: {DraftsDeleted} terminal rows removed (cutoff={Cutoff:O}).",
                totalDeleted,
                updatedBeforeUtc);
        }

        return new DraftIntakeReaperResult { DraftsDeleted = totalDeleted };
    }
}
