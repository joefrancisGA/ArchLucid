using ArchLucid.Application.InfraEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class AzureInventoryChangeAttributionResolverTests
{
    [Fact]
    public void Enrich_resolves_human_email_from_systemData_lastModifiedBy()
    {
        Guid snapshotAId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid snapshotBId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid resourceRowId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string armId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

        AzureInventorySnapshotDetailReadModel snapshotA = BuildSnapshot(snapshotAId, resourceRowId, armId, []);
        AzureInventorySnapshotDetailReadModel snapshotB = BuildSnapshot(
            snapshotBId,
            resourceRowId,
            armId,
            [
                (AzureInventorySystemDataPropertyKeys.LastModifiedBy, "operator@contoso.com"),
                (AzureInventorySystemDataPropertyKeys.LastModifiedByType, "User"),
            ]);

        AzureInventoryChangeRecord change = BuildChange(snapshotAId, snapshotBId, armId, AzureInventoryChangeType.ResourceModified);

        List<AzureInventoryChangeRecord> enriched = AzureInventoryChangeAttributionResolver.Enrich(
            [change],
            snapshotA,
            snapshotB);

        enriched.Should().ContainSingle();
        enriched[0].ChangedByDisplayName.Should().Be("operator@contoso.com");
        enriched[0].ChangedByKind.Should().Be("human");
    }

    [Fact]
    public void Enrich_resolves_managed_identity_display_name_for_service_principal_actor()
    {
        Guid snapshotAId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid snapshotBId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid resourceRowId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid identityRowId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string armId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm1";
        string identityArmId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/ci-runner";
        string principalId = "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee";

        AzureInventorySnapshotDetailReadModel snapshotA = BuildSnapshot(snapshotAId, resourceRowId, armId, []);
        AzureInventorySnapshotDetailReadModel snapshotB = BuildSnapshotWithIdentity(
            snapshotBId,
            resourceRowId,
            armId,
            [
                (AzureInventorySystemDataPropertyKeys.LastModifiedBy, principalId),
                (AzureInventorySystemDataPropertyKeys.LastModifiedByType, "Application"),
                (AzureInventorySystemDataPropertyKeys.ComputerName, "vm-prod-01"),
            ],
            identityRowId,
            identityArmId,
            principalId);

        AzureInventoryChangeRecord change = BuildChange(snapshotAId, snapshotBId, armId, AzureInventoryChangeType.SkuChanged);

        List<AzureInventoryChangeRecord> enriched = AzureInventoryChangeAttributionResolver.Enrich(
            [change],
            snapshotA,
            snapshotB);

        enriched[0].ChangedByDisplayName.Should().Be("ci-runner");
        enriched[0].ChangedByKind.Should().Be("servicePrincipal");
    }

    private static AzureInventoryChangeRecord BuildChange(
        Guid snapshotAId,
        Guid snapshotBId,
        string armId,
        AzureInventoryChangeType changeType) =>
        new()
        {
            ChangeId = Guid.NewGuid(),
            DiffId = Guid.NewGuid(),
            SnapshotAId = snapshotAId,
            SnapshotBId = snapshotBId,
            AzureResourceId = armId,
            ChangeType = changeType,
            Property = "sku",
            ProvenanceKind = ProvenanceKind.DerivedFact,
        };

    private static AzureInventorySnapshotDetailReadModel BuildSnapshot(
        Guid snapshotId,
        Guid resourceRowId,
        string armId,
        IReadOnlyList<(string Key, string Value)> properties) =>
        new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = snapshotId,
                TenantId = Guid.NewGuid(),
                SubscriptionId = "sub",
                CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
            },
            Resources =
            [
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = resourceRowId,
                    SnapshotId = snapshotId,
                    TenantId = Guid.NewGuid(),
                    AzureResourceId = armId,
                    ResourceType = "Microsoft.Storage/storageAccounts",
                },
            ],
            Properties = properties
                .Select(pair => new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = resourceRowId,
                    PropertyKey = pair.Key,
                    PropertyValue = pair.Value,
                })
                .ToList(),
        };

    private static AzureInventorySnapshotDetailReadModel BuildSnapshotWithIdentity(
        Guid snapshotId,
        Guid resourceRowId,
        string armId,
        IReadOnlyList<(string Key, string Value)> properties,
        Guid identityRowId,
        string identityArmId,
        string principalId)
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildSnapshot(snapshotId, resourceRowId, armId, properties);

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = snapshot.Header,
            Resources =
            [
                ..snapshot.Resources,
                new AzureInventoryResourceRecord
                {
                    ResourceRowId = identityRowId,
                    SnapshotId = snapshotId,
                    TenantId = snapshot.Header.TenantId,
                    AzureResourceId = identityArmId,
                    ResourceType = "Microsoft.ManagedIdentity/userAssignedIdentities",
                },
            ],
            Properties =
            [
                ..snapshot.Properties,
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = identityRowId,
                    PropertyKey = "principalId",
                    PropertyValue = principalId,
                },
            ],
        };
    }
}
