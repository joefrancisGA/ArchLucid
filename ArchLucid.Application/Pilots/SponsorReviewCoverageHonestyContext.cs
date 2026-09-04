using ArchLucid.Contracts.Architecture;

namespace ArchLucid.Application.Pilots;

/// <summary>Inputs for sponsor file-export coverage honesty (CD-15 / WA-08 parity with UI).</summary>
public sealed record SponsorReviewCoverageHonestyContext(
    string RunId,
    FeasibilityVerdict? Verdict,
    bool AnalysisStagesComplete,
    int ActorNodeCount);
