namespace ArchLucid.Application.Runs.Finalization;

/// <summary>Server-side counts for finalize scorecard dimensions (TB-2321 / TB-2315 / TB-2179 / TB-2346).</summary>
public sealed record FinalizeQualityScorecardCounts(
    int BlockingFindingCount,
    int UncoveredMandatoryRequirementCount,
    int OpenDeferredCount,
    int OpenContradictionCount,
    int OpenCannotDetermineCount,
    int OpenVerifyHypothesisCount,
    int UnverifiedAssumptionCount,
    int LowExtractionConfidenceCount,
    int UnresolvedHighSeverityDispositionCount,
    int MissingRequiredCapabilityCount)
{
    public static FinalizeQualityScorecardCounts Empty { get; } = new(0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
}
