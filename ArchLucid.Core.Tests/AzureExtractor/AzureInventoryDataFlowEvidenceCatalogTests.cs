using System.Reflection;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

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
        evidence.DiagramLabel.Should().Be("Private network path");
    }
}
