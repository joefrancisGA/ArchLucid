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
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/staticSites/swa1";

    private const string BackendId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/api1";

    private const string FabricCapacityId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Fabric/capacities/cap1";

    private const string WorkspaceId =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Fabric/workspaces/ws1";

    [Fact]
    public async Task CollectAsync_throws_when_arm_client_is_null()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            HostedAzureInventoryStaticSiteAndFabricAssociationCollector.CollectAsync(
                null!,
                "token",
                [],
                NullLogger.Instance,
                CancellationToken.None));
    }

    [Fact]
    public async Task CollectAsync_throws_when_token_is_blank()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            HostedAzureInventoryStaticSiteAndFabricAssociationCollector.CollectAsync(
                new Mock<IHostedAzureArmReadClient>(MockBehavior.Strict).Object,
                " ",
                [],
                NullLogger.Instance,
                CancellationToken.None));
    }

    [Fact]
    public async Task CollectAsync_throws_when_resources_are_null()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            HostedAzureInventoryStaticSiteAndFabricAssociationCollector.CollectAsync(
                new Mock<IHostedAzureArmReadClient>(MockBehavior.Strict).Object,
                "token",
                null!,
                NullLogger.Instance,
                CancellationToken.None));
    }

    [Fact]
    public async Task CollectAsync_throws_when_logger_is_null()
    {
        await Assert.ThrowsAsync<ArgumentNullException>(() =>
            HostedAzureInventoryStaticSiteAndFabricAssociationCollector.CollectAsync(
                new Mock<IHostedAzureArmReadClient>(MockBehavior.Strict).Object,
                "token",
                [],
                null!,
                CancellationToken.None));
    }

    [Fact]
    public async Task CollectAsync_skips_blank_ids_and_unrelated_types()
    {
        Mock<IHostedAzureArmReadClient> armClient = new(MockBehavior.Strict);

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await HostedAzureInventoryStaticSiteAndFabricAssociationCollector.CollectAsync(
                armClient.Object,
                "token",
                [
                    CreateResource("Microsoft.Web/staticSites", "   "),
                    CreateResource("Microsoft.Storage/storageAccounts", "/subscriptions/sub/providers/Microsoft.Storage/storageAccounts/sa1"),
                ],
                NullLogger.Instance,
                CancellationToken.None);

        Assert.Empty(result.Associations);
        Assert.Empty(result.CollectionWarnings);
        armClient.Verify(
            client => client.ListChildResourcesWithStatusAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CollectAsync_adds_static_site_linked_backend_association()
    {
        using JsonDocument backend = JsonDocument.Parse(
            """
            { "properties": { "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/api1" } }
            """);

        Mock<IHostedAzureArmReadClient> armClient = SetupChildList(
            StaticSiteId,
            "linkedBackends",
            "2023-12-01",
            HostedAzureArmChildCollectionReadResult.Succeeded([backend.RootElement.Clone()]));

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await CollectAsync(armClient, [CreateResource("Microsoft.Web/staticSites", StaticSiteId)]);

        HostedAzureArmNetworkAssociationRecord association = Assert.Single(result.Associations);
        Assert.Equal(StaticSiteId, association.FromResourceId);
        Assert.Equal(ArmResourceIdNormalizer.Normalize(BackendId), association.ToResourceId);
        Assert.Equal(AzureInventoryRelationshipAssociationTypes.StaticSiteToLinkedBackend, association.AssociationType);
        Assert.Empty(result.CollectionWarnings);
    }

    [Fact]
    public async Task CollectAsync_warns_when_static_site_linked_backend_list_is_partially_collected()
    {
        using JsonDocument backend = JsonDocument.Parse(
            """
            { "properties": { "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/api1" } }
            """);

        Mock<IHostedAzureArmReadClient> armClient = SetupChildList(
            StaticSiteId,
            "linkedBackends",
            "2023-12-01",
            HostedAzureArmChildCollectionReadResult.Succeeded([backend.RootElement.Clone()], partialCollection: true));

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await CollectAsync(armClient, [CreateResource("Microsoft.Web/staticSites", StaticSiteId)]);

        Assert.Single(result.Associations);
        Assert.Equal(
            AzureInventoryStaticSiteCollectionWarnings.Format(
                AzureInventoryStaticSiteCollectionWarnings.ReasonPartialEnumeration,
                StaticSiteId),
            Assert.Single(result.CollectionWarnings));
    }

    [Fact]
    public async Task CollectAsync_dedupes_duplicate_static_site_backend_rows()
    {
        using JsonDocument first = JsonDocument.Parse(
            """
            { "properties": { "resourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/api1" } }
            """);
        using JsonDocument second = JsonDocument.Parse(
            """
            { "properties": { "backendResourceId": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/api1" } }
            """);

        Mock<IHostedAzureArmReadClient> armClient = SetupChildList(
            StaticSiteId,
            "linkedBackends",
            "2023-12-01",
            HostedAzureArmChildCollectionReadResult.Succeeded(
                [first.RootElement.Clone(), second.RootElement.Clone()]));

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await CollectAsync(armClient, [CreateResource("Microsoft.Web/staticSites", StaticSiteId)]);

        Assert.Single(result.Associations);
    }

    [Fact]
    public async Task CollectAsync_skips_static_site_backend_without_resource_id()
    {
        using JsonDocument childOnly = JsonDocument.Parse(
            """
            { "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/staticSites/swa1/linkedBackends/be1" }
            """);

        Mock<IHostedAzureArmReadClient> armClient = SetupChildList(
            StaticSiteId,
            "linkedBackends",
            "2023-12-01",
            HostedAzureArmChildCollectionReadResult.Succeeded([childOnly.RootElement.Clone()]));

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await CollectAsync(armClient, [CreateResource("Microsoft.Web/staticSites", StaticSiteId)]);

        Assert.Empty(result.Associations);
        Assert.Empty(result.CollectionWarnings);
    }

    [Theory]
    [InlineData(401)]
    [InlineData(403)]
    public async Task CollectAsync_warns_when_static_site_list_is_forbidden(int statusCode)
    {
        Mock<IHostedAzureArmReadClient> armClient = SetupChildList(
            StaticSiteId,
            "linkedBackends",
            "2023-12-01",
            HostedAzureArmChildCollectionReadResult.Failed(statusCode));

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await CollectAsync(armClient, [CreateResource("Microsoft.Web/staticSites", StaticSiteId)]);

        Assert.Empty(result.Associations);
        Assert.Equal(
            AzureInventoryStaticSiteCollectionWarnings.Format(
                AzureInventoryStaticSiteCollectionWarnings.ReasonInsufficientPermission,
                StaticSiteId),
            Assert.Single(result.CollectionWarnings));
    }

    [Fact]
    public async Task CollectAsync_warns_when_static_site_list_returns_http_error()
    {
        Mock<IHostedAzureArmReadClient> armClient = SetupChildList(
            StaticSiteId,
            "linkedBackends",
            "2023-12-01",
            HostedAzureArmChildCollectionReadResult.Failed(500));

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await CollectAsync(armClient, [CreateResource("Microsoft.Web/staticSites", StaticSiteId)]);

        Assert.Empty(result.Associations);
        Assert.Equal(
            AzureInventoryStaticSiteCollectionWarnings.Format(
                AzureInventoryStaticSiteCollectionWarnings.ReasonHttpError,
                StaticSiteId),
            Assert.Single(result.CollectionWarnings));
    }

    [Fact]
    public async Task CollectAsync_ignores_static_site_zero_status_without_warning()
    {
        Mock<IHostedAzureArmReadClient> armClient = SetupChildList(
            StaticSiteId,
            "linkedBackends",
            "2023-12-01",
            HostedAzureArmChildCollectionReadResult.Failed(0));

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await CollectAsync(armClient, [CreateResource("Microsoft.Web/staticSites", StaticSiteId)]);

        Assert.Empty(result.Associations);
        Assert.Empty(result.CollectionWarnings);
    }

    [Fact]
    public async Task CollectAsync_adds_fabric_capacity_workspace_association()
    {
        using JsonDocument workspace = JsonDocument.Parse(
            """
            { "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Fabric/workspaces/ws1", "name": "Sales" }
            """);

        Mock<IHostedAzureArmReadClient> armClient = SetupChildList(
            FabricCapacityId,
            "workspaces",
            "2024-05-01",
            HostedAzureArmChildCollectionReadResult.Succeeded([workspace.RootElement.Clone()]));

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await CollectAsync(armClient, [CreateResource("Microsoft.Fabric/capacities", FabricCapacityId)]);

        HostedAzureArmNetworkAssociationRecord association = Assert.Single(result.Associations);
        Assert.Equal(FabricCapacityId, association.FromResourceId);
        Assert.Equal(ArmResourceIdNormalizer.Normalize(WorkspaceId), association.ToResourceId);
        Assert.Equal(AzureInventoryRelationshipAssociationTypes.FabricCapacityToWorkspace, association.AssociationType);
        Assert.Empty(result.CollectionWarnings);
    }

    [Fact]
    public async Task CollectAsync_warns_when_fabric_workspace_list_is_partially_collected()
    {
        using JsonDocument workspace = JsonDocument.Parse(
            """
            { "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Fabric/workspaces/ws1", "name": "Sales" }
            """);

        Mock<IHostedAzureArmReadClient> armClient = SetupChildList(
            FabricCapacityId,
            "workspaces",
            "2024-05-01",
            HostedAzureArmChildCollectionReadResult.Succeeded([workspace.RootElement.Clone()], partialCollection: true));

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await CollectAsync(armClient, [CreateResource("Microsoft.Fabric/capacities", FabricCapacityId)]);

        Assert.Single(result.Associations);
        Assert.Equal(
            AzureInventoryFabricCapacityCollectionWarnings.FormatAssignmentsNotCollected(
                AzureInventoryFabricCapacityCollectionWarnings.ReasonPartialEnumeration,
                FabricCapacityId),
            Assert.Single(result.CollectionWarnings));
    }

    [Fact]
    public async Task CollectAsync_warns_when_fabric_workspace_is_outside_inventory()
    {
        using JsonDocument workspace = JsonDocument.Parse(
            """
            { "id": "workspace-guid-not-an-arm-id", "name": "Orphan" }
            """);

        Mock<IHostedAzureArmReadClient> armClient = SetupChildList(
            FabricCapacityId,
            "workspaces",
            "2024-05-01",
            HostedAzureArmChildCollectionReadResult.Succeeded([workspace.RootElement.Clone()]));

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await CollectAsync(armClient, [CreateResource("Microsoft.Fabric/capacities", FabricCapacityId)]);

        Assert.Empty(result.Associations);
        Assert.Equal(
            AzureInventoryFabricCapacityCollectionWarnings.FormatWorkspacesOutsideInventory(1, FabricCapacityId),
            Assert.Single(result.CollectionWarnings));
    }

    [Theory]
    [InlineData(401)]
    [InlineData(403)]
    public async Task CollectAsync_warns_when_fabric_list_is_forbidden(int statusCode)
    {
        Mock<IHostedAzureArmReadClient> armClient = SetupChildList(
            FabricCapacityId,
            "workspaces",
            "2024-05-01",
            HostedAzureArmChildCollectionReadResult.Failed(statusCode));

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await CollectAsync(armClient, [CreateResource("Microsoft.Fabric/capacities", FabricCapacityId)]);

        Assert.Empty(result.Associations);
        Assert.Equal(
            AzureInventoryFabricCapacityCollectionWarnings.FormatAssignmentsNotCollected(
                AzureInventoryFabricCapacityCollectionWarnings.ReasonInsufficientPermission,
                FabricCapacityId),
            Assert.Single(result.CollectionWarnings));
    }

    [Fact]
    public async Task CollectAsync_warns_when_fabric_list_returns_http_error()
    {
        Mock<IHostedAzureArmReadClient> armClient = SetupChildList(
            FabricCapacityId,
            "workspaces",
            "2024-05-01",
            HostedAzureArmChildCollectionReadResult.Failed(404));

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await CollectAsync(armClient, [CreateResource("Microsoft.Fabric/capacities", FabricCapacityId)]);

        Assert.Empty(result.Associations);
        Assert.Equal(
            AzureInventoryFabricCapacityCollectionWarnings.FormatAssignmentsNotCollected(
                AzureInventoryFabricCapacityCollectionWarnings.ReasonHttpError,
                FabricCapacityId),
            Assert.Single(result.CollectionWarnings));
    }

    [Fact]
    public async Task CollectAsync_ignores_fabric_zero_status_without_warning()
    {
        Mock<IHostedAzureArmReadClient> armClient = SetupChildList(
            FabricCapacityId,
            "workspaces",
            "2024-05-01",
            HostedAzureArmChildCollectionReadResult.Failed(0));

        HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult result =
            await CollectAsync(armClient, [CreateResource("Microsoft.Fabric/capacities", FabricCapacityId)]);

        Assert.Empty(result.Associations);
        Assert.Empty(result.CollectionWarnings);
    }

    private static async Task<HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult> CollectAsync(
        Mock<IHostedAzureArmReadClient> armClient,
        IReadOnlyList<HostedAzureArmResourceRecord> resources)
    {
        return await HostedAzureInventoryStaticSiteAndFabricAssociationCollector.CollectAsync(
            armClient.Object,
            "token",
            resources,
            NullLogger.Instance,
            CancellationToken.None);
    }

    private static Mock<IHostedAzureArmReadClient> SetupChildList(
        string parentResourceId,
        string childSegment,
        string apiVersion,
        HostedAzureArmChildCollectionReadResult listResult)
    {
        Mock<IHostedAzureArmReadClient> armClient = new(MockBehavior.Strict);
        armClient
            .Setup(client => client.ListChildResourcesWithStatusAsync(
                "token",
                parentResourceId,
                childSegment,
                apiVersion,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(listResult);

        return armClient;
    }

    private static HostedAzureArmResourceRecord CreateResource(string resourceType, string resourceId)
    {
        return new HostedAzureArmResourceRecord(
            ResourceType: resourceType,
            ResourceId: resourceId,
            Name: "resource",
            Location: "eastus",
            Sku: null,
            Tags: null,
            Properties: new Dictionary<string, object?>());
    }
}
