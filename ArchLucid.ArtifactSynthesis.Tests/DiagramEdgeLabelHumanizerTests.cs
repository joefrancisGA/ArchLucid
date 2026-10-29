using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class DiagramEdgeLabelHumanizerTests
{
    [Fact]
    public void ResolveDisplayLabel_observed_dependency_without_window_stores_honesty_suffix()
    {
        DiagramEdgeLabelHumanizer
            .ResolveDisplayLabel(
                null,
                GraphEdgeTypes.CanRead,
                GraphEdgeInferenceSources.InventoryObservedDependency)
            .Should()
            .Be(
                $"{InventoryDiagramRelationshipLabelTexts.ObservedInLogsReadLabel} {InventoryDiagramRelationshipLabelTexts.ObservedInLogsDiagnosticTimeWindowNotStored}");
    }

    [Fact]
    public void ResolveDisplayLabel_observed_dependency_with_window_omits_missing_window_suffix()
    {
        Dictionary<string, string> properties = new(StringComparer.OrdinalIgnoreCase)
        {
            [AzureInventoryObservedDependencyEdgePropertyKeys.WindowStartUtc] = "2026-01-01T00:00:00Z",
            [AzureInventoryObservedDependencyEdgePropertyKeys.WindowEndUtc] = "2026-01-02T00:00:00Z",
        };

        DiagramEdgeLabelHumanizer
            .ResolveDisplayLabel(
                null,
                GraphEdgeTypes.CanRead,
                GraphEdgeInferenceSources.InventoryObservedDependency,
                properties)
            .Should()
            .Be(InventoryDiagramRelationshipLabelTexts.ObservedInLogsReadLabel);
    }

    [Fact]
    public void ResolveDisplayLabel_unknown_edge_type_without_stored_label_uses_relationship_label_omission_copy()
    {
        DiagramEdgeLabelHumanizer
            .ResolveDisplayLabel(null, "CUSTOM_EDGE_TOKEN")
            .Should()
            .Be(DiagramConnectionTypeAnnotator.RelationshipLabelNotStoredLabel);
    }

    [Theory]
    [InlineData("in", InventoryDiagramRelationshipLabelTexts.SubnetPlacementStoredReachabilityNotObserved)]
    [InlineData(GraphEdgeTypes.PeersWith, InventoryDiagramRelationshipLabelTexts.PeeringRemoteNetworkIdStoredPeeringStateNotStored)]
    [InlineData(GraphEdgeTypes.ConnectsTo, InventoryDiagramRelationshipLabelTexts.ConnectionStoredObservedTrafficNotStoredLabel)]
    [InlineData(GraphEdgeTypes.Contains, DiagramRelationshipVerbCatalog.InventoryDiagramLayoutContainsLabel)]
    [InlineData(GraphEdgeTypes.ContainsResource, DiagramRelationshipVerbCatalog.InventoryDiagramLayoutContainsLabel)]
    [InlineData(GraphEdgeTypes.Protects, InventoryDiagramRelationshipLabelTexts.ProtectionLinkStoredObservedProtectionNotStored)]
    [InlineData(GraphEdgeTypes.AppliesTo, InventoryDiagramRelationshipLabelTexts.AppliesToLinkStoredEnforcementNotObserved)]
    [InlineData(GraphEdgeTypes.RelatesTo, InventoryDiagramRelationshipLabelTexts.RelatesToStoredNotSpecificLabel)]
    [InlineData(GraphEdgeTypes.DependsOn, InventoryDiagramRelationshipLabelTexts.DependencyStoredObservedUseNotStoredLabel)]
    [InlineData(GraphEdgeTypes.Exposes, "Exposure target was stored. A public IP attachment was not stored.")]
    [InlineData(GraphEdgeTypes.HasRole, "Role is assigned. Observed use was not stored.")]
    [InlineData(GraphEdgeTypes.UsesIdentity, "Identity is assigned. Use of that identity was not stored.")]
    [InlineData(GraphEdgeTypes.CanRead, "Role allows read. This is not observed use.")]
    [InlineData(GraphEdgeTypes.CanWrite, "Role allows write. This is not observed use.")]
    [InlineData(GraphEdgeTypes.CanAssume, "May assume this identity. An assumption was not observed.")]
    [InlineData(GraphEdgeTypes.CanControlCode, "Role can control code. This is not an observed deployment.")]
    [InlineData(GraphEdgeTypes.RoutesTo, InventoryDiagramRelationshipLabelTexts.RouteStoredObservedTrafficNotStoredLabel)]
    [InlineData(GraphEdgeTypes.FederatesAs, "Federated credential is configured. This is not an observed sign-in.")]
    [InlineData(GraphEdgeTypes.MemberOf, InventoryDiagramRelationshipLabelTexts.MemberOfStoredObservedUseNotStoredLabel)]
    public void ResolveDisplayLabel_humanizes_known_graph_edge_types(string edgeType, string expected)
    {
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(null, edgeType).Should().Be(expected);
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(edgeType, edgeType).Should().Be(expected);
    }

    [Theory]
    [InlineData(AzureInventoryRelationshipAssociationTypes.VnetPeering, InventoryDiagramRelationshipLabelTexts.PeeringRemoteNetworkIdStoredPeeringStateNotStored)]
    [InlineData(GraphEdgeInferenceSources.InventoryVnetPeering, InventoryDiagramRelationshipLabelTexts.PeeringRemoteNetworkIdStoredPeeringStateNotStored)]
    [InlineData(GraphEdgeInferenceSources.InventoryNicSubnet, InventoryDiagramRelationshipLabelTexts.SubnetPlacementStoredReachabilityNotObserved)]
    [InlineData(AzureInventoryRelationshipAssociationTypes.NicToSubnet, InventoryDiagramRelationshipLabelTexts.SubnetPlacementStoredReachabilityNotObserved)]
    [InlineData(
        AzureInventoryRelationshipAssociationTypes.AdfLinkedService,
        InventoryDiagramRelationshipLabelTexts.PipelineLinkedServiceConfiguredObservedRunNotStored)]
    [InlineData(GraphEdgeInferenceSources.InventoryLogicAppConnection, "API connection name was not stored.")]
    [InlineData(
        GraphEdgeInferenceSources.InventoryDiagnosticSettingStorage,
        InventoryDiagramRelationshipLabelTexts.DiagnosticSettingNameNotStoredLogDeliveryNotObserved)]
    [InlineData(AzureInventoryRelationshipAssociationTypes.AdfLinkedServiceInferred, "No stored link; hostname or linked-service text was inferred.")]
    [InlineData(AzureInventoryRelationshipAssociationTypes.AdfReadsFrom, InventoryDiagramRelationshipLabelTexts.PipelineDatasetConfiguredReadObservedReadNotStored)]
    [InlineData(AzureInventoryRelationshipAssociationTypes.AdfWritesTo, InventoryDiagramRelationshipLabelTexts.PipelineDatasetConfiguredWriteObservedWriteNotStored)]
    [InlineData(GraphEdgeInferenceSources.InventoryAdfReadsFrom, InventoryDiagramRelationshipLabelTexts.PipelineDatasetConfiguredReadObservedReadNotStored)]
    [InlineData(GraphEdgeInferenceSources.InventoryAdfWritesTo, InventoryDiagramRelationshipLabelTexts.PipelineDatasetConfiguredWriteObservedWriteNotStored)]
    public void HumanizeLabel_maps_inventory_association_and_inference_aliases(string alias, string expected)
    {
        DiagramEdgeLabelHumanizer.HumanizeLabel(alias).Should().Be(expected);
    }

    [Fact]
    public void ResolveDisplayLabel_topology_exposes_does_not_claim_public_ip_attachment()
    {
        DiagramEdgeLabelHumanizer
            .ResolveDisplayLabel(null, GraphEdgeTypes.Exposes, GraphEdgeInferenceSources.TopologyExposes)
            .Should()
            .Be("Exposure target was stored. A public IP attachment was not stored.");
    }

    [Fact]
    public void ResolveDisplayLabel_inventory_public_ip_labels_attachment_without_observed_traffic()
    {
        DiagramEdgeLabelHumanizer
            .ResolveDisplayLabel(null, GraphEdgeTypes.Exposes, GraphEdgeInferenceSources.InventoryPublicIp)
            .Should()
            .Be(InventoryDiagramRelationshipLabelTexts.PublicIpAttachedObservedTrafficNotStored);
    }

    [Fact]
    public void ResolveDisplayLabel_security_single_topology_fallback_is_not_protects()
    {
        DiagramEdgeLabelHumanizer
            .ResolveDisplayLabel(null, GraphEdgeTypes.Protects, GraphEdgeInferenceSources.SecuritySingleTopologyFallback)
            .Should()
            .Be("No protected-node list was stored. This line is not a stored protection.");
    }

    [Fact]
    public void ResolveDisplayLabel_uses_inference_source_when_label_and_type_are_blank()
    {
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
                null,
                string.Empty,
                GraphEdgeInferenceSources.InventoryVnetPeering)
            .Should()
            .Be(InventoryDiagramRelationshipLabelTexts.PeeringRemoteNetworkIdStoredPeeringStateNotStored);
    }

    [Fact]
    public void ResolveDisplayLabel_maps_human_declared_connections_to_operator_confirmed_label()
    {
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
                null,
                GraphEdgeTypes.ConnectsTo,
                GraphEdgeInferenceSources.HumanDeclaredConnection)
            .Should()
            .Be(InventoryDiagramRelationshipLabelTexts.OperatorConfirmedConnectionLabel);
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
            .Be(DiagramConnectionTypeAnnotator.RelationshipLabelNotStoredLabel);
    }

    [Fact]
    public void ResolveDisplayLabel_maps_event_hub_may_publish_and_qualified_capture()
    {
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
                null,
                null,
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
    [InlineData(AzureInventoryRelationshipAssociationTypes.AvdSessionHostToVm, InventoryDiagramRelationshipLabelTexts.AvdSessionHostStoredObservedSessionNotStoredLabel)]
    [InlineData(GraphEdgeInferenceSources.InventoryFirewallSubnet, "Firewall subnet association. This is not observed filtering.")]
    [InlineData(AzureInventoryRelationshipAssociationTypes.FirewallToSubnet, "Firewall subnet association. This is not observed filtering.")]
    public void HumanizeLabel_maps_diagram_enrichment_association_aliases(string alias, string expected)
    {
        DiagramEdgeLabelHumanizer.HumanizeLabel(alias).Should().Be(expected);
    }

    [Fact]
    public void ResolveDisplayLabel_maps_bare_likely_stored_label_to_inferred_outline_sentence()
    {
        DiagramEdgeLabelHumanizer
            .ResolveDisplayLabel("Likely", GraphEdgeTypes.ConnectsTo, GraphEdgeInferenceSources.InventoryHostnameInferredTarget)
            .Should()
            .Be(InventoryDiagramLikelyRelationshipApplier.AdfHostnameOutlineSentence);

        DiagramEdgeLabelHumanizer
            .ResolveDisplayLabel("Likely", GraphEdgeTypes.ConnectsTo, null)
            .Should()
            .Be(InventoryDiagramLikelyRelationshipApplier.OutlineSentence);
    }

    [Fact]
    public void ResolveDisplayLabel_maps_bare_routes_to_stored_label_to_route_honesty_copy()
    {
        DiagramEdgeLabelHumanizer
            .ResolveDisplayLabel("Routes to", GraphEdgeTypes.RoutesTo, GraphEdgeInferenceSources.InventoryAgwBackend)
            .Should()
            .Be(InventoryDiagramRelationshipLabelTexts.RouteStoredObservedTrafficNotStoredLabel);
    }

    [Fact]
    public void HumanizeLabel_maps_agw_backend_alias_to_route_honesty_copy()
    {
        DiagramEdgeLabelHumanizer
            .HumanizeLabel(AzureInventoryRelationshipAssociationTypes.AgwToBackend)
            .Should()
            .Be(InventoryDiagramRelationshipLabelTexts.RouteStoredObservedTrafficNotStoredLabel);
    }

    [Fact]
    public void ResolveDisplayLabel_observed_dependency_without_direction_is_explicit_about_missing_read_write()
    {
        DiagramEdgeLabelHumanizer.ResolveDisplayLabel(
                null,
                GraphEdgeTypes.ConnectsTo,
                GraphEdgeInferenceSources.InventoryObservedDependency)
            .Should()
            .Be(
                "Observed dependency. Read/write direction was not stored. Diagnostic time window was not stored.");
    }

    [Fact]
    public void HumanizeLabel_maps_private_endpoint_target_separately_from_subnet_placement()
    {
        DiagramEdgeLabelHumanizer.HumanizeLabel(AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget)
            .Should()
            .Be(InventoryDiagramRelationshipLabelTexts.PrivateEndpointTargetStoredReachabilityNotObserved);

        DiagramEdgeLabelHumanizer.HumanizeLabel(AzureInventoryRelationshipAssociationTypes.PeToSubnet)
            .Should()
            .Be(InventoryDiagramRelationshipLabelTexts.SubnetPlacementStoredReachabilityNotObserved);
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
