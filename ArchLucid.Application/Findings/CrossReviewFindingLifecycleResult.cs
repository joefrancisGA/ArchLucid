using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Per-finding lifecycle rows plus their aggregate counts for one review pair (TB-2194).
/// </summary>
public sealed class CrossReviewFindingLifecycleResult
{
    public required IReadOnlyList<CrossReviewFindingLifecycleRecord> Records
    {
        get;
        init;
    }

    public required CrossReviewFindingLifecycleSummary Summary
    {
        get;
        init;
    }
}
