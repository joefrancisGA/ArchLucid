namespace ArchLucid.Contracts.Findings;

/// <summary>
///     What the disappearance of a prior finding actually supports (TB-2194). Only meaningful when the lifecycle state
///     is <see cref="CrossReviewFindingLifecycleState.CandidateResolved" />.
///     <para>
///         The ladder is deliberately narrow. Absence in a later review is weak evidence on its own: it is informative
///         only if the newer review looked in the same places, and it becomes a remediation claim only when a person
///         recorded one. Nothing here asserts a re-scan proved a fix.
///     </para>
/// </summary>
public enum CrossReviewFindingResolutionBasis
{
    /// <summary>The finding is still present or newly identified, so there is no absence to interpret.</summary>
    NotApplicable = 0,

    /// <summary>
    ///     A reviewer recorded <see cref="FindingDisposition.Remediated" /> and the newer review no longer raises it,
    ///     with the producing analysis still covered. The strongest claim available without re-verifying the fix.
    /// </summary>
    ConfirmedByDisposition = 1,

    /// <summary>
    ///     No longer raised and the producing analysis still ran, but nobody recorded a remediation decision, so the
    ///     drop-out is unexplained rather than confirmed.
    /// </summary>
    Unverified = 2,

    /// <summary>
    ///     The analysis that produced the finding did not run in the newer review, so its absence says nothing at all.
    ///     This outranks any recorded disposition, because the corroborating observation is missing.
    /// </summary>
    AbsenceNotInformative = 3,
}
