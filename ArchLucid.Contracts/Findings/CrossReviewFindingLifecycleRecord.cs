using ArchLucid.Contracts.Common;

namespace ArchLucid.Contracts.Findings;

/// <summary>One finding's position across two correlated reviews, with the basis for whatever it claims (TB-2194).</summary>
public sealed class CrossReviewFindingLifecycleRecord
{
    public required CrossReviewFindingLifecycleState State
    {
        get;
        init;
    }

    public required CrossReviewFindingResolutionBasis ResolutionBasis
    {
        get;
        init;
    }

    /// <summary>Finding id in the prior review; null when newly identified.</summary>
    public string? PriorFindingId
    {
        get;
        init;
    }

    /// <summary>Finding id in the newer review; null when the finding dropped out.</summary>
    public string? CurrentFindingId
    {
        get;
        init;
    }

    /// <summary>
    ///     How the two sides were matched. <see cref="FindingCorrelationMethod.None" /> for unmatched findings, and
    ///     <see cref="FindingCorrelationMethod.MessageCategoryFuzzy" /> means a possible — not deterministic — identity.
    /// </summary>
    public required FindingCorrelationMethod CorrelationMethod
    {
        get;
        init;
    }

    public required FindingSeverity Severity
    {
        get;
        init;
    }

    public string Category
    {
        get;
        init;
    } = string.Empty;

    public string Message
    {
        get;
        init;
    } = string.Empty;

    /// <summary>The analysis that produced the finding, which is what coverage is judged against.</summary>
    public required AgentType SourceAgent
    {
        get;
        init;
    }

    /// <summary>Latest reviewer disposition recorded against the prior finding, when one exists.</summary>
    public FindingDisposition? LatestDisposition
    {
        get;
        init;
    }
}
