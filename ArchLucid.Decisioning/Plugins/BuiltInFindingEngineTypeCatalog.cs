using System.Collections.Frozen;

namespace ArchLucid.Decisioning.Plugins;

/// <summary>
///     Product <c>EngineType</c> identifiers registered in composition
///     (<c>IFindingEngine</c> and <c>IEffectfulFindingEngine</c>).
///     Plugin discovery skips these ids. Does not include
///     <c>ITechnologyConsistencyFindingEngine</c>.
/// </summary>
public static class BuiltInFindingEngineTypeCatalog
{
    /// <summary>
    ///     Simple implementation type name → <c>EngineType</c> for every engine registered
    ///     in <c>ServiceCollectionExtensions.Decisioning</c>.
    /// </summary>
    public static IReadOnlyDictionary<string, string> ImplementationTypeNameToEngineType { get; } =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["RequirementFindingEngine"] = "requirement",
            ["RequirementExpectationFindingEngine"] = "requirement-expectation",
            ["RequirementGapFindingEngine"] = "requirement-gap",
            ["RequirementCrossRunDiffFindingEngine"] = "requirement-cross-run-diff",
            ["DrRpoTopologyFindingEngine"] = "dr-rpo-topology",
            ["TopologyCoverageFindingEngine"] = "topology-coverage",
            ["TopologyStructureFindingEngine"] = "topology-structure",
            ["TopologyCrossRunDiffFindingEngine"] = "topology-cross-run-diff",
            ["TopologyAntiPatternFindingEngine"] = "topology-anti-pattern",
            ["SecurityBaselineFindingEngine"] = "security-baseline",
            ["SecurityBaselineExpectationFindingEngine"] = "security-baseline-expectation",
            ["SecurityBaselineCompletenessFindingEngine"] = "security-baseline-completeness",
            ["SecurityGapFindingEngine"] = "security-gap",
            ["SecurityCoverageFindingEngine"] = "security-coverage",
            ["ExternalExposureFindingEngine"] = "external-exposure",
            ["SegmentationSemanticsFindingEngine"] = "segmentation-semantics",
            ["TrustBoundaryFindingEngine"] = "trust-boundary",
            ["PrivilegedAccessFindingEngine"] = "privileged-access",
            ["IdentityBlastRadiusFindingEngine"] = "identity-blast-radius",
            ["PolicyApplicabilityFindingEngine"] = "policy-applicability",
            ["PolicyCoverageFindingEngine"] = "policy-coverage",
            ["RequirementCoverageFindingEngine"] = "requirement-coverage",
            ["RequiredCapabilityCoverageFindingEngine"] = "required-capability-coverage",
            ["ComplianceFindingEngine"] = "compliance",
            ["CostConstraintFindingEngine"] = "cost-constraint",
            ["CostBreachFindingEngine"] = "cost-breach",
            ["OrphanedAzureResourceFindingEngine"] = "orphaned-azure-resource",
            ["AdvisorCostRecommendationFindingEngine"] = "advisor-cost-recommendation",
            ["GraphAzureInventoryReconciliationFindingEngine"] = "azure-inventory-reconciliation",
            ["GraphAwsInventoryReconciliationFindingEngine"] = "aws-inventory-reconciliation",
            ["GraphGcpInventoryReconciliationFindingEngine"] = "gcp-inventory-reconciliation",
            ["OrphanedAwsResourceFindingEngine"] = "orphaned-aws-resource",
            ["OrphanedGcpResourceFindingEngine"] = "orphaned-gcp-resource",
            ["AwsCostRecommendationFindingEngine"] = "aws-cost-recommendation",
            ["GcpCostRecommendationFindingEngine"] = "gcp-cost-recommendation",
            ["AzureInventorySecurityBaselineFindingEngine"] = "azure-inventory-security-baseline",
            ["AwsInventorySecurityBaselineFindingEngine"] = "aws-inventory-security-baseline",
            ["GcpInventorySecurityBaselineFindingEngine"] = "gcp-inventory-security-baseline",
            ["DeclarationSecurityBaselineFindingEngine"] = "declaration-security-baseline",
            ["DeclarationPremiseConflictFindingEngine"] = "declaration-premise-conflict",
            ["OpenCommitmentFindingEngine"] = "open-commitment",
            ["PortfolioRecurrenceFindingEngine"] = "portfolio-recurrence",
            ["InsightGeneratorFindingEngine"] = "insight-generator",
        };

    /// <summary>Every product <c>EngineType</c> (ordinal ignore-case).</summary>
    public static FrozenSet<string> EngineTypeIds { get; } =
        ImplementationTypeNameToEngineType.Values.ToFrozenSet(StringComparer.OrdinalIgnoreCase);
}
