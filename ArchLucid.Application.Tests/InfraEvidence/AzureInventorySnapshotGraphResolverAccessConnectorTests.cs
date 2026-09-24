using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventorySnapshotGraphResolverAccessConnectorTests
{
    private static readonly Guid TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly Guid SnapshotId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");

    [Fact]
    public async Task TryResolveGraphAsync_draws_access_connector_as_workspace_to_storage_edge()
    {
        Guid workspaceRow = Guid.Parse("11111111-1111-4000-8000-000000000001");
        Guid connectorRow = Guid.Parse("11111111-1111-4000-8000-000000000002");
        Guid storageRow = Guid.Parse("11111111-1111-4000-8000-000000000003");
        const string workspaceId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Databricks/workspaces/analytics";
        const string connectorId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Databricks/accessConnectors/uc-connector";
        const string storageId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/lake";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = SnapshotId,
                TenantId = TenantId,
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                Resource(workspaceRow, workspaceId, "Microsoft.Databricks/workspaces"),
                Resource(connectorRow, connectorId, "Microsoft.Databricks/accessConnectors"),
                Resource(storageRow, storageId, "Microsoft.Storage/storageAccounts"),
            ],
            Properties =
            [
                Property(workspaceRow, AzureInventoryDatabricksAccessConnector.IdPropertyKey, connectorId),
                Property(
                    connectorRow,
                    AzureInventoryDatabricksAccessConnector.IdentityPropertyKey,
                    """{"type":"SystemAssigned","principalId":"11111111-2222-3333-4444-555555555555"}"""),
            ],
            RoleAssignments =
            [
                new AzureInventoryRoleAssignmentReadModel
                {
                    Scope = storageId + "/blobServices/default/containers/root",
                    PrincipalId = "11111111-2222-3333-4444-555555555555",
                    RoleDefinitionId =
                        "/providers/Microsoft.Authorization/roleDefinitions/"
                        + AzureInventoryDatabricksAccessConnector.StorageBlobDataOwnerRoleDefinitionId,
                },
            ],
        };

        AzureInventorySnapshotGraphResolveResult resolved = await ResolveAsync(snapshot);

        resolved.Succeeded.Should().BeTrue();
        GraphEdge edge = resolved.Graph!.Edges.Should().ContainSingle(candidate =>
            candidate.EdgeType == AzureInventoryDatabricksAccessConnector.EdgeType).Subject;
        edge.Label.Should().Be("uc-connector");
        edge.InferenceSource.Should().Be(GraphEdgeInferenceSources.InventoryDatabricksAccessConnector);

        GraphNode connectorNode = resolved.Graph.Nodes.Single(node => node.Label == "uc-connector");
        connectorNode.Properties[AzureInventoryDatabricksAccessConnector.CollapseNodePropertyKey].Should().Be("true");

        DiagramAst ast = new DiagramAstFromGraphCompiler().Compile(resolved.Graph, DiagramMode.FullSubscription);
        ast.Nodes.Should().NotContain(node => node.Label == "uc-connector");
        ast.Edges.Should().Contain(candidate => candidate.Label == "uc-connector");
        ast.Nodes.Should().Contain(node => node.Label == "analytics");
        ast.Nodes.Should().Contain(node => node.Label == "lake");
    }

    private static async Task<AzureInventorySnapshotGraphResolveResult> ResolveAsync(
        AzureInventorySnapshotDetailReadModel snapshot)
    {
        Mock<IAzureInventorySnapshotRepository> repository = new();
        repository
            .Setup(candidate => candidate.TryGetSnapshotDetailAsync(
                It.IsAny<ScopeContext>(),
                SnapshotId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        AzureInventorySnapshotGraphResolver resolver = new(repository.Object);

        return await resolver.TryResolveGraphAsync(
            new ScopeContext
            {
                TenantId = TenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            },
            SnapshotId,
            cancellationToken: CancellationToken.None);
    }

    private static AzureInventoryResourceRecord Resource(Guid resourceRowId, string azureResourceId, string resourceType)
    {
        return new AzureInventoryResourceRecord
        {
            ResourceRowId = resourceRowId,
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            AzureResourceId = azureResourceId,
            ResourceType = resourceType,
            ResourceGroup = "rg",
            SubscriptionId = "sub",
        };
    }

    private static AzureInventoryResourcePropertyReadModel Property(Guid resourceRowId, string key, string value)
    {
        return new AzureInventoryResourcePropertyReadModel
        {
            ResourceRowId = resourceRowId,
            PropertyKey = key,
            PropertyValue = value,
        };
    }
}
