using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public sealed partial class DeclarationPremiseConflictFindingEngine
{
    private static void EmitFindingsForNode(
        GraphSnapshot graphSnapshot,
        GraphNode topologyNode,
        IReadOnlySet<string> activeRuleIds,
        List<Finding> findings)
    {
        IReadOnlyList<DeclarationPremiseConflictSignal> signals = ClassifyNodeConflicts(graphSnapshot, topologyNode);

        string resourceLabel = string.IsNullOrWhiteSpace(topologyNode.Label)
            ? topologyNode.NodeId
            : topologyNode.Label;

        foreach (DeclarationPremiseConflictSignal signal in signals)
        {
            if (!DeclarationSignalPolicyGate.ShouldEmitTheme(signal.Theme, activeRuleIds))
                continue;

            GraphNode? intentNode = graphSnapshot.Nodes
                .FirstOrDefault(node => string.Equals(node.NodeId, signal.IntentNodeId, StringComparison.OrdinalIgnoreCase));

            string intentLabel = intentNode is null || string.IsNullOrWhiteSpace(intentNode.Label)
                ? signal.IntentNodeId
                : intentNode.Label;

            string? policyRuleId = DeclarationSignalPolicyGate.TryGetPolicyRuleId(signal.Theme, activeRuleIds);
            List<string> rulesApplied = policyRuleId is null
                ? ["declaration-premise-conflict", signal.ConflictKind]
                : [policyRuleId, signal.ConflictKind];

            findings.Add(new Finding
            {
                FindingSchemaVersion = FindingsSchema.CurrentFindingVersion,
                FindingType = "DeclarationPremiseConflictFinding",
                Category = "Security",
                EngineType = "declaration-premise-conflict",
                Severity = signal.IsNarrowApplicability ? FindingSeverity.Error : FindingSeverity.Warning,
                Title = $"{resourceLabel} declaration conflicts with {intentLabel} requirement",
                Rationale =
                    $"Declaration property '{signal.DeclarationPropertyKey}' is '{signal.DeclarationPropertyValue}', "
                    + $"but linked intent requires: \"{signal.IntentRequirementText}\".",
                DecisionConsequence =
                    "The review premise is invalid until the operator corrects the declaration or amends the baseline.",
                RelatedNodeIds = [topologyNode.NodeId, signal.IntentNodeId],
                RecommendedActions =
                [
                    "Align the declaration property with the stated security baseline or policy control, or update the intent node to reflect the actual posture.",
                ],
                PayloadType = nameof(DeclarationPremiseConflictFindingPayload),
                Payload = new DeclarationPremiseConflictFindingPayload
                {
                    ConflictKind = signal.ConflictKind,
                    DeclarationPropertyKey = signal.DeclarationPropertyKey,
                    DeclarationPropertyValue = signal.DeclarationPropertyValue,
                    IntentNodeId = signal.IntentNodeId,
                    IntentRequirementText = signal.IntentRequirementText,
                    IsNarrowApplicability = signal.IsNarrowApplicability,
                    TopologyNodeId = topologyNode.NodeId,
                },
                PolicyRuleId = policyRuleId,
                Trace = new ExplainabilityTrace
                {
                    GraphNodeIdsExamined = [topologyNode.NodeId, signal.IntentNodeId],
                    RulesApplied = rulesApplied,
                    DecisionsTaken =
                    [
                        signal.IsNarrowApplicability
                            ? "Narrow PROTECTS/APPLIES_TO edge linked declaration property to intent requirement."
                            : "Graph-wide intent fallback linked declaration property to intent requirement.",
                    ],
                },
            });
        }
    }
}
