using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.ArtifactSynthesis.Compilers;

/// <summary>Labels AKS managed cluster to Kubernetes service load balancer edges (NR-39).</summary>
internal static class InventoryDiagramKubernetesServiceLoadBalancerRelationshipApplier
{
    public const string Label = InventoryDiagramRelationshipLabelTexts.KubernetesServiceLoadBalancerConfiguredObservedTrafficNotStored;

    public static void Apply(DiagramAst ast)
    {
        ArgumentNullException.ThrowIfNull(ast);

        foreach (DiagramEdge edge in ast.Edges.Where(edge => !edge.IsLayoutOnly))
        {
            if (!string.Equals(
                    edge.InferenceSource,
                    GraphEdgeInferenceSources.InventoryAksServiceLoadBalancer,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            edge.Label = Label;
            edge.ProvenanceKind = ProvenanceKind.DerivedFact.ToString();
        }
    }
}
