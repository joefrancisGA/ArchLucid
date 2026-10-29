using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Analysis;

/// <summary>
///     Copy and scope-metadata detection for workload-conditioned expectation engines when
///     required capabilities, topology hints, and constraints were not stored on the context snapshot.
/// </summary>
public static class WorkloadScopeExpectationHonesty
{
    public const string TopologyLegacyDefaultNote =
        "Required capabilities, topology hints, and constraints were not stored on the context snapshot; expected topology pillars use the engine legacy four-pillar default (not workload scope metadata).";

    public const string RequirementThemeLegacyDefaultNote =
        "Scope metadata was not stored on the context snapshot; expected requirement themes use the engine baseline default (traceability, availability) plus any policy-stamped themes — not workload-conditioned scope signals.";

    public const string SecurityFamilyLegacyDefaultNote =
        "Scope metadata was not stored on the context snapshot; expected security control families use the engine baseline default (identity-access, network-isolation, logging-monitoring) plus any policy-stamped families — not workload-conditioned scope signals.";

    public static bool HasWorkloadScopeMetadata(GraphSnapshot graphSnapshot)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        GraphNode? contextNode = graphSnapshot.Nodes.FirstOrDefault(n =>
            string.Equals(n.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase));

        return HasWorkloadScopeMetadata(contextNode);
    }

    public static bool HasWorkloadScopeMetadata(GraphNode? contextNode)
    {
        if (contextNode is null)
        {
            return false;
        }

        return TopologyExpectedCategoryResolver.CollectScopeTokens(contextNode).Count > 0;
    }

    public static string DescribeTopologyCoverageRationale(bool hasScopeMetadata) =>
        hasScopeMetadata
            ? "Stored scope metadata (and any policy-stamped categories) imply topology pillars that are not represented in the graph."
            : TopologyLegacyDefaultNote;

    public static string DescribeRequirementExpectationRationale(bool hasScopeMetadata) =>
        hasScopeMetadata
            ? "Stored scope metadata implies requirement themes that are not represented by requirement nodes in the graph."
            : RequirementThemeLegacyDefaultNote;

    public static string DescribeSecurityBaselineCompletenessRationale(bool hasScopeMetadata) =>
        hasScopeMetadata
            ? "Stored scope metadata implies security control families that are not represented by active security baseline PROTECTS coverage."
            : SecurityFamilyLegacyDefaultNote;

    public static string DescribeSecurityBaselineExpectationRationale(bool hasScopeMetadata) =>
        hasScopeMetadata
            ? "Workload-expected topology categories from stored scope metadata lack any protected resources linked by security baseline PROTECTS edges."
            : "Workload-expected topology categories use the engine legacy four-pillar default because scope metadata was not stored; missing PROTECTS coverage is measured against that default, not stored workload scope.";

    public static IReadOnlyList<string> TopologyCoverageRecommendedActions(bool hasScopeMetadata) =>
        hasScopeMetadata
            ? ["Add missing topology categories to the architecture input."]
            :
            [
                "Add required capabilities, topology hints, or constraints on the context snapshot when the workload legitimately expects specific pillars.",
                "Otherwise record in review notes that the legacy four-pillar default applies for this intake."
            ];

    public static IReadOnlyList<string> RequirementExpectationRecommendedActions(bool hasScopeMetadata) =>
        hasScopeMetadata
            ? ["Add requirement nodes that cover the missing workload-conditioned themes."]
            :
            [
                "Add scope metadata when the workload legitimately expects themes beyond the engine baseline default.",
                "Add requirement nodes for each theme you intend to track when keeping the baseline default."
            ];

    public static IReadOnlyList<string> SecurityBaselineCompletenessRecommendedActions(bool hasScopeMetadata) =>
        hasScopeMetadata
            ? ["Add or extend security baseline controls with PROTECTS edges for each missing control family."]
            :
            [
                "Add scope metadata when the workload legitimately expects control families beyond the engine baseline default.",
                "Add security baseline PROTECTS coverage for each family you intend to enforce when keeping the baseline default."
            ];

    public static IReadOnlyList<string> SecurityBaselineExpectationRecommendedActions(bool hasScopeMetadata) =>
        hasScopeMetadata
            ? ["Add or extend security baseline PROTECTS mappings for resources in the missing categories."]
            :
            [
                "Add scope metadata when the workload legitimately omits topology pillars from the legacy four-pillar default.",
                "Add PROTECTS edges for categories you still expect when the default applies."
            ];
}
