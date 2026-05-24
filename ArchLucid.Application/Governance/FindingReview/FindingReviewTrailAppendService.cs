using System.Globalization;
using System.Text.Json;

using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Audit;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Application.Governance.FindingReview;

/// <inheritdoc cref = "IFindingReviewTrailAppendService"/>
public sealed class FindingReviewTrailAppendService(IFindingReviewTrailRepository trailRepository, IAuditService auditService)
    : IFindingReviewTrailAppendService
{
    private readonly IAuditService _auditService = auditService ?? throw new ArgumentNullException(nameof(auditService));
    private readonly IFindingReviewTrailRepository _trailRepository = trailRepository ?? throw new ArgumentNullException(nameof(trailRepository));

    /// <inheritdoc/>
    public async Task AppendAsync(FindingReviewEventRecord reviewEvent, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(reviewEvent);
        await _trailRepository.AppendAsync(reviewEvent, cancellationToken);
        string eventType = MapActionToAuditEventType(reviewEvent.Action);
        await _auditService.LogAsync(
            new AuditEvent
            {
                EventType = eventType,
                ActorUserId = reviewEvent.ReviewerUserId,
                ActorUserName = reviewEvent.ReviewerUserId,
                TenantId = reviewEvent.TenantId,
                WorkspaceId = reviewEvent.WorkspaceId,
                ProjectId = reviewEvent.ProjectId,
                RunId = reviewEvent.RunId,
                DataJson = JsonSerializer.Serialize(new
                {
                    reviewEvent.EventId,
                    reviewEvent.FindingId,
                    reviewEvent.Action,
                    reviewEvent.Notes,
                    reviewEvent.OccurredAtUtc
                }, AuditJsonSerializationOptions.Instance)
            }, cancellationToken);
    }

    private static string MapActionToAuditEventType(FindingReviewAction action)
    {
        return action switch
        {
            FindingReviewAction.Approve => AuditEventTypes.FindingReviewApproved,
            FindingReviewAction.Reject => AuditEventTypes.FindingReviewRejected,
            FindingReviewAction.Override => AuditEventTypes.FindingReviewOverridden,
            FindingReviewAction.Escalate => AuditEventTypes.FindingReviewOverridden,
            _ => throw new ArgumentOutOfRangeException(nameof(action), action,
                string.Create(CultureInfo.InvariantCulture,
                    $"Unsupported finding review Action '{action}'. Extend MapActionToAuditEventType when adding new verbs.")),
        };
    }
}
