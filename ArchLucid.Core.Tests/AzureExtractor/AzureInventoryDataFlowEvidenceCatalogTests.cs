using System.Reflection;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Suite", "Core")]
public sealed class AzureInventoryDataFlowEvidenceCatalogTests
{
    [Fact]
    public void AllIncludedOnDataFlow_types_are_known_association_types()
    {
        foreach (AzureInventoryDataFlowEvidenceAssociation row in AzureInventoryDataFlowEvidenceCatalog.AllIncludedOnDataFlow)
        {
            AzureInventoryRelationshipAssociationTypes.IsKnown(row.AssociationType).Should().BeTrue(
                because: $"{row.AssociationType} must exist in the IE-RF catalog");
        }
    }

    [Theory]
    [InlineData(
        AzureInventoryRelationshipAssociationTypes.EventGridToDestination,
        InventoryDiagramRelationshipLabelTexts.EventSubscriptionNamesDestinationObservedDeliveryNotStored)]
    [InlineData(
        AzureInventoryRelationshipAssociationTypes.EventHubCapture,
        InventoryDiagramRelationshipLabelTexts.CaptureConfiguredObservedCaptureNotStored)]
    public void Event_grid_and_event_hub_capture_use_honesty_labels(string associationType, string expectedLabel)
    {
        AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(associationType, out AzureInventoryDataFlowEvidenceAssociation? evidence)
            .Should()
            .BeTrue();
        evidence!.DiagramLabel.Should().Be(expectedLabel);
    }

    [Fact]
    public void AppToKeyVaultRef_uses_key_vault_honesty_label()
    {
        bool found = AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(
            AzureInventoryRelationshipAssociationTypes.AppToKeyVaultRef,
            out AzureInventoryDataFlowEvidenceAssociation? evidence);

        found.Should().BeTrue();
        evidence!.DiagramLabel.Should().Be(InventoryDiagramRelationshipLabelTexts.AppToKeyVaultRefLabel);
        evidence.DiagramLabel.Should().NotBe("May access");
    }

    [Fact]
    public void OperatorConfirmedConnection_uses_operator_confirmed_honesty_label()
    {
        AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(
            AzureInventoryRelationshipAssociationTypes.OperatorConfirmedConnection,
            out AzureInventoryDataFlowEvidenceAssociation? evidence).Should().BeTrue();

        evidence!.Family.Should().Be(AzureInventoryDataFlowEvidenceFamily.HumanConfirmed);
        evidence.DiagramLabel.Should().Be(InventoryDiagramRelationshipLabelTexts.OperatorConfirmedConnectionLabel);
        evidence.DiagramLabel.Should().NotBe("Confirmed connection");
    }

    [Fact]
    public void AppAuthorizedAccess_maps_to_authorized_access_not_reads_from()
    {
        bool found = AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(
            AzureInventoryRelationshipAssociationTypes.AppAuthorizedAccess,
            out AzureInventoryDataFlowEvidenceAssociation? evidence);

        found.Should().BeTrue();
        evidence!.Family.Should().Be(AzureInventoryDataFlowEvidenceFamily.AuthorizedAccess);
        evidence.DefaultBand.Should().Be(PathConfidenceBand.Probable);
        evidence.Direction.Should().Be(AzureInventoryDataFlowEdgeDirection.MayAccess);
        evidence.DiagramLabel.Should().Be("May access");
        evidence.DiagramLabel.Should().NotContain("Reads from");
        evidence.IncludeOnDataFlow.Should().BeTrue();
    }

    [Theory]
    [InlineData(
        AzureInventoryRelationshipAssociationTypes.EventHubMayPublish,
        AzureInventoryDataFlowEdgeDirection.MayWrite,
        "Authorization may allow publish. This is not observed messaging.")]
    [InlineData(
        AzureInventoryRelationshipAssociationTypes.EventHubMayConsume,
        AzureInventoryDataFlowEdgeDirection.MayRead,
        InventoryDiagramRelationshipLabelTexts.AuthorizationMayAllowConsumeObservedMessagingNotStored)]
    [InlineData(
        AzureInventoryRelationshipAssociationTypes.ServiceBusMaySend,
        AzureInventoryDataFlowEdgeDirection.MayWrite,
        InventoryDiagramRelationshipLabelTexts.AuthorizationMayAllowSendObservedMessagingNotStored)]
    [InlineData(
        AzureInventoryRelationshipAssociationTypes.ServiceBusMayReceive,
        AzureInventoryDataFlowEdgeDirection.MayRead,
        InventoryDiagramRelationshipLabelTexts.AuthorizationMayAllowReceiveObservedMessagingNotStored)]
    public void Messaging_authorization_associations_are_catalogued_for_data_flow(
        string associationType,
        AzureInventoryDataFlowEdgeDirection direction,
        string label)
    {
        AzureInventoryRelationshipAssociationTypes.IsKnown(associationType).Should().BeTrue();

        AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(
            associationType,
            out AzureInventoryDataFlowEvidenceAssociation? evidence).Should().BeTrue();

        evidence!.Family.Should().Be(AzureInventoryDataFlowEvidenceFamily.AuthorizedAccess);
        evidence.DefaultBand.Should().Be(PathConfidenceBand.Probable);
        evidence.Direction.Should().Be(direction);
        evidence.DiagramLabel.Should().Be(label);
        evidence.IncludeOnDataFlow.Should().BeTrue();
    }

