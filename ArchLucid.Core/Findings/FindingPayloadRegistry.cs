using ArchLucid.Contracts.Findings.Payloads;

namespace ArchLucid.Core.Findings;

public static class FindingPayloadRegistry
{
    private static readonly Dictionary<string, Type> ByPayloadTypeName = new(StringComparer.OrdinalIgnoreCase)
    {
        [nameof(RequirementFindingPayload)] = typeof(RequirementFindingPayload),
        [nameof(TopologyGapFindingPayload)] = typeof(TopologyGapFindingPayload),
        [nameof(SecurityControlFindingPayload)] = typeof(SecurityControlFindingPayload),
        [nameof(CostConstraintFindingPayload)] = typeof(CostConstraintFindingPayload),
        [nameof(CostBreachFindingPayload)] = typeof(CostBreachFindingPayload),
        [nameof(InventoryReconciliationFindingPayload)] = typeof(InventoryReconciliationFindingPayload),
        [nameof(PolicyApplicabilityFindingPayload)] = typeof(PolicyApplicabilityFindingPayload),
        [nameof(TopologyCoverageFindingPayload)] = typeof(TopologyCoverageFindingPayload),
        [nameof(SecurityCoverageFindingPayload)] = typeof(SecurityCoverageFindingPayload),
        [nameof(PolicyCoverageFindingPayload)] = typeof(PolicyCoverageFindingPayload),
        [nameof(RequirementCoverageFindingPayload)] = typeof(RequirementCoverageFindingPayload),
        [nameof(RequirementExpectationFindingPayload)] = typeof(RequirementExpectationFindingPayload),
        [nameof(SecurityBaselineExpectationFindingPayload)] = typeof(SecurityBaselineExpectationFindingPayload),
        [nameof(SecurityBaselineCompletenessFindingPayload)] = typeof(SecurityBaselineCompletenessFindingPayload),
        [nameof(ComplianceFindingPayload)] = typeof(ComplianceFindingPayload),
        [nameof(ExtractorOrphanCandidateFindingPayload)] = typeof(ExtractorOrphanCandidateFindingPayload),
        [nameof(AdvisorCostRecommendationFindingPayload)] = typeof(AdvisorCostRecommendationFindingPayload)
    };

    public static IReadOnlyDictionary<string, Type> RegisteredTypes => ByPayloadTypeName;

    public static Type? ResolvePayloadType(string? payloadTypeName)
    {
        return string.IsNullOrWhiteSpace(payloadTypeName) ? null : ByPayloadTypeName.GetValueOrDefault(payloadTypeName);
    }
}
