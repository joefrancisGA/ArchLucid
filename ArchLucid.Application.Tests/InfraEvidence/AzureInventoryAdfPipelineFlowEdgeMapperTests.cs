using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryAdfPipelineFlowEdgeMapperTests
{
    [Fact]
    public void MapPipelineFlows_emits_read_and_write_edges()
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

        List<AzureInventoryAdfDatasetRow> datasets =
        [
            new()
            {
                FactoryResourceId = factoryId,
                DatasetResourceId = $"{factoryId}/datasets/SourceDs",
                DatasetName = "SourceDs",
                LinkedServiceName = "BlobLS",
            },
            new()
            {
                FactoryResourceId = factoryId,
                DatasetResourceId = $"{factoryId}/datasets/SinkDs",
                DatasetName = "SinkDs",
                LinkedServiceName = "BlobLS",
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
            },
        ];

        List<AzureInventoryAdfPipelineFlowRow> pipelineFlows =
        [
            new()
            {
                FactoryResourceId = factoryId,
                PipelineResourceId = $"{factoryId}/pipelines/p1",
                PipelineName = "p1",
                ActivityName = "CopyBlob",
                ActivityType = "Copy",
                FlowDirection = AzureInventoryAdfPipelineFlowDirection.Read,
                DatasetName = "SourceDs",
            },
            new()
            {
                FactoryResourceId = factoryId,
                PipelineResourceId = $"{factoryId}/pipelines/p1",
                PipelineName = "p1",
                ActivityName = "CopyBlob",
                ActivityType = "Copy",
                FlowDirection = AzureInventoryAdfPipelineFlowDirection.Write,
                DatasetName = "SinkDs",
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        HashSet<string> directionalPairs = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryAdfPipelineFlowEdgeMapper.MapPipelineFlows(
            resources,
            datasets,
            linkedServices,
            pipelineFlows,
            relationships,
            keys,
            directionalPairs,
            warnings);

        relationships.Should().HaveCount(2);
        relationships.Should().Contain(relationship =>
            relationship.RelationshipType == AzureInventoryRelationshipAssociationTypes.AdfReadsFrom
            && relationship.InferenceSource == GraphEdgeInferenceSources.InventoryAdfReadsFrom);
        relationships.Should().Contain(relationship =>
            relationship.RelationshipType == AzureInventoryRelationshipAssociationTypes.AdfWritesTo
            && relationship.InferenceSource == GraphEdgeInferenceSources.InventoryAdfWritesTo);
        directionalPairs.Should().ContainSingle();
    }
}
