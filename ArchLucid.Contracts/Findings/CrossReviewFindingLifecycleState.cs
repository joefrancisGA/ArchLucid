namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Where a finding sits relative to the prior review it was correlated against (TB-2194). Derived from
///     <see cref="CrossReviewFindingCorrelationResult" />; never asserts that a fix was verified.
/// </summary>
public enum CrossReviewFindingLifecycleState
{
    /// <summary>Present in the newer review with no correlated counterpart in the prior review.</summary>
    NewlyIdentified = 0,

    /// <summary>Correlated across both reviews, so the prior review raised it and the newer review still raises it.</summary>
    PreviouslyIdentifiedStillPresent = 1,

    /// <summary>
    ///     Raised by the prior review and not raised by the newer one. Deliberately "candidate": absence is not proof of
    ///     remediation, so <see cref="CrossReviewFindingResolutionBasis" /> records what the absence actually supports.
    /// </summary>
    CandidateResolved = 2,
}
