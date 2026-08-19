using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scim.Models;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Authorization;
using ArchLucid.Persistence.Scim;
using ArchLucid.Persistence.Tenancy;

using Moq;

namespace ArchLucid.Persistence.Tests.Caching;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CachingReferenceDataRepositoryTests
{
    [Fact]
    public async Task CustomRole_ListAssignmentsForUserAsync_hits_inner_once_across_reads()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryCustomRoleRepository inner = new();
        CachingCustomRoleRepository repo = new(inner, hotPath);

        Guid tenantId = Guid.NewGuid();
        Guid userId = Guid.NewGuid();
        CustomRoleRecord role = await inner.CreateAsync(
            new CustomRoleRecord
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Name = "Ops",
                Permissions = ["runs:read"],
                CreatedUtc = TimeProvider.System.GetUtcNow(),
                UpdatedUtc = TimeProvider.System.GetUtcNow(),
            },
            CancellationToken.None);

        await inner.AssignAsync(
            new UserCustomRoleAssignmentRecord
            {
                TenantId = tenantId,
                UserId = userId,
                CustomRoleId = role.Id,
                AssignedUtc = TimeProvider.System.GetUtcNow(),
            },
            CancellationToken.None);

        IReadOnlyList<CustomRoleAssignmentWithRole> first =
            await repo.ListAssignmentsForUserAsync(tenantId, userId, CancellationToken.None);
        IReadOnlyList<CustomRoleAssignmentWithRole> second =
            await repo.ListAssignmentsForUserAsync(tenantId, userId, CancellationToken.None);

        first.Should().HaveCount(1);
        second.Should().HaveCount(1);
        second[0].Role.Permissions.Should().Equal("runs:read");
    }

    [Fact]
    public async Task CustomRole_UpdateAsync_invalidates_assignment_cache()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryCustomRoleRepository inner = new();
        CachingCustomRoleRepository repo = new(inner, hotPath);

        Guid tenantId = Guid.NewGuid();
        Guid userId = Guid.NewGuid();
        CustomRoleRecord role = await repo.CreateAsync(
            new CustomRoleRecord
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Name = "Ops",
                Permissions = ["runs:read"],
                CreatedUtc = TimeProvider.System.GetUtcNow(),
                UpdatedUtc = TimeProvider.System.GetUtcNow(),
            },
            CancellationToken.None);

        await repo.AssignAsync(
            new UserCustomRoleAssignmentRecord
            {
                TenantId = tenantId,
                UserId = userId,
                CustomRoleId = role.Id,
                AssignedUtc = TimeProvider.System.GetUtcNow(),
            },
            CancellationToken.None);

        _ = await repo.ListAssignmentsForUserAsync(tenantId, userId, CancellationToken.None);

        await repo.UpdateAsync(
            new CustomRoleRecord
            {
                Id = role.Id,
                TenantId = tenantId,
                Name = "Ops",
                Permissions = ["runs:read", "runs:write"],
                IsSystem = role.IsSystem,
                CreatedUtc = role.CreatedUtc,
                UpdatedUtc = TimeProvider.System.GetUtcNow(),
            },
            CancellationToken.None);

        IReadOnlyList<CustomRoleAssignmentWithRole> after =
            await repo.ListAssignmentsForUserAsync(tenantId, userId, CancellationToken.None);

        after.Single().Role.Permissions.Should().BeEquivalentTo(["runs:read", "runs:write"]);
    }

    [Fact]
    public async Task ScimUser_GetByExternalIdAsync_uses_cache_until_replace()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryScimUserRepository inner = new();
        CachingScimUserRepository repo = new(inner, hotPath);

        Guid tenantId = Guid.NewGuid();
        ScimUserRecord created = await repo.InsertAsync(
            tenantId,
            "ext-1",
            "user@example.com",
            "User",
            active: true,
            resolvedRole: "Reader",
            ScimResolvedRoleOrigin.Manual,
            CancellationToken.None);

        ScimUserRecord? first = await repo.GetByExternalIdAsync(tenantId, "ext-1", CancellationToken.None);
        ScimUserRecord? second = await repo.GetByExternalIdAsync(tenantId, "ext-1", CancellationToken.None);

        first.Should().NotBeNull();
        second.Should().NotBeNull();
        second!.Id.Should().Be(created.Id);

        await repo.ReplaceAsync(
            tenantId,
            created.Id,
            "ext-2",
            "user@example.com",
            "User",
            active: true,
            resolvedRole: "Reader",
            ScimResolvedRoleOrigin.Manual,
            CancellationToken.None);

        ScimUserRecord? oldKey = await repo.GetByExternalIdAsync(tenantId, "ext-1", CancellationToken.None);
        ScimUserRecord? newKey = await repo.GetByExternalIdAsync(tenantId, "ext-2", CancellationToken.None);

        oldKey.Should().BeNull();
        newKey.Should().NotBeNull();
        newKey!.ExternalId.Should().Be("ext-2");
    }

    [Fact]
    public async Task Tenant_GetByIdAsync_invalidates_on_suspend()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryTenantRepository inner = new();
        CachingTenantRepository repo = new(inner, hotPath);

        Guid tenantId = Guid.NewGuid();
        await inner.InsertTenantAsync(
            tenantId,
            "Acme",
            "acme",
            TenantTier.Standard,
            entraTenantId: null,
            dataRegion: "eastus",
            CancellationToken.None);

        TenantRecord? first = await repo.GetByIdAsync(tenantId, CancellationToken.None);
        first.Should().NotBeNull();
        first!.SuspendedUtc.Should().BeNull();

        await repo.SuspendTenantAsync(tenantId, CancellationToken.None);

        TenantRecord? after = await repo.GetByIdAsync(tenantId, CancellationToken.None);
        after.Should().NotBeNull();
        after!.SuspendedUtc.Should().NotBeNull();
    }

    [Fact]
    public async Task TenantSettings_TryGetAsync_refreshes_after_upsert()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryTenantSettingsRepository inner = new();
        CachingTenantSettingsRepository repo = new(inner, hotPath);

        Guid tenantId = Guid.NewGuid();

        (await repo.TryGetAsync(tenantId, "feature.x", CancellationToken.None)).Should().BeNull();

        await repo.UpsertAsync(tenantId, "feature.x", "on", CancellationToken.None);

        (await repo.TryGetAsync(tenantId, "feature.x", CancellationToken.None)).Should().Be("on");
        (await repo.TryGetAsync(tenantId, "feature.x", CancellationToken.None)).Should().Be("on");
    }

    [Fact]
    public async Task TenantSettings_TryGetAsync_refreshes_after_upsert_when_setting_key_casing_differs()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryTenantSettingsRepository inner = new();
        CachingTenantSettingsRepository repo = new(inner, hotPath);

        Guid tenantId = Guid.NewGuid();

        (await repo.TryGetAsync(tenantId, "Feature.X", CancellationToken.None)).Should().BeNull();

        await repo.UpsertAsync(tenantId, "feature.x", "on", CancellationToken.None);

        (await repo.TryGetAsync(tenantId, "Feature.X", CancellationToken.None)).Should().Be("on");
    }

    [Fact]
    public async Task TenantSettings_TryGetAsync_returns_null_after_delete()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryTenantSettingsRepository inner = new();
        CachingTenantSettingsRepository repo = new(inner, hotPath);

        Guid tenantId = Guid.NewGuid();

        await repo.UpsertAsync(tenantId, "feature.x", "on", CancellationToken.None);
        (await repo.TryGetAsync(tenantId, "feature.x", CancellationToken.None)).Should().Be("on");

        await repo.DeleteAsync(tenantId, "feature.x", CancellationToken.None);

        (await repo.TryGetAsync(tenantId, "feature.x", CancellationToken.None)).Should().BeNull();
    }

    [Fact]
    public async Task HotPathCacheEviction_RemoveTenantAsync_removes_key()
    {
        Mock<IHotPathReadCache> cache = new();
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        await HotPathCacheEviction.RemoveTenantAsync(cache.Object, tenantId, CancellationToken.None);

        cache.Verify(c => c.RemoveAsync(HotPathCacheKeys.TenantById(tenantId), CancellationToken.None), Times.Once);
    }
}
