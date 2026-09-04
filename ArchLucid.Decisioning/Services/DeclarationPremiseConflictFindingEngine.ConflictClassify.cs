using ArchLucid.Decisioning.Analysis;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Decisioning.Models;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Services;

public sealed partial class DeclarationPremiseConflictFindingEngine
{
    private static IReadOnlyList<DeclarationPremiseConflictSignal> ClassifyNodeConflicts(
        GraphSnapshot graphSnapshot,
        GraphNode topologyNode)
    {
        IReadOnlyList<ApplicableIntentNode> applicableIntentNodes = ResolveApplicableIntentNodes(graphSnapshot, topologyNode);
        return DeclarationPremiseConflictClassifier.Classify(topologyNode, applicableIntentNodes);
    }
}
