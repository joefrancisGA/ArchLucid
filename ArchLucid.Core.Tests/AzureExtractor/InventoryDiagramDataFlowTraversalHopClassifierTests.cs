using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class InventoryDiagramDataFlowTraversalHopClassifierTests
{
    [Fact]
    public void IsExcludedTraversalAnnotation_treats_diagnostic_setting_to_storage_as_annotation()
    {
        InventoryDiagramDataFlowTraversalHopClassifier.IsExcludedTraversalAnnotation(
                AzureInventoryRelationshipAssociationTypes.DiagnosticSettingToStorage,
                null)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsExcludedTraversalAnnotation_treats_diagnostic_setting_storage_inference_as_annotation()
    {
        InventoryDiagramDataFlowTraversalHopClassifier.IsExcludedTraversalAnnotation(
                null,
                GraphEdgeInferenceSources.InventoryDiagnosticSettingStorage)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void IsTraversalHopAssociation_excludes_diagnostic_setting_to_storage()
    {
        InventoryDiagramDataFlowTraversalHopClassifier.IsTraversalHopAssociation(
                AzureInventoryRelationshipAssociationTypes.DiagnosticSettingToStorage,
                GraphEdgeInferenceSources.InventoryDiagnosticSettingStorage)
            .Should()
            .BeFalse();
    }
}
