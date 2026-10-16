using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

using Xunit;

namespace ArchLucid.Integrations.AzureExtractor.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Integrations.AzureExtractor")]
public sealed class HostedAzureInventoryStaticSiteAndFabricAssociationCollectorTests
{
    private const string StaticSiteId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/staticSites/app1";

    private const string BackendId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/api1";

    private const string FabricCapacityId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Fabric/capacities/cap1";

    private const string FabricWorkspaceId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Fabric/workspaces/ws1";

    [Fact]
    public async Task CollectAsync_maps_static_site_and_fabric_rows_from_interface_client()
    {
        using JsonDocument backendDocument = JsonDocument.Parse(
            """
            {
              "properties": {
                "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/api1"
              }
            }
            """);
        using JsonDocument workspaceDocument = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Fabric/workspaces/ws1",
              "name": "ws1"
            }
            """);

        Mock<IHostedAzureArmReadClient> armClient = new(MockBehavior.Strict);
        armClient
            .Setup(client => client.ListChildResourcesWithStatusAsync(
                "token",
                StaticSiteId,
                "linkedBackends",
                "2023-12-01",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAzureArmChildCollectionReadResult.Succeeded([backendDocument.RootElement.Clone()]));
        armClient
            .Setup(client => client.ListChildResourcesWithStatusAsync(
                "token",
                FabricCapacityId,
                "workspaces",
                "2024-05-01",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAzureArmChildCollectionReadResult.Succeeded([workspaceDocument.RootElement.Clone()]));

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await HostedAzureInventoryStaticSiteAndFabricAssociationCollector.CollectAsync(
                armClient.Object,
                "token",
                [
                    CreateResource("Microsoft.Web/staticSites", StaticSiteId, "app1"),
                    CreateResource("Microsoft.Fabric/capacities", FabricCapacityId, "cap1"),
                ],
                NullLogger.Instance,
                CancellationToken.None);

        Assert.Contains(
            result.Associations,
            row => row.AssociationType == AzureInventoryRelationshipAssociationTypes.StaticSiteToLinkedBackend
                && row.FromResourceId == StaticSiteId
                && row.ToResourceId == ArmResourceIdNormalizer.Normalize(BackendId));
        Assert.Contains(
            result.Associations,
            row => row.AssociationType == AzureInventoryRelationshipAssociationTypes.FabricCapacityToWorkspace
                && row.FromResourceId == FabricCapacityId
                && row.ToResourceId == ArmResourceIdNormalizer.Normalize(FabricWorkspaceId));
        Assert.Empty(result.CollectionWarnings);
        armClient.VerifyAll();
    }

    [Fact]
    public async Task CollectAsync_records_insufficient_permission_warnings()
    {
        Mock<IHostedAzureArmReadClient> armClient = new(MockBehavior.Strict);
        armClient
            .Setup(client => client.ListChildResourcesWithStatusAsync(
                "token",
                StaticSiteId,
                "linkedBackends",
                "2023-12-01",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAzureArmChildCollectionReadResult.Failed(403));
        armClient
            .Setup(client => client.ListChildResourcesWithStatusAsync(
                "token",
                FabricCapacityId,
                "workspaces",
                "2024-05-01",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(HostedAzureArmChildCollectionReadResult.Failed(401));

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await HostedAzureInventoryStaticSiteAndFabricAssociationCollector.CollectAsync(
                armClient.Object,
                "token",
                [
                    CreateResource("Microsoft.Web/staticSites", StaticSiteId, "app1"),
                    CreateResource("Microsoft.Fabric/capacities", FabricCapacityId, "cap1"),
                ],
                NullLogger.Instance,
                CancellationToken.None);

        Assert.Empty(result.Associations);
        Assert.Contains(
            AzureInventoryStaticSiteCollectionWarnings.Format(
                AzureInventoryStaticSiteCollectionWarnings.ReasonInsufficientPermission,
                StaticSiteId),
            result.CollectionWarnings);
        Assert.Contains(
            AzureInventoryFabricCapacityCollectionWarnings.FormatAssignmentsNotCollected(
                AzureInventoryFabricCapacityCollectionWarnings.ReasonInsufficientPermission,
                FabricCapacityId),
            result.CollectionWarnings);
        armClient.VerifyAll();
    }

    private static HostedAzureArmResourceRecord CreateResource(string resourceType, string resourceId, string name)
    {
        return new HostedAzureArmResourceRecord(
            ResourceType: resourceType,
            ResourceId: resourceId,
            Name: name,
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>());
    }
}
