using ArchLucid.Application.Governance.FindingReview;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

namespace ArchLucid.Application.Governance.FindingDisposition;

public sealed class FindingDispositionService(
    IFindingReviewTrailAppendService trailAppendService,
    IFindingReviewTrailRepository trailRepository) : IFindingDispositionService
{
    private readonly IFindingReviewTrailAppendService _trailAppendService =
        trailAppendService ?? throw new ArgumentNullException(nameof(trailAppendService));

    private readonly IFindingReviewTrailRepository _trailRepository =
        trailRepository ?? throw new ArgumentNullException(nameof(trailRepository));

    public async Task<FindingDispositionEventDto> RecordAsync(
        RecordFindingDispositionRequest request,
        ScopeContext scope,
        string reviewerUserId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(scope);

        if (string.IsNullOrWhiteSpace(reviewerUserId))
            throw new ArgumentException("Reviewer user id is required.", nameof(reviewerUserId));

        FindingDispositionValidation.Validate(request);

        FindingReviewEventRecord record = new()
        {
            EventId = Guid.NewGuid(),
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            FindingId = request.FindingId.Trim(),
            ReviewerUserId = reviewerUserId.Trim(),
            Action = FindingReviewAction.RecordDisposition,
            Notes = BuildDispositionNotes(request),
            OccurredAtUtc = TimeProvider.System.UtcNowDateTime(),
            RunId = request.RunId,
            Disposition = request.Disposition,
            RevisitDueUtc = request.Disposition == Disposition.Deferred ? request.RevisitDueUtc : null,
            EvidenceRequestText = request.Disposition == Disposition.NeedsEvidence
                && !string.IsNullOrWhiteSpace(request.EvidenceRequestText)
                ? request.EvidenceRequestText.Trim()
                : null,
        };

        await _trailAppendService.AppendAsync(record, cancellationToken);

        return ToDto(record);
    }

    public async Task<IReadOnlyList<FindingDispositionEventDto>> ListHistoryAsync(
        ScopeContext scope,
        string findingId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        if (scope.TenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(scope));

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("Finding id is required.", nameof(findingId));

        IReadOnlyList<FindingReviewEventRecord> events =
            await _trailRepository.ListByFindingAsync(scope.TenantId, findingId.Trim(), cancellationToken);

        List<FindingDispositionEventDto> result = [];

        foreach (FindingReviewEventRecord reviewEvent in events)
        {
            if (reviewEvent.WorkspaceId != scope.WorkspaceId || reviewEvent.ProjectId != scope.ProjectId)
                continue;

            if (reviewEvent.Disposition is null)
                continue;

            result.Add(ToDto(reviewEvent));
        }

        return result;
    }

    private static string? BuildDispositionNotes(RecordFindingDispositionRequest request)
    {
        string? rationale = string.IsNullOrWhiteSpace(request.Rationale) ? null : request.Rationale.Trim();

        if (request.Disposition != Disposition.Accepted)
            return rationale;

        string? tradeOff = string.IsNullOrWhiteSpace(request.TradeOffAcknowledgment)
            ? null
            : request.TradeOffAcknowledgment.Trim();

        if (tradeOff is null)
            return rationale;

        if (rationale is null)
            return $"Trade-off accepted: {tradeOff}";

        return $"{rationale}\n\nTrade-off accepted: {tradeOff}";
    }

    internal static FindingDispositionEventDto ToDto(FindingReviewEventRecord record)
    {
        return new FindingDispositionEventDto
        {
            EventId = record.EventId,
            FindingId = record.FindingId,
            Disposition = record.Disposition ?? throw new InvalidOperationException("Disposition is required on disposition events."),
            ReviewerUserId = record.ReviewerUserId,
            Rationale = record.Notes,
            RevisitDueUtc = record.RevisitDueUtc,
            EvidenceRequestText = record.EvidenceRequestText,
            OccurredAtUtc = record.OccurredAtUtc,
            RunId = record.RunId,
        };
    }
}
