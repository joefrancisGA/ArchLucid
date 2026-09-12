namespace ArchLucid.Contracts.Governance;

/// <summary>Wire contract for finalize scorecard dimension counts (TB-2321).</summary>
public sealed class FinalizeQualityScorecardCountsDto
{
    public int BlockingFindingCount
    {
        get;
        init;
    }

    public int UncoveredMandatoryRequirementCount
    {
        get;
        init;
    }

    public int OpenDeferredCount
    {
        get;
        init;
    }

    public int OpenContradictionCount
    {
        get;
        init;
    }

    public int OpenCannotDetermineCount
    {
        get;
        init;
    }

    public int OpenVerifyHypothesisCount
    {
        get;
        init;
    }

    public int UnverifiedAssumptionCount
    {
        get;
        init;
    }

    public int LowExtractionConfidenceCount
    {
        get;
        init;
    }

    public int UnresolvedHighSeverityDispositionCount
    {
        get;
        init;
    }

    public int MissingRequiredCapabilityCount
    {
        get;
        init;
    }
}
