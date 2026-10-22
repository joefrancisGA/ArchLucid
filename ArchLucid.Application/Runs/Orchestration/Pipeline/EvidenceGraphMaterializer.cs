using ArchLucid.Contracts.Architecture;
using ArchLucid.KnowledgeGraph;
using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

/// <summary>
///     Wave-4 suggestion 40: materializes pinned evidence metadata onto Γ before graph-pure finding engines run.
/// </summary>
public interface IEvidenceGraphMaterializer
{
    void Materialize(GraphSnapshot graphSnapshot, FindingAnalysisContext? analysisContext);
}

public sealed class EvidenceGraphMaterializer : IEvidenceGraphMaterializer
{
    public void Materialize(GraphSnapshot graphSnapshot, FindingAnalysisContext? analysisContext)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        EvidenceGraphMaterializeInventoryGuard.EnsurePinnedEvidenceInventoryBoundOrThrow(
            analysisContext,
            analysisContext?.RunId.ToString("D") ?? "unknown");

        if (analysisContext?.EvidencePin is null)
            return;

        GraphNode? contextNode = graphSnapshot.Nodes.FirstOrDefault(node =>
            string.Equals(node.NodeType, GraphNodeTypes.ContextSnapshot, StringComparison.OrdinalIgnoreCase));

        if (contextNode is null)
            return;

        EvidencePackagePin pin = analysisContext.EvidencePin;

        if (pin.PackageId is Guid packageId)
            contextNode.Properties["evidencePackageId"] = packageId.ToString("D");

        if (pin.CollectionUtc is DateTime collectionUtc)
            contextNode.Properties["evidenceCollectionUtc"] = collectionUtc.ToString("O");

        if (!string.IsNullOrWhiteSpace(pin.Provider))
            contextNode.Properties["evidenceProvider"] = pin.Provider;
    }
}
