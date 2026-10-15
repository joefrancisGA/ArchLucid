using System.Text.Json;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryNetworkAssociationEdgeMapperNspTests
{
    [Fact]
    public void MapAssociation_emits_nsp_to_member_edge_once()
    {
        const string perimeterId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityPerimeters/databricks-nsp";
        const string storageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        JsonElement association = JsonDocument.Parse(
            $$"""
            {
              "fromResourceId": "{{perimeterId}}",
              "toResourceId": "{{storageId}}",
              "associationType": "networkSecurityPerimeterToResource",
              "profileId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkSecurityPerimeters/databricks-nsp/profiles/default",
              "accessMode": "Learning"
            }
            """).RootElement;

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryNetworkAssociationEdgeMapper.MapAssociation(association, relationships, keys, warnings);

        relationships.Should().ContainSingle();
        relationships[0].FromAzureResourceId.Should().BeEquivalentTo(perimeterId);
        relationships[0].ToAzureResourceId.Should().BeEquivalentTo(storageId);
        relationships[0].RelationshipType.Should().Be("PROTECTS");
        relationships[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryNspAssociation);
        relationships[0].ProvenanceKind.Should().Be(ProvenanceKind.ObservedFact);

        AzureInventoryNetworkAssociationEdgeMapper.MapAssociation(association, relationships, keys, warnings);
        relationships.Should().ContainSingle();
    }
}
