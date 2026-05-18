using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Tests.Support;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Collection(nameof(SqlServerPersistenceCollection))]
[Trait("Category", "SqlServerContainer")]
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class DapperArchitectureProjectRepositorySqlIntegrationTests(SqlServerPersistenceFixture fixture)
{
    [SkippableFact]
    public async Task Soft_delete_allows_name_reuse_and_excludes_from_list()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository tenants = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        DapperArchitectureProjectRepository projects = new(factory);

        Guid tenantId = Guid.NewGuid();
        string slug = "prj-" + Guid.NewGuid().ToString("N")[..8];
        Guid workspaceId = Guid.NewGuid();
        Guid defaultProjectId = Guid.NewGuid();
        Guid secondProjectId = Guid.NewGuid();

        await tenants.InsertTenantAsync(
            tenantId,
            "Project SQL tenant",
            slug,
            TenantTier.Free,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        await tenants.InsertWorkspaceAsync(workspaceId, tenantId, "ws-p", defaultProjectId, CancellationToken.None);
        await projects.InsertAsync(defaultProjectId, tenantId, workspaceId, "default", CancellationToken.None);
        await projects.InsertAsync(secondProjectId, tenantId, workspaceId, "orders-api", CancellationToken.None);

        (await projects.ListActiveByTenantAsync(tenantId, CancellationToken.None)).Should().HaveCount(2);

        (await projects.TrySoftDeleteAsync(tenantId, workspaceId, secondProjectId, CancellationToken.None)).Should().BeTrue();

        IReadOnlyList<ArchitectureProjectRecord> afterDelete =
            await projects.ListActiveByTenantAsync(tenantId, CancellationToken.None);
        afterDelete.Should().ContainSingle().Which.Id.Should().Be(defaultProjectId);
        afterDelete.Any(static r => r.Name == "orders-api").Should().BeFalse();

        Guid replacementId = Guid.NewGuid();
        await projects.InsertAsync(replacementId, tenantId, workspaceId, "orders-api", CancellationToken.None);

        (await projects.ListActiveByTenantAsync(tenantId, CancellationToken.None)).Should().HaveCount(2);
    }

    [SkippableFact]
    public async Task Soft_deleted_rows_list_in_recycle_bin_and_restore_returns_them_to_active()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository tenants = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        DapperArchitectureProjectRepository projects = new(factory);

        Guid tenantId = Guid.NewGuid();
        string slug = "rst-" + Guid.NewGuid().ToString("N")[..8];
        Guid workspaceId = Guid.NewGuid();
        Guid defaultProjectId = Guid.NewGuid();
        Guid secondProjectId = Guid.NewGuid();

        await tenants.InsertTenantAsync(
            tenantId,
            "Restore tenant",
            slug,
            TenantTier.Free,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        await tenants.InsertWorkspaceAsync(workspaceId, tenantId, "ws-r", defaultProjectId, CancellationToken.None);
        await projects.InsertAsync(defaultProjectId, tenantId, workspaceId, "default", CancellationToken.None);
        await projects.InsertAsync(secondProjectId, tenantId, workspaceId, "billing-svc", CancellationToken.None);

        (await projects.TrySoftDeleteAsync(tenantId, workspaceId, secondProjectId, CancellationToken.None)).Should().BeTrue();

        IReadOnlyList<ArchitectureProjectRecord> deleted =
            await projects.ListSoftDeletedByTenantAsync(tenantId, CancellationToken.None);

        deleted.Should().ContainSingle()
            .Which.Name.Should().Be("billing-svc");

        ArchitectureProjectRestoreResult restored =
            await projects.TryRestoreAsync(tenantId, workspaceId, secondProjectId, CancellationToken.None);

        restored.Should().Be(ArchitectureProjectRestoreResult.Restored);

        IReadOnlyList<ArchitectureProjectRecord> activeAgain =
            await projects.ListActiveByTenantAsync(tenantId, CancellationToken.None);

        activeAgain.Should().HaveCount(2);
        activeAgain.Should().Contain(r => r.Id == secondProjectId && r.Name == "billing-svc");

        IReadOnlyList<ArchitectureProjectRecord> binAfter =
            await projects.ListSoftDeletedByTenantAsync(tenantId, CancellationToken.None);

        binAfter.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task Restore_blocked_when_workspace_has_active_same_name()
    {
        Skip.IfNot(fixture.IsSqlServerAvailable, SqlServerPersistenceFixture.SqlServerUnavailableSkipReason);

        TestSqlConnectionFactory factory = new(fixture.ConnectionString);
        DapperTenantRepository tenants = DapperTenantRepositoryTestFactory.CreateForSingleCatalogIntegration(factory);
        DapperArchitectureProjectRepository projects = new(factory);

        Guid tenantId = Guid.NewGuid();
        string slug = "clsh-" + Guid.NewGuid().ToString("N")[..8];
        Guid workspaceId = Guid.NewGuid();
        Guid defaultProjectId = Guid.NewGuid();
        Guid originalId = Guid.NewGuid();
        Guid replacementId = Guid.NewGuid();

        await tenants.InsertTenantAsync(
            tenantId,
            "Collision tenant",
            slug,
            TenantTier.Free,
            null,
            TenantDataRegions.Default,
            CancellationToken.None);

        await tenants.InsertWorkspaceAsync(workspaceId, tenantId, "ws-c", defaultProjectId, CancellationToken.None);
        await projects.InsertAsync(defaultProjectId, tenantId, workspaceId, "default", CancellationToken.None);
        await projects.InsertAsync(originalId, tenantId, workspaceId, "shared-name", CancellationToken.None);

        (await projects.TrySoftDeleteAsync(tenantId, workspaceId, originalId, CancellationToken.None)).Should().BeTrue();

        await projects.InsertAsync(replacementId, tenantId, workspaceId, "shared-name", CancellationToken.None);

        ArchitectureProjectRestoreResult outcome =
            await projects.TryRestoreAsync(tenantId, workspaceId, originalId, CancellationToken.None);

        outcome.Should().Be(ArchitectureProjectRestoreResult.ActiveProjectNameCollision);

        (await projects.ListSoftDeletedByTenantAsync(tenantId, CancellationToken.None)).Should().NotBeEmpty();
    }
}
