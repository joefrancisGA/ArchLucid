namespace ArchLucid.Decisioning.Findings;

/// <summary>Captured declaration findings for filtered rule-key and bundled P1 pack postures.</summary>
public sealed class PolicyPackToggleCompareSnapshot
{
    public required IReadOnlyList<PolicyPackToggleCompareFindingRow> FilteredRuleKeyRows { get; init; }

    public required IReadOnlyList<PolicyPackToggleCompareFindingRow> BundledP1Rows { get; init; }
}
