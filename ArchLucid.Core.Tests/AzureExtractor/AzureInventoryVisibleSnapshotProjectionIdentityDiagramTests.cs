using ArchLucid.Core.AzureExtractor;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
public sealed class AzureInventoryVisibleSnapshotProjectionIdentityDiagramTests
{
    [Fact]
    public void Apply_retainIdentityDiagramArmTypes_keeps_user_assigned_managed_identity_resources()
    {
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = Guid.NewGuid(),
                TenantId = Guid.NewGuid(),
                SubscriptionId = "sub",
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = Guid.NewGuid(),
                    TenantId = Guid.NewGuid(),
                    AzureResourceId =
                        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/app-identity",
                    ResourceType = "Microsoft.ManagedIdentity/userAssignedIdentities",
                },
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = Guid.NewGuid(),
                    SnapshotId = Guid.NewGuid(),
                    TenantId = Guid.NewGuid(),
                    AzureResourceId =
                        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.OperationalInsights/workspaces/logs",
                    ResourceType = "Microsoft.OperationalInsights/workspaces",
                },
            ],
        };

        AzureInventorySnapshotDetailReadModel projected =
            AzureInventoryVisibleSnapshotProjection.Apply(snapshot, retainIdentityDiagramArmTypes: true);

        projected.Resources.Should().ContainSingle(resource =>
            resource.ResourceType == "Microsoft.ManagedIdentity/userAssignedIdentities");
    }
}
