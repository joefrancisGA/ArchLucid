namespace ArchLucid.Application.Runs.Finalization;

/// <summary>Server-side counts for the five finalize scorecard dimensions (TB-2321).</summary>
public sealed record FinalizeQualityScorecardCounts(
    int UncoveredMandatoryRequirementCount,
    int OpenCannotDetermineCount,
    int UnverifiedAssumptionCount,
    int LowExtractionConfidenceCount,
    int UnresolvedHighSeverityDispositionCount)
{
    public static FinalizeQualityScorecardCounts Empty { get; } = new(0, 0, 0, 0, 0);
}
