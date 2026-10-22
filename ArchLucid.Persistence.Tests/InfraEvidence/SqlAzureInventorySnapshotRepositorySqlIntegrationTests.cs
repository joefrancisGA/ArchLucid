using ArchLucid.Contracts.Common;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.InfraEvidence;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
public sealed class SqlAzureInventorySnapshotRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
  private static readonly Guid TenantId = Guid.Parse("e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1");
  private static readonly Guid WorkspaceId = Guid.Parse("e2e2e2e2-e2e2-e2e2-e2e2-e2e2e2e2e2e2");
  private static readonly Guid ProjectA = Guid.Parse("e3e3e3e3-e3e3-e3e3-e3e3-e3e3e3e3e3e3");
  private static readonly Guid ProjectB = Guid.Parse("e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4");

  [SkippableFact]
  public async Task Duplicate_package_does_not_create_two_snapshots_and_foreign_project_is_isolated()
  {
    Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

    SqlConnectionFactory factory = new(fixture.ConnectionString);
    SqlAzureExtractorPackageRepository packageRepository = new(factory);
    SqlAzureInventorySnapshotRepository snapshotRepository = new(factory);

    Guid packageId = Guid.NewGuid();
    ScopeContext scopeA = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectA };

    await packageRepository.InsertAsync(
      new AzureExtractorPackageRecord
      {
        PackageId = packageId,
        TenantId = TenantId,
        WorkspaceId = WorkspaceId,
        ProjectId = ProjectA,
        CreatedUtc = DateTime.UtcNow,
        SchemaVersion = 1,
        OriginalFileName = "inventory.zip",
        ManifestJson = "{}",
        PackageBytes = [0x50, 0x4B],
      },
      CancellationToken.None);

    DateTime utcNow = DateTime.UtcNow;
    AzureInventorySnapshotRecord header = new()
    {
      SnapshotId = Guid.NewGuid(),
      TenantId = TenantId,
      WorkspaceId = WorkspaceId,
      ProjectId = ProjectA,
      PackageId = packageId,
      CaptureStatus = AzureInventoryCaptureStatus.Pending,
      CreatedUtc = utcNow,
      UpdatedUtc = utcNow,
    };

    await snapshotRepository.InsertHeaderAsync(header, CancellationToken.None);

    Func<Task> duplicateInsert = () => snapshotRepository.InsertHeaderAsync(
      new AzureInventorySnapshotRecord
      {
        SnapshotId = Guid.NewGuid(),
        TenantId = header.TenantId,
        WorkspaceId = header.WorkspaceId,
        ProjectId = header.ProjectId,
        PackageId = header.PackageId,
        CaptureStatus = header.CaptureStatus,
        CreatedUtc = header.CreatedUtc,
        UpdatedUtc = header.UpdatedUtc,
      },
      CancellationToken.None);

    await duplicateInsert.Should().ThrowAsync<Exception>();

    ScopeContext scopeB = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectB };

    AzureInventorySnapshotRecord? foreignLookup =
      await snapshotRepository.TryGetByPackageIdAsync(scopeB, packageId, CancellationToken.None);

    foreignLookup.Should().BeNull("snapshot headers are project-scoped.");

    const string hiddenId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.ManagedIdentity/userAssignedIdentities/identity-a";
    const string visibleId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet-a";
    Guid hiddenRowId = Guid.NewGuid();
    await snapshotRepository.MaterializeSnapshotAsync(scopeA, header.SnapshotId, new AzureInventorySnapshotMaterializeWriteRequest
    {
      CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
      ResourceCount = 2,
      RelationshipCount = 1,
      Resources =
      [
        new AzureInventoryResourceRecord { SnapshotId = header.SnapshotId, TenantId = TenantId, ResourceRowId = hiddenRowId, AzureResourceId = hiddenId, ResourceType = "Microsoft.ManagedIdentity/userAssignedIdentities" },
        new AzureInventoryResourceRecord { SnapshotId = header.SnapshotId, TenantId = TenantId, ResourceRowId = Guid.NewGuid(), AzureResourceId = visibleId, ResourceType = "Microsoft.Network/virtualNetworks" },
      ],
      Properties = Enumerable.Range(0, 1001).Select(index => new AzureInventoryResourcePropertyWrite
      {
        ResourceRowId = hiddenRowId, PropertyKey = $"property-{index}", PropertyValue = index % 2 == 0 ? null : $"value-{index}",
        IsRedacted = index % 3 == 0,
      }).ToList(),
      Relationships = [new AzureInventoryResourceRelationshipWrite { FromAzureResourceId = visibleId, ToAzureResourceId = hiddenId, RelationshipType = "contains", ProvenanceKind = ProvenanceKind.ObservedFact }],
    });
    AzureInventorySnapshotDetailReadModel? canonical = await snapshotRepository.TryGetCanonicalSnapshotDetailAsync(scopeA, header.SnapshotId);
    canonical!.Resources.Should().HaveCount(2);
    canonical.Properties.Should().HaveCount(1001);
    canonical.Properties.Should().OnlyContain(property => property.ResourceRowId == hiddenRowId);
    canonical.Properties.Single(property => property.PropertyKey == "property-0").PropertyValue.Should().BeNull();
    canonical.Properties.Single(property => property.PropertyKey == "property-1").PropertyValue.Should().Be("value-1");
    canonical.Properties.Single(property => property.PropertyKey == "property-3").IsRedacted.Should().BeTrue();
    canonical.Relationships.Should().ContainSingle();
    AzureInventorySnapshotDetailReadModel? visible = await snapshotRepository.TryGetSnapshotDetailAsync(scopeA, header.SnapshotId);
    visible!.Resources.Should().ContainSingle(resource => resource.AzureResourceId == visibleId);
    visible.Properties.Should().BeEmpty();
    visible.Relationships.Should().BeEmpty();
    (await snapshotRepository.TryGetCanonicalSnapshotDetailAsync(scopeB, header.SnapshotId)).Should().BeNull();

  }

  [SkippableFact]
  public async Task CloudResourceIdentity_same_arm_id_across_snapshots_reuses_guid()
  {
    Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

    SqlConnectionFactory factory = new(fixture.ConnectionString);
    SqlCloudResourceIdentityDirectory directory = new(factory);
    ScopeContext scope = new() { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectA };

    Guid snapshotA = Guid.NewGuid();
    Guid snapshotB = Guid.NewGuid();
    const string armId = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";

    CloudResourceIdentityRecord first =
      await directory.UpsertOnSnapshotAsync(
        scope,
        CloudProvider.Azure,
        armId,
        snapshotA,
        "Microsoft.Storage/storageAccounts",
        "sub",
        "rg",
        "eastus",
        "sa1",
        CancellationToken.None);

    CloudResourceIdentityRecord second =
      await directory.UpsertOnSnapshotAsync(
        scope,
        CloudProvider.Azure,
        armId + "/",
        snapshotB,
        "Microsoft.Storage/storageAccounts",
        "sub",
        "rg",
        "eastus",
        "sa1",
        CancellationToken.None);

    second.CloudResourceId.Should().Be(first.CloudResourceId);
    second.LastSeenSnapshotId.Should().Be(snapshotB);
  }

  [SkippableFact]
  public async Task Identity_batch_crosses_buffer_boundary_reuses_ids_and_preserves_null_metadata_and_tenant_isolation()
  {
    Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);
    SqlCloudResourceIdentityDirectory directory = new(new SqlConnectionFactory(fixture.ConnectionString));
    ScopeContext scope = new() { TenantId = Guid.NewGuid(), WorkspaceId = WorkspaceId, ProjectId = ProjectA };
    Guid snapshotA = Guid.NewGuid();
    Guid snapshotB = Guid.NewGuid();
    List<CloudResourceIdentitySnapshotWrite> rows = Enumerable.Range(0, 1001)
      .Select(index => new CloudResourceIdentitySnapshotWrite(
        $"/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/batch{index}",
        "Microsoft.Storage/storageAccounts", "sub", "rg", "eastus", $"batch{index}")).ToList();
    IReadOnlyDictionary<string, CloudResourceIdentityRecord> first =
      await directory.UpsertSnapshotBatchAsync(scope, CloudProvider.Azure, snapshotA, rows);
    first.Should().HaveCount(rows.Count);
    CloudResourceIdentitySnapshotWrite updated = rows[0] with { ExternalResourceId = rows[0].ExternalResourceId + "/", Region = "westus" };
    IReadOnlyDictionary<string, CloudResourceIdentityRecord> second = await directory.UpsertSnapshotBatchAsync(
      scope, CloudProvider.Azure, snapshotB,
      [updated, updated with { ResourceType = null, SubscriptionOrAccountId = null, Region = null, DisplayName = null }]);
    CloudResourceIdentityRecord identity = second.Values.Single();
    CloudResourceIdentityRecord original = first[identity.ExternalResourceIdNormalized];
    identity.CloudResourceId.Should().Be(original.CloudResourceId);
    identity.FirstSeenSnapshotId.Should().Be(snapshotA);
    identity.FirstSeenUtc.Should().Be(original.FirstSeenUtc);
    identity.LastSeenSnapshotId.Should().Be(snapshotB);
    identity.Region.Should().Be("westus");
    identity.DisplayName.Should().Be(rows[0].DisplayName);
    identity.ResourceType.Should().Be(rows[0].ResourceType);

    ScopeContext otherTenant = new() { TenantId = Guid.NewGuid(), WorkspaceId = WorkspaceId, ProjectId = ProjectA };
    IReadOnlyDictionary<string, CloudResourceIdentityRecord> isolated = await directory.UpsertSnapshotBatchAsync(
      otherTenant, CloudProvider.Azure, snapshotB, [rows[0]]);
    isolated.Values.Single().CloudResourceId.Should().NotBe(identity.CloudResourceId);
    (await directory.UpsertSnapshotBatchAsync(scope, CloudProvider.Azure, snapshotB, [])).Should().BeEmpty();
  }
}
