using ArchLucid.KnowledgeGraph.Inventory;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.KnowledgeGraph.Tests.Inventory;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryIdentityDiagramVisibilityTests
{
    [Fact]
    public void ListInventoryFilteredIdentityArmTypes_returns_never_show_identity_types()
    {
        AzureInventoryResourceRecord managedIdentity = new()
        {
            ResourceRowId = Guid.NewGuid(),
            SnapshotId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            AzureResourceId =
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/app-identity",
            ResourceType = "Microsoft.ManagedIdentity/userAssignedIdentities",
        };

        AzureInventoryResourceRecord storage = new()
        {
            ResourceRowId = Guid.NewGuid(),
            SnapshotId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            AzureResourceId =
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/logs",
            ResourceType = "Microsoft.Storage/storageAccounts",
        };

        IReadOnlyList<AzureInventoryIdentityDiagramSuppressedArmTypeSummary> summaries =
            AzureInventoryIdentityDiagramVisibility.ListInventoryFilteredIdentityArmTypes(
                [managedIdentity, storage]);

        summaries.Should().ContainSingle();
        summaries[0].ArmResourceType.Should().Be("Microsoft.ManagedIdentity/userAssignedIdentities");
        summaries[0].ResourceCount.Should().Be(1);
    }
}
