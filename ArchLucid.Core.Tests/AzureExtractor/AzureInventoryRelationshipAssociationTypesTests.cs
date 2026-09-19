using System.Reflection;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryRelationshipAssociationTypesTests
{
    [Fact]
    public void All_association_types_are_unique_ordinal_ignore_case()
    {
        string[] types = AzureInventoryRelationshipAssociationTypes.All
            .Select(definition => definition.AssociationType)
            .ToArray();

        types.Distinct(StringComparer.OrdinalIgnoreCase).Should().HaveCount(types.Length);
    }

    [Fact]
    public void Existing_four_types_match_catalog_with_expected_provenance()
    {
        AzureInventoryRelationshipAssociationTypes.TryGet(
            AzureInventoryRelationshipAssociationTypes.NicToSubnet,
            out AzureInventoryRelationshipAssociationTypeDefinition? nicToSubnet).Should().BeTrue();
        nicToSubnet!.DefaultProvenanceKind.Should().Be(ProvenanceKind.ObservedFact);
        nicToSubnet.DefaultGraphEdgeType.Should().Be("CONNECTS_TO");

        AzureInventoryRelationshipAssociationTypes.TryGet(
            AzureInventoryRelationshipAssociationTypes.PublicIpToNic,
            out AzureInventoryRelationshipAssociationTypeDefinition? publicIpToNic).Should().BeTrue();
        publicIpToNic!.DefaultProvenanceKind.Should().Be(ProvenanceKind.ObservedFact);
        publicIpToNic.DefaultGraphEdgeType.Should().Be("EXPOSES");

        AzureInventoryRelationshipAssociationTypes.TryGet(
            AzureInventoryRelationshipAssociationTypes.PrivateEndpointTarget,
            out AzureInventoryRelationshipAssociationTypeDefinition? privateEndpointTarget).Should().BeTrue();
        privateEndpointTarget!.DefaultProvenanceKind.Should().Be(ProvenanceKind.ObservedFact);

        AzureInventoryRelationshipAssociationTypes.TryGet(
            AzureInventoryRelationshipAssociationTypes.NsgAllowRule,
            out AzureInventoryRelationshipAssociationTypeDefinition? nsgAllowRule).Should().BeTrue();
        nsgAllowRule!.DefaultProvenanceKind.Should().Be(ProvenanceKind.DeterministicInference);
        nsgAllowRule.DefaultGraphEdgeType.Should().Be("ROUTES_TO");
    }

    [Fact]
    public void Typo_nic2Subnet_is_not_a_catalog_member()
    {
        AzureInventoryRelationshipAssociationTypes.IsKnown("nic2Subnet").Should().BeFalse();
        AzureInventoryRelationshipAssociationTypes.TryGet("nic2Subnet", out _).Should().BeFalse();
    }

    [Fact]
    public void Lookup_is_case_insensitive_for_valid_types()
    {
        AzureInventoryRelationshipAssociationTypes.IsKnown("NICTOSUBNET").Should().BeTrue();
    }

    [Fact]
    public void Catalog_lists_all_types_with_inference_sources()
    {
        // Public const strings are the catalog's declared types; All must stay in lockstep when types are added.
        FieldInfo[] publicStringConstants = typeof(AzureInventoryRelationshipAssociationTypes)
            .GetFields(BindingFlags.Public | BindingFlags.Static)
            .Where(field => field.IsLiteral && field.FieldType == typeof(string))
            .ToArray();

        AzureInventoryRelationshipAssociationTypes.All.Should().HaveCount(publicStringConstants.Length);
        AzureInventoryRelationshipAssociationTypes.All.Should().OnlyContain(definition =>
            !string.IsNullOrWhiteSpace(definition.DefaultInferenceSource));
    }

    [Fact]
    public void Diagram_enrichment_types_are_catalogued_with_expected_provenance()
    {
        AzureInventoryRelationshipAssociationTypes.TryGet(
            AzureInventoryRelationshipAssociationTypes.DiagnosticToDestination,
            out AzureInventoryRelationshipAssociationTypeDefinition? diagnostic).Should().BeTrue();
        diagnostic!.DefaultProvenanceKind.Should().Be(ProvenanceKind.ObservedFact);
        diagnostic.DefaultInferenceSource.Should().Be("inventory-diagnostic-destination");

        AzureInventoryRelationshipAssociationTypes.TryGet(
            AzureInventoryRelationshipAssociationTypes.AppAuthorizedAccess,
            out AzureInventoryRelationshipAssociationTypeDefinition? authorizedAccess).Should().BeTrue();
        authorizedAccess!.DefaultProvenanceKind.Should().Be(ProvenanceKind.DerivedFact);
        authorizedAccess.DefaultGraphEdgeType.Should().Be("MAY_ACCESS");

        AzureInventoryRelationshipAssociationTypes.TryGet(
            AzureInventoryRelationshipAssociationTypes.NsgAllowRule,
            out AzureInventoryRelationshipAssociationTypeDefinition? nsgAllowRule).Should().BeTrue();
        nsgAllowRule!.DefaultProvenanceKind.Should().Be(ProvenanceKind.DeterministicInference);
    }

    [Theory]
    [InlineData("diagnosticToDestination")]
    [InlineData("appAuthorizedAccess")]
    [InlineData("synapseReadsFrom")]
    [InlineData("eventHubCapture")]
    [InlineData("avdSessionHostToVm")]
    public void New_association_types_are_known_members(string associationType)
    {
        AzureInventoryRelationshipAssociationTypes.IsKnown(associationType).Should().BeTrue();
    }
}
