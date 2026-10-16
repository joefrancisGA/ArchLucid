using System.Text.Json;

using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryNetworkAssociationEdgeMapperAmplsTests
{
    [Fact]
    public void MapAssociation_emits_ampls_to_scoped_member_edge_once()
    {
        const string scopeId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Insights/privateLinkScopes/extension-pls";
        const string appInsightsId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Insights/components/app1";

        JsonElement association = JsonDocument.Parse(
            $$"""
            {
              "fromResourceId": "{{scopeId}}",
              "toResourceId": "{{appInsightsId}}",
              "associationType": "monitorPrivateLinkScopeToScopedResource",
              "kind": "components"
            }
            """).RootElement;

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryNetworkAssociationEdgeMapper.MapAssociation(association, relationships, keys, warnings);

        relationships.Should().ContainSingle();
        relationships[0].FromAzureResourceId.Should().BeEquivalentTo(scopeId);
        relationships[0].ToAzureResourceId.Should().BeEquivalentTo(appInsightsId);
        relationships[0].RelationshipType.Should().Be("CONNECTS_TO");
        relationships[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryAmplsScopedResource);
        relationships[0].ProvenanceKind.Should().Be(ProvenanceKind.ObservedFact);

        AzureInventoryNetworkAssociationEdgeMapper.MapAssociation(association, relationships, keys, warnings);
        relationships.Should().ContainSingle();
    }
}
