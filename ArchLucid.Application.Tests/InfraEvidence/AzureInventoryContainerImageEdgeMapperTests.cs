using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryContainerImageEdgeMapperTests
{
    [Fact]
    public void MapImages_emits_one_observed_edge_for_multiple_images_from_one_registry()
    {
        const string appId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.App/containerApps/app";
        const string registryId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ContainerRegistry/registries/acraephidevwus001";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = appId,
                ResourceType = "Microsoft.App/containerApps",
                Name = "app",
                Properties = new Dictionary<string, string>
                {
                    ["container.image[0]"] = "acraephidevwus001.azurecr.io/one:1",
                    ["container.image[1]"] = "acraephidevwus001.azurecr.io/two:2",
                },
            },
            new()
            {
                AzureResourceId = registryId,
                ResourceType = "Microsoft.ContainerRegistry/registries",
                Name = "acraephidevwus001",
                Properties = new Dictionary<string, string>
                {
                    ["loginServer"] = "acraephidevwus001.azurecr.io",
                },
            },
        ];
        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);

        AzureInventoryContainerImageEdgeMapper.MapImages(resources, relationships, keys);

        relationships.Should().ContainSingle();
        relationships[0].ToAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(registryId));
        relationships[0].RelationshipType.Should().Be(GraphEdgeTypes.ConnectsTo);
        relationships[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryContainerImage);
        relationships[0].ProvenanceKind.Should().Be(ArchLucid.Core.InfraEvidence.ProvenanceKind.ObservedFact);
    }
}
