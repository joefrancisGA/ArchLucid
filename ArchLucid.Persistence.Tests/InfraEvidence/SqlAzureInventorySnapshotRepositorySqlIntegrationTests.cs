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
}
