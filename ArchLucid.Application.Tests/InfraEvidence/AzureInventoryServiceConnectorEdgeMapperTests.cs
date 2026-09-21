using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryServiceConnectorEdgeMapperTests
{
    [Fact]
    public void MapLinks_emits_observed_fact_edge_to_target()
    {
        const string appId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/fn1";
        const string sqlId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1";

        List<AzureInventoryServiceConnectorLinkRow> links =
        [
            new()
            {
                SourceResourceId = appId,
                LinkerName = "sql-link",
                LinkerResourceId = $"{appId}/providers/Microsoft.ServiceLinker/linkers/sql-link",
                TargetResourceId = sqlId,
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryServiceConnectorEdgeMapper.MapLinks(links, relationships, keys, warnings);

        relationships.Should().ContainSingle();
        relationships[0].FromAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(appId));
        relationships[0].ToAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(sqlId));
        relationships[0].ProvenanceKind.Should().Be(ProvenanceKind.ObservedFact);
        relationships[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryServiceConnectorLink);
    }
}
