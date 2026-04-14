namespace ArchLucid.Application.Audit;

/// <summary>One audit row for operator pipeline timeline (run-scoped).</summary>
public sealed record RunPipelineTimelineItemDto(
    Guid EventId,
    DateTime OccurredUtc,
    string EventType,
    string ActorUserName,
    string? CorrelationId);
