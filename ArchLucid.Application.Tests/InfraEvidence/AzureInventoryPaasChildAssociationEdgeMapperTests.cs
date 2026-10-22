using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryPaasChildAssociationEdgeMapperTests
{
    [Fact]
    public void MapAssociations_emits_contains_edge_for_sql_database()
    {
        const string serverId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1";
        const string databaseId = $"{serverId}/databases/appdb";

        List<AzureInventoryPaasChildAssociationRow> associations =
        [
            new()
            {
                ParentResourceId = serverId,
                ChildResourceId = databaseId,
                ChildName = "appdb",
                ChildType = AzureInventoryPaasChildAssociationTypes.SqlDatabase,
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryPaasChildAssociationEdgeMapper.MapAssociations(associations, relationships, keys, warnings);

        relationships.Should().ContainSingle();
        relationships[0].FromAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(serverId));
        relationships[0].ToAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(databaseId));
        relationships[0].RelationshipType.Should().Be(GraphEdgeTypes.Contains);
        relationships[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryExplicitParentChild);
    }
}
