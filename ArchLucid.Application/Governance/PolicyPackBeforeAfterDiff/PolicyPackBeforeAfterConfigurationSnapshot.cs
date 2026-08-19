namespace ArchLucid.Application.Governance.PolicyPackBeforeAfterDiff;

/// <summary>
///     Captured outputs for one configuration arm: findings, rule priority ordering, gate posture, and sponsor lines.
/// </summary>
public sealed class PolicyPackBeforeAfterConfigurationSnapshot
{
    public required string ConfigurationLabel { get; init; }

    public required string PriorityFloor { get; init; }

    public required IReadOnlyList<string> ActiveComplianceRuleKeysOrdered { get; init; }

    public required IReadOnlyList<PolicyPackBeforeAfterFindingLine> Findings { get; init; }

    public required bool GateBlocked { get; init; }

    public required IReadOnlyList<string> SponsorReportLines { get; init; }
}