    [Fact]
    public void DiagnosticToDestination_is_not_on_data_flow()
    {
        AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(
            AzureInventoryRelationshipAssociationTypes.DiagnosticToDestination,
            out AzureInventoryDataFlowEvidenceAssociation? evidence).Should().BeTrue();

        evidence!.IncludeOnDataFlow.Should().BeFalse();
    }

    [Fact]
    public void Metadata_type_has_no_numeric_confidence_property()
    {
        typeof(AzureInventoryDataFlowEvidenceAssociation)
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Select(property => property.Name)
            .Should()
            .NotContain(name => name.Contains("Percent", StringComparison.OrdinalIgnoreCase)
                || name.Equals("Confidence", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Unknown_association_type_is_not_included_on_data_flow()
    {
        AzureInventoryDataFlowEvidenceCatalog.IncludeOnDataFlow("not-a-real-association", null).Should().BeFalse();
    }

    [Fact]
    public void PeReachableTarget_exists_in_catalog_for_sn_pe_04()
    {
        AzureInventoryRelationshipAssociationTypes.IsKnown(AzureInventoryRelationshipAssociationTypes.PeReachableTarget)
            .Should()
            .BeTrue();

        AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(
            AzureInventoryRelationshipAssociationTypes.PeReachableTarget,
            out AzureInventoryDataFlowEvidenceAssociation? evidence).Should().BeTrue();

        evidence!.IncludeOnDataFlow.Should().BeTrue();
        evidence.Family.Should().Be(AzureInventoryDataFlowEvidenceFamily.StructuralNetworkPath);
        evidence.DiagramLabel.Should().Be(InventoryDiagramRelationshipLabelTexts.PeReachableTargetInferredLabel);
    }

    [Theory]
    [InlineData(
        AzureInventoryRelationshipAssociationTypes.EventHubMayPublish,
        GraphEdgeInferenceSources.InventoryEventHubMayPublish,
        AzureInventoryDataFlowEdgeDirection.MayWrite,
        "Authorization may allow publish. This is not observed messaging.")]
    [InlineData(
        AzureInventoryRelationshipAssociationTypes.EventHubMayConsume,
        GraphEdgeInferenceSources.InventoryEventHubMayConsume,
        AzureInventoryDataFlowEdgeDirection.MayRead,
        InventoryDiagramRelationshipLabelTexts.AuthorizationMayAllowConsumeObservedMessagingNotStored)]
    [InlineData(
        AzureInventoryRelationshipAssociationTypes.ServiceBusMaySend,
        GraphEdgeInferenceSources.InventoryServiceBusMaySend,
        AzureInventoryDataFlowEdgeDirection.MayWrite,
        InventoryDiagramRelationshipLabelTexts.AuthorizationMayAllowSendObservedMessagingNotStored)]
    [InlineData(
        AzureInventoryRelationshipAssociationTypes.ServiceBusMayReceive,
        GraphEdgeInferenceSources.InventoryServiceBusMayReceive,
        AzureInventoryDataFlowEdgeDirection.MayRead,
        InventoryDiagramRelationshipLabelTexts.AuthorizationMayAllowReceiveObservedMessagingNotStored)]
    public void Messaging_rbac_verbs_resolve_by_association_type_and_inference_source(
        string associationType,
        string inferenceSource,
        AzureInventoryDataFlowEdgeDirection expectedDirection,
        string expectedLabel)
    {
        AzureInventoryRelationshipAssociationTypes.IsKnown(associationType).Should().BeTrue();

        AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(
            associationType,
            out AzureInventoryDataFlowEvidenceAssociation? fromType).Should().BeTrue();

        fromType!.Family.Should().Be(AzureInventoryDataFlowEvidenceFamily.AuthorizedAccess);
        fromType.Direction.Should().Be(expectedDirection);
        fromType.DiagramLabel.Should().Be(expectedLabel);
        fromType.IncludeOnDataFlow.Should().BeTrue();

        AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(
            inferenceSource,
            out AzureInventoryDataFlowEvidenceAssociation? fromInference).Should().BeTrue();

        fromInference.Should().BeSameAs(fromType);
        AzureInventoryDataFlowEvidenceCatalog.IncludeOnDataFlow(null, inferenceSource).Should().BeTrue();
    }

    [Theory]
    [InlineData(AzureInventoryRelationshipAssociationTypes.AgwToBackend, "Routes to")]
    [InlineData(AzureInventoryRelationshipAssociationTypes.FrontDoorToOrigin, "Routes to")]
    [InlineData(AzureInventoryRelationshipAssociationTypes.LbToBackend, "Configured route. This is not observed traffic.")]
    public void Ingress_routes_are_declared_movement_on_data_flow(string associationType, string expectedDiagramLabel)
    {
        AzureInventoryDataFlowEvidenceCatalog.TryGetDataFlowEvidence(
            associationType,
            out AzureInventoryDataFlowEvidenceAssociation? evidence).Should().BeTrue();

        evidence!.IncludeOnDataFlow.Should().BeTrue();
        evidence.Family.Should().Be(AzureInventoryDataFlowEvidenceFamily.DeclaredMovement);
        evidence.Direction.Should().Be(AzureInventoryDataFlowEdgeDirection.DeclaredWrite);
        evidence.DiagramLabel.Should().Be(expectedDiagramLabel);
    }
}
