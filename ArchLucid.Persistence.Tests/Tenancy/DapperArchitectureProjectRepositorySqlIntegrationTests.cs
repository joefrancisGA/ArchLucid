using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Tenancy;
using ArchLucid.Persistence.Tests.Support;

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
}
