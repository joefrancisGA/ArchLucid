using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph.Models;

using ExplainabilityMarkers = ArchLucid.Decisioning.Findings.ExplainabilityTraceMarkers;

namespace ArchLucid.Decisioning.Findings.Factories;

public static class PolicyApplicabilityFindingFactory
{
    public static Finding CreatePolicyApplicabilityFinding(
        string engineType,
        GraphNode policyNode,
        string? policyReference,
        IReadOnlyList<string> applicableTopologyNodeIds,
        IReadOnlyList<string> graphNodeIdsExamined)
    {
        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "PolicyApplicabilityFinding",
            Category = "Policy",
            EngineType = engineType,
            Severity = FindingSeverity.Info,
            Title = $"Policy applicability: {policyNode.Label}",
            Rationale =
                "The knowledge graph links this policy control to one or more topology resources via APPLIES_TO edges.",
            RelatedNodeIds = graphNodeIdsExamined.Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
            PayloadType = nameof(PolicyApplicabilityFindingPayload),
            Payload = new PolicyApplicabilityFindingPayload
            {
                PolicyName = policyNode.Label,
                PolicyReference = policyReference,
                ApplicableTopologyResourceCount = applicableTopologyNodeIds.Count,
                ApplicableTopologyNodeIds = applicableTopologyNodeIds.ToList()
            },
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = graphNodeIdsExamined.Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
                RulesApplied = ["policy-applicability-mapping"],
                DecisionsTaken =
                    ["Interpreted APPLIES_TO edges as policy applicability to topology resources."],
                AlternativePathsConsidered = [ExplainabilityMarkers.RuleBasedDeterministicSinglePathNote],
                Notes = [$"Applicable topology targets: {applicableTopologyNodeIds.Count}"]
            }
        };
    }

    public static Finding CreatePolicyApplicabilityGapFinding(
        string engineType,
        GraphNode policyNode,
        string? policyReference,
        string gapRationale)
    {
        return new Finding
        {
            FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
            FindingType = "PolicyApplicabilityFinding",
            Category = "Policy",
            EngineType = engineType,
            Severity = FindingSeverity.Warning,
            Title = $"Policy has no topology applicability: {policyNode.Label}",
            Rationale = gapRationale,
            RelatedNodeIds = [policyNode.NodeId],
            PayloadType = nameof(PolicyApplicabilityFindingPayload),
            Payload = new PolicyApplicabilityFindingPayload
            {
                PolicyName = policyNode.Label, PolicyReference = policyReference, ApplicableTopologyResourceCount = 0, ApplicableTopologyNodeIds = []
            },
            Trace = new ExplainabilityTrace
            {
                GraphNodeIdsExamined = [policyNode.NodeId],
                RulesApplied = ["policy-applicability-gap"],
                DecisionsTaken = ["No APPLIES_TO edges from this policy to TopologyResource nodes were found."],
                AlternativePathsConsidered = [ExplainabilityMarkers.RuleBasedDeterministicSinglePathNote],
                Notes = [$"Policy: {policyNode.Label}"]
            }
        };
    }
}
