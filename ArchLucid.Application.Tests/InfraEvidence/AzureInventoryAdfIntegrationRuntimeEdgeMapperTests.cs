using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryAdfIntegrationRuntimeEdgeMapperTests
{
    [Fact]
    public void MapIntegrationRuntimes_emits_factory_to_runtime_and_runtime_to_subnet_edges()
    {
        const string factoryId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";
        const string runtimeId = $"{factoryId}/integrationruntimes/ir1";
        const string subnetId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/default";

        List<AzureInventoryAdfIntegrationRuntimeRow> integrationRuntimes =
        [
            new()
            {
                FactoryResourceId = factoryId,
                IntegrationRuntimeResourceId = runtimeId,
                Name = "ir1",
                Kind = "Managed",
                SubnetId = subnetId,
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryAdfIntegrationRuntimeEdgeMapper.MapIntegrationRuntimes(
            integrationRuntimes,
            relationships,
            keys,
            warnings);

        relationships.Should().HaveCount(2);
        relationships.Should().Contain(r =>
            r.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(factoryId)
            && r.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(runtimeId)
            && r.RelationshipType == GraphEdgeTypes.ConnectsTo
            && r.InferenceSource == GraphEdgeInferenceSources.InventoryAdfIntegrationRuntime);
        relationships.Should().Contain(r =>
            r.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(runtimeId)
            && r.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(subnetId)
            && r.RelationshipType == GraphEdgeTypes.ConnectsTo);
    }
}
