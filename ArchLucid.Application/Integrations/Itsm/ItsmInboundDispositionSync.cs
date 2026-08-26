using ArchLucid.Application.Governance.FindingDisposition;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Integrations;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Records finding dispositions from inbound ITSM webhooks when configured (TB-396).</summary>
public sealed class ItsmInboundDispositionSync(
    IFindingDispositionService dispositionService,
    ILogger<ItsmInboundDispositionSync> logger)
{
    private const string InboundSyncRationalePrefix = "ITSM inbound sync";

    private readonly IFindingDispositionService _dispositionService =
        dispositionService ?? throw new ArgumentNullException(nameof(dispositionService));

    private readonly ILogger<ItsmInboundDispositionSync> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<ItsmInboundDispositionSyncResult> TryRecordFromWebhookAsync(
        ItsmFindingCorrelationRecord row,
        FindingDisposition? mappedDisposition,
        string externalStatusLabel,
        string integrationActor,
        CancellationToken cancellationToken)
    {
        if (mappedDisposition is null)
            return ItsmInboundDispositionSyncResult.Skipped("disposition_unmapped");

        ScopeContext scope = new()
        {
            TenantId = row.TenantId,
            WorkspaceId = row.WorkspaceId,
            ProjectId = row.ProjectId,
        };

        IReadOnlyList<FindingDispositionEventDto> history =
            await _dispositionService
                .ListHistoryAsync(scope, row.FindingId, cancellationToken)
                .ConfigureAwait(false);

        FindingDispositionEventDto? latestEvent = history
            .OrderByDescending(static e => e.OccurredAtUtc)
            .FirstOrDefault();

        if (latestEvent?.Disposition == mappedDisposition)
            return ItsmInboundDispositionSyncResult.Skipped("disposition_unchanged", mappedDisposition);

        RecordFindingDispositionRequest request = new()
        {
            FindingId = row.FindingId,
            Disposition = mappedDisposition.Value,
            Rationale = $"{InboundSyncRationalePrefix}: external status '{externalStatusLabel.Trim()}'.",
        };

        try
        {
            FindingDispositionEventDto recorded =
                await _dispositionService
                    .RecordAsync(request, scope, integrationActor, cancellationToken)
                    .ConfigureAwait(false);

            return ItsmInboundDispositionSyncResult.FromRecorded(recorded.Disposition, recorded.EventId);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(
                ex,
                "ITSM inbound disposition sync skipped for tenant {TenantId} finding {FindingId}: validation failed for disposition {Disposition}.",
                row.TenantId,
                row.FindingId,
                mappedDisposition);

            return ItsmInboundDispositionSyncResult.Skipped("disposition_validation_failed", mappedDisposition);
        }
    }
}

public sealed record ItsmInboundDispositionSyncResult(
    bool WasRecorded,
    FindingDisposition? Disposition,
    Guid? DispositionEventId,
    string? SkipReason)
{
    public static ItsmInboundDispositionSyncResult Skipped(string reason, FindingDisposition? disposition = null) =>
        new(false, disposition, null, reason);

    public static ItsmInboundDispositionSyncResult FromRecorded(FindingDisposition disposition, Guid eventId) =>
        new(true, disposition, eventId, null);
}
