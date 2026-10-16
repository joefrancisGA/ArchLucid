using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventorySnapshotCitedHopPredicateTests
{
    [Fact]
    public void IsCitedHop_returns_true_for_logic_app_connection_and_false_for_adf_inferred()
    {
        GraphEdge cited = new()
        {
            EdgeType = AzureInventoryRelationshipAssociationTypes.LogicAppConnection,
            InferenceSource = GraphEdgeInferenceSources.InventoryLogicAppConnection,
        };
        GraphEdge inferred = new()
        {
            EdgeType = GraphEdgeTypes.ConnectsTo,
            InferenceSource = GraphEdgeInferenceSources.InventoryAdfLinkedServiceInferred,
            ProvenanceKind = ProvenanceKind.DeterministicInference.ToString(),
        };

        AzureInventorySnapshotCitedHopPredicate.IsCitedHop(cited).Should().BeTrue();
        AzureInventorySnapshotCitedHopPredicate.IsCitedHop(inferred).Should().BeFalse();
    }
}
