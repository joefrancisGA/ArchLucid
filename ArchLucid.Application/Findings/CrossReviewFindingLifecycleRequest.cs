using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Findings;

/// <summary>
///     Inputs for one cross-review finding lifecycle pass (TB-2194).
///     <para>
///         <see cref="Correlation" /> is supplied rather than recomputed because both existing callers already hold one,
///         and correlating twice over the same finding sets would be wasted work. It must be the result of correlating
///         <see cref="PriorFindings" /> against <see cref="CurrentFindings" />.
///     </para>
/// </summary>
public sealed class CrossReviewFindingLifecycleRequest
{
    public required Guid TenantId
    {
        get;
        init;
    }

    public required IReadOnlyList<ArchitectureFinding> PriorFindings
    {
        get;
        init;
    }

    public required IReadOnlyList<ArchitectureFinding> CurrentFindings
    {
        get;
        init;
    }

    public required CrossReviewFindingCorrelationResult Correlation
    {
        get;
        init;
    }

    public required CrossReviewFindingSourceCoverage SourceCoverage
    {
        get;
        init;
    }

    /// <summary>
    ///     Lower bound for the disposition trail lookup. The prior review's creation time is the natural value: a
    ///     disposition cannot have been recorded against one of its findings before the review produced them.
    /// </summary>
    public required DateTimeOffset DispositionsSinceUtc
    {
        get;
        init;
    }
}
