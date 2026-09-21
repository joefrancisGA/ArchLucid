using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryAdfLinkedServiceEdgeMapperTests
{
    [Fact]
    public void MapLinkedServices_emits_observed_edge_for_explicit_arm_target()
    {
        const string factoryId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";
        const string storageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = factoryId,
                ResourceType = "Microsoft.DataFactory/factories",
                Name = "adf1",
            },
            new()
            {
                AzureResourceId = storageId,
                ResourceType = "Microsoft.Storage/storageAccounts",
                Name = "sa1",
            },
        ];

        List<AzureInventoryAdfLinkedServiceRow> linkedServices =
        [
            new()
            {
                FactoryResourceId = factoryId,
                LinkedServiceResourceId = $"{factoryId}/linkedservices/BlobLS",
                LinkedServiceName = "BlobLS",
                LinkedServiceType = "AzureBlobStorage",
                TargetResourceId = storageId,
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> directionalPairs = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryAdfLinkedServiceEdgeMapper.MapLinkedServices(
            resources,
            linkedServices,
            relationships,
            keys,
            directionalPairs,
            warnings);

        relationships.Should().ContainSingle();
        relationships[0].FromAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(factoryId));
        relationships[0].ToAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(storageId));
        relationships[0].ProvenanceKind.Should().Be(ProvenanceKind.ObservedFact);
        relationships[0].InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryAdfLinkedService);
        relationships[0].RelationshipType.Should().Be(AzureInventoryRelationshipAssociationTypes.AdfLinkedService);
    }

    [Fact]
    public void MapLinkedServices_emits_inferred_edge_for_unique_hostname_match()
    {
        const string factoryId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";
        const string storageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = factoryId,
                ResourceType = "Microsoft.DataFactory/factories",
                Name = "adf1",
            },
            new()
            {
                AzureResourceId = storageId,
                ResourceType = "Microsoft.Storage/storageAccounts",
                Name = "sa1",
            },
        ];

        List<AzureInventoryAdfLinkedServiceRow> linkedServices =
        [
            new()
            {
                FactoryResourceId = factoryId,
                LinkedServiceResourceId = $"{factoryId}/linkedservices/BlobLS",
                LinkedServiceName = "BlobLS",
                LinkedServiceType = "AzureBlobStorage",
                TargetHost = "sa1.blob.core.windows.net",
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> directionalPairs = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryAdfLinkedServiceEdgeMapper.MapLinkedServices(
            resources,
            linkedServices,
            relationships,
            keys,
            directionalPairs,
            warnings);

        relationships.Should().ContainSingle();
        relationships[0].ProvenanceKind.Should().Be(ProvenanceKind.DeterministicInference);
        relationships[0].RelationshipType.Should().Be(AzureInventoryRelationshipAssociationTypes.AdfLinkedServiceInferred);
    }

    [Fact]
    public void MapLinkedServices_skips_neutral_edge_when_directional_pair_exists()
    {
        const string factoryId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";
        const string storageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = factoryId,
                ResourceType = "Microsoft.DataFactory/factories",
                Name = "adf1",
            },
            new()
            {
                AzureResourceId = storageId,
                ResourceType = "Microsoft.Storage/storageAccounts",
                Name = "sa1",
            },
        ];

        List<AzureInventoryAdfLinkedServiceRow> linkedServices =
        [
            new()
            {
                FactoryResourceId = factoryId,
                LinkedServiceResourceId = $"{factoryId}/linkedservices/BlobLS",
                LinkedServiceName = "BlobLS",
                LinkedServiceType = "AzureBlobStorage",
                TargetResourceId = storageId,
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> directionalPairs =
        [
            AzureInventoryAdfPipelineFlowEdgeMapper.BuildDirectionalPairKey(
                ArmResourceIdNormalizer.Normalize(factoryId),
                ArmResourceIdNormalizer.Normalize(storageId)),
        ];
        List<string> warnings = [];

        AzureInventoryAdfLinkedServiceEdgeMapper.MapLinkedServices(
            resources,
            linkedServices,
            relationships,
            keys,
            directionalPairs,
            warnings);

        relationships.Should().BeEmpty();
    }

    [Fact]
    public void MapLinkedServices_emits_external_target_for_unresolved_sap_linked_service()
    {
        const string factoryId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf1";

        List<AzureExtractorExtendedResourceRow> resources =
        [
            new()
            {
                AzureResourceId = factoryId,
                ResourceType = "Microsoft.DataFactory/factories",
                Name = "adf1",
            },
        ];

        List<AzureInventoryAdfLinkedServiceRow> linkedServices =
        [
            new()
            {
                FactoryResourceId = factoryId,
                LinkedServiceResourceId = $"{factoryId}/linkedservices/SapLS",
                LinkedServiceName = "SapLS",
                LinkedServiceType = "SapTable",
                TargetHost = "sap.example.com",
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.TargetUnresolved,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> directionalPairs = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryAdfLinkedServiceEdgeMapper.MapLinkedServices(
            resources,
            linkedServices,
            relationships,
            keys,
            directionalPairs,
            warnings);

        relationships.Should().ContainSingle();
        relationships[0].ToAzureResourceId.Should().Be(
            AzureInventoryAdfExternalSourceNodeFactory.BuildNodeKey(factoryId, "SapLS"));
        relationships[0].FromAzureResourceId.Should().Be(ArmResourceIdNormalizer.Normalize(factoryId));
    }
}
