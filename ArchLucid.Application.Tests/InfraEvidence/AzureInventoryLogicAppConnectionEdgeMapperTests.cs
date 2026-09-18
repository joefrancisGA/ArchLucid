using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryLogicAppConnectionEdgeMapperTests
{
    [Fact]
    public void MapConnections_emits_edges_for_connection_and_target_resources()
    {
        const string workflowId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Logic/workflows/notify";
        const string connectionId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/connections/azureblob";
        const string storageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        List<AzureInventoryLogicAppConnectionRow> connections =
        [
            new()
            {
                WorkflowResourceId = workflowId,
                WorkflowName = "notify",
                ConnectionName = "azureblob",
                ConnectionResourceId = connectionId,
                TargetResourceId = storageId,
                CollectionStatus = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded,
            },
        ];

        List<AzureInventoryResourceRelationshipWrite> relationships = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);
        List<string> warnings = [];

        AzureInventoryLogicAppConnectionEdgeMapper.MapConnections(connections, relationships, keys, warnings);

        relationships.Should().HaveCount(2);
        relationships.Should().Contain(r =>
            r.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(workflowId)
            && r.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(connectionId)
            && r.RelationshipType == GraphEdgeTypes.ConnectsTo
            && r.ProvenanceKind == ProvenanceKind.DerivedFact
            && r.InferenceSource == GraphEdgeInferenceSources.InventoryLogicAppConnection);
        relationships.Should().Contain(r =>
            r.FromAzureResourceId == ArmResourceIdNormalizer.Normalize(workflowId)
            && r.ToAzureResourceId == ArmResourceIdNormalizer.Normalize(storageId));
    }
}
