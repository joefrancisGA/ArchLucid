namespace ArchLucid.Application.Findings;

/// <summary>
///     Places every finding in a review pair on the lifecycle spine — newly identified, previously identified and still
///     present, or a candidate for resolution — and states what each resolution claim actually rests on (TB-2194).
/// </summary>
public interface ICrossReviewFindingLifecycleService
{
    Task<CrossReviewFindingLifecycleResult> BuildAsync(
        CrossReviewFindingLifecycleRequest request,
        CancellationToken cancellationToken = default);
}
