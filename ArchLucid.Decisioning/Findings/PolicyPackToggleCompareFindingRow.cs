namespace ArchLucid.Decisioning.Findings;

/// <summary>One declaration finding row in the pack-toggle compare artifact.</summary>
public sealed class PolicyPackToggleCompareFindingRow
{
    public required string Posture { get; init; }

    public required string PackOrRuleKey { get; init; }

    public string? PriorityFloor { get; init; }

    public required string FindingTitle { get; init; }

    public required string PolicyRuleId { get; init; }
}
