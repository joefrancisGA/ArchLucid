using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramEdgeLabelHumanizerTests
{
    [Theory]
    [InlineData(GraphEdgeTypes.PeersWith, "peering")]
    [InlineData(GraphEdgeTypes.ConnectsTo, "connects")]
    [InlineData(GraphEdgeTypes.Contains, "contains")]
    [InlineData(GraphEdgeTypes.ContainsResource, "contains")]
    [InlineData(GraphEdgeTypes.Protects, "protects")]
    [InlineData(GraphEdgeTypes.AppliesTo, "applies")]
    [InlineData(GraphEdgeTypes.RelatesTo, "relates to")]
    [InlineData(GraphEdgeTypes.DependsOn, "depends on")]
    [InlineData(GraphEdgeTypes.Exposes, "exposes")]
    [InlineData(GraphEdgeTypes.HasRole, "has role")]
    [InlineData(GraphEdgeTypes.UsesIdentity, "uses")]
    [InlineData(GraphEdgeTypes.CanRead, "Role allows read. This is not observed use.")]
    [InlineData(GraphEdgeTypes.CanWrite, "Role allows write. This is not observed use.")]
    [InlineData(GraphEdgeTypes.CanAssume, "can assume")]
    [InlineData(GraphEdgeTypes.CanControlCode, "Role can control code. This is not an observed deployment.")]
    [InlineData(GraphEdgeTypes.RoutesTo, "routes to")]
    [InlineData(GraphEdgeTypes.FederatesAs, "federates")]
    [InlineData(GraphEdgeTypes.MemberOf, "member of")]
    public void ResolveDisplayLabel_humanizes_known_graph_edge_types(string edgeType, string expected)
    {
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(null, edgeType).Should().Be(expected);
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(edgeType, edgeType).Should().Be(expected);
    }

    [Theory]
    [InlineData(AzureInventoryRelationshipAssociationTypes.VnetPeering, "peering")]
    [InlineData(GraphEdgeInferenceSources.InventoryVnetPeering, "peering")]
    [InlineData(GraphEdgeInferenceSources.InventoryNicSubnet, "in")]
    [InlineData(AzureInventoryRelationshipAssociationTypes.NicToSubnet, "in")]
    [InlineData(AzureInventoryRelationshipAssociationTypes.AdfLinkedService, "Linked service")]
    [InlineData(GraphEdgeInferenceSources.InventoryLogicAppConnection, "API connection")]
    [InlineData(GraphEdgeInferenceSources.InventoryDiagnosticSettingStorage, InventoryDiagramRelationshipLabelTexts.DiagnosticSettingNameNotStoredLogDeliveryNotObserved)]
    [InlineData(AzureInventoryRelationshipAssociationTypes.AdfLinkedServiceInferred, "No stored link; hostname or linked-service text was inferred.")]
    [InlineData(AzureInventoryRelationshipAssociationTypes.AdfReadsFrom, InventoryDiagramRelationshipLabelTexts.PipelineDatasetConfiguredReadObservedReadNotStored)]
    [InlineData(AzureInventoryRelationshipAssociationTypes.AdfWritesTo, InventoryDiagramRelationshipLabelTexts.PipelineDatasetConfiguredWriteObservedWriteNotStored)]
    [InlineData(GraphEdgeInferenceSources.InventoryAdfReadsFrom, InventoryDiagramRelationshipLabelTexts.PipelineDatasetConfiguredReadObservedReadNotStored)]
    [InlineData(GraphEdgeInferenceSources.InventoryAdfWritesTo, InventoryDiagramRelationshipLabelTexts.PipelineDatasetConfiguredWriteObservedWriteNotStored)]
    [InlineData(GraphEdgeInferenceSources.InventoryServiceConnectorLink, InventoryDiagramRelationshipLabelTexts.ServiceConnectorConfiguredLabel)]
    [InlineData(GraphEdgeInferenceSources.InventoryHostnameInferredTarget, InventoryDiagramRelationshipLabelTexts.HostnameInferredTargetLabel)]
    public void HumanizeLabel_maps_inventory_association_and_inference_aliases(string alias, string expected)
    {
        DiagramEdgeLabelHumanizer.HumanizeLabel(alias).Should().Be(expected);
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(null, null, alias).Should().Be(expected);
    }

    [Fact]
    public void ResolveDisplayLabel_uses_inference_source_when_label_and_type_are_blank()
    {
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
                null,
                string.Empty,
                GraphEdgeInferenceSources.InventoryVnetPeering)
            .Should()
            .Be("peering");
    }

    [Fact]
    public void ResolveDisplayLabel_maps_human_declared_connections_to_connects_verb()
    {
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
                null,
                GraphEdgeTypes.ConnectsTo,
                GraphEdgeInferenceSources.HumanDeclaredConnection)
            .Should()
            .Be("connects");
    }

    [Fact]
    public void HumanizeLabel_maps_may_access_to_authorized_access_honesty_label()
    {
        DiagramEdgeLabelHumanizer.HumanizeLabel(GraphEdgeTypes.MayAccess)
            .Should()
            .Be(InventoryDiagramRelationshipLabelTexts.AppAuthorizedAccessLabel);
    }

    [Fact]
    public void HumanizeLabel_preserves_custom_non_canonical_labels()
    {
        DiagramEdgeLabelHumanizer.HumanizeLabel("reads").Should().Be("reads");
    }

    [Fact]
    public void ResolveDisplayLabel_returns_relationship_not_stored_when_inputs_are_blank()
    {
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(null, null, null)
            .Should()
            .Be("Relationship was not stored");
    }

    [Fact]
    public void ResolveDisplayLabel_maps_event_hub_may_publish_and_qualified_capture()
    {
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
                null,
                GraphEdgeTypes.CanWrite,
                GraphEdgeInferenceSources.InventoryEventHubMayPublish)
            .Should()
            .Be("Authorization may allow publish. This is not observed messaging.");

        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
                null,
                GraphEdgeTypes.ConnectsTo,
                GraphEdgeInferenceSources.WithQualifier(
                    GraphEdgeInferenceSources.InventoryEventHubCapture,
                    "orders"))
            .Should()
            .Be($"orders · {InventoryDiagramRelationshipLabelTexts.CaptureConfiguredObservedCaptureNotStored}");
    }

    [Fact]
    public void ResolveDisplayLabel_maps_qualified_diagnostic_storage_setting_name()
    {
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
                null,
                null,
                GraphEdgeInferenceSources.WithQualifier(
                    GraphEdgeInferenceSources.InventoryDiagnosticSettingStorage,
                    "diag-storage"))
            .Should()
            .Be("diag-storage. Log delivery was not observed.");
    }

    [Theory]
    [InlineData(AzureInventoryRelationshipAssociationTypes.DiagnosticToDestination, InventoryDiagramRelationshipLabelTexts.DiagnosticSettingNameNotStoredLogDeliveryNotObserved)]
    [InlineData(GraphEdgeInferenceSources.InventoryDiagnosticDestination, InventoryDiagramRelationshipLabelTexts.DiagnosticSettingNameNotStoredLogDeliveryNotObserved)]
    [InlineData(AzureInventoryRelationshipAssociationTypes.DiagnosticSettingToStorage, InventoryDiagramRelationshipLabelTexts.DiagnosticSettingNameNotStoredLogDeliveryNotObserved)]
    [InlineData(AzureInventoryRelationshipAssociationTypes.AppAuthorizedAccess, InventoryDiagramRelationshipLabelTexts.AppAuthorizedAccessLabel)]
    [InlineData(GraphEdgeTypes.MayAccess, InventoryDiagramRelationshipLabelTexts.AppAuthorizedAccessLabel)]
    [InlineData(AzureInventoryRelationshipAssociationTypes.EventGridToDestination, InventoryDiagramRelationshipLabelTexts.EventSubscriptionNamesDestinationObservedDeliveryNotStored)]
    [InlineData(AzureInventoryRelationshipAssociationTypes.AdfTriggerSource, InventoryDiagramRelationshipLabelTexts.AdfTriggerConfiguredObservedRunNotStored)]
    [InlineData(AzureInventoryRelationshipAssociationTypes.AdfIntegrationRuntime, InventoryDiagramRelationshipLabelTexts.AdfIntegrationRuntimeConfiguredObservedRunNotStored)]
    [InlineData(AzureInventoryRelationshipAssociationTypes.EventHubCapture, InventoryDiagramRelationshipLabelTexts.CaptureConfiguredObservedCaptureNotStored)]
    [InlineData(AzureInventoryRelationshipAssociationTypes.AvdSessionHostToVm, "AVD session host")]
    public void HumanizeLabel_maps_diagram_enrichment_association_aliases(string alias, string expected)
    {
        DiagramEdgeLabelHumanizer.HumanizeLabel(alias).Should().Be(expected);
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(null, null, alias).Should().Be(expected);
    }

    [Fact]
    public void ResolveDisplayLabel_maps_qualified_diagnostic_destination_to_sends_diagnostics_sentence()
    {
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
                null,
                null,
                GraphEdgeInferenceSources.WithQualifier(
                    GraphEdgeInferenceSources.InventoryDiagnosticDestination,
                    "storage-account-logs"))
            .Should()
            .Be(InventoryDiagramRelationshipLabelTexts.FormatDiagnosticSettingDestinationLabel("storage-account-logs"));
    }
}
