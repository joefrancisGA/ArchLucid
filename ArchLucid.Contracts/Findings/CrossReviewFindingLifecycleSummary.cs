namespace ArchLucid.Contracts.Findings;

/// <summary>
///     Roll-up of <see cref="CrossReviewFindingLifecycleRecord" /> counts for a review pair (TB-2194), split so a
///     confirmed remediation is never reported as the same thing as an unexplained drop-out.
/// </summary>
public sealed class CrossReviewFindingLifecycleSummary
{
    public int NewlyIdentifiedCount
    {
        get;
        init;
    }

    public int PreviouslyIdentifiedStillPresentCount
    {
        get;
        init;
    }

    /// <summary>Dropped out with a reviewer <see cref="FindingDisposition.Remediated" /> decision and covered analysis.</summary>
    public int ConfirmedResolvedCount
    {
        get;
        init;
    }

    /// <summary>Dropped out with covered analysis but no recorded remediation decision.</summary>
    public int UnverifiedResolvedCount
    {
        get;
        init;
    }

    /// <summary>Dropped out only because the producing analysis did not run in the newer review.</summary>
    public int AbsenceNotInformativeCount
    {
        get;
        init;
    }

    /// <summary>Every prior finding the newer review no longer raises, whatever the basis.</summary>
    public int CandidateResolvedCount =>
        ConfirmedResolvedCount + UnverifiedResolvedCount + AbsenceNotInformativeCount;

    /// <summary>Plain statement of what the counts do and do not prove; safe to render verbatim to operators.</summary>
    public string HonestyNote
    {
        get;
        init;
    } = string.Empty;
}
