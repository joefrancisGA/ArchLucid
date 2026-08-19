namespace ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;

/// <summary>
///     Structured deltas between configuration A and B for sales/demo packaging.
/// </summary>
public sealed class PolicyPackBeforeAfterDiffChangeSet
{
    public required IReadOnlyList<string> AddedComplianceRuleKeys { get; init; }

    public required IReadOnlyList<string> RemovedComplianceRuleKeys { get; init; }

    public required IReadOnlyList<string> FindingsNewlyBlockingCommit { get; init; }

    public required IReadOnlyList<string> FindingsNoLongerBlockingCommit { get; init; }

    public required IReadOnlyList<string> SponsorReportLinesAdded { get; init; }

    public required IReadOnlyList<string> SponsorReportLinesRemoved { get; init; }

    public required bool GateBlockedFlipped { get; init; }
}
