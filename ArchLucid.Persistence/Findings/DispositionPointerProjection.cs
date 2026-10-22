using ArchLucid.Contracts.Findings;

namespace ArchLucid.Persistence.Findings;

internal readonly record struct DispositionPointerProjection(
    FindingDisposition? LatestDisposition,
    DateTimeOffset? LatestDispositionOccurredAtUtc,
    Guid? LatestDispositionEventId,
    string? LatestDispositionRowVersionBase64,
    string? LatestDispositionReviewerUserId,
    DateTimeOffset? RevisitDueUtc);
