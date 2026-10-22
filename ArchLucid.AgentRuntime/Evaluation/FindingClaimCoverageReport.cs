namespace ArchLucid.AgentRuntime.Evaluation;

/// <summary>
///     Result of evaluating whether findings from an agent result have acceptable evidence references
///     or are explicitly labeled as low-confidence heuristics.
/// </summary>
/// <param name="TotalFindingCount">Total number of findings evaluated.</param>
/// <param name="SupportedFindingCount">
///     Findings with at least one evidence reference (i.e. <c>EvidenceRefs</c> is non-empty).
/// </param>
/// <param name="HeuristicFindingCount">
///     Findings without evidence references but with an explicit low-confidence label
///     (i.e. <see cref="ArchLucid.Contracts.Findings.FindingConfidenceLevel.Low" />).
/// </param>
/// <param name="CoverageRatio">
///     Fraction of findings that are either supported or heuristic-labeled, in [0, 1].
///     1.0 when <see cref="TotalFindingCount" /> is zero (vacuously covered).
/// </param>
/// <param name="UnsupportedFindingIds">
///     IDs of findings that have no evidence references and no heuristic label.
///     These are the findings most likely to mislead an operator or sponsor.
/// </param>
public sealed record FindingClaimCoverageReport(
    int TotalFindingCount,
    int SupportedFindingCount,
    int HeuristicFindingCount,
    double CoverageRatio,
    IReadOnlyList<string> UnsupportedFindingIds);
