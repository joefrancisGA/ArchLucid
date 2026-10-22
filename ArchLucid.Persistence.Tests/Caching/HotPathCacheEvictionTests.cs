using ArchLucid.Core.Scoping;

using Moq;

namespace ArchLucid.Persistence.Tests.Caching;

[Trait("Category", "Unit")]
public sealed class HotPathCacheEvictionTests
{
    [Fact]
    public async Task RemoveManifestAsync_throws_when_cache_null()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };
        Guid manifestId = Guid.Parse("44444444-4444-4444-4444-444444444444");

        Func<Task> act = async () =>
            await HotPathCacheEviction.RemoveManifestAsync(null!, scope, manifestId, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("cache");
    }

    [Fact]
    public async Task RemoveManifestAsync_throws_when_scope_null()
    {
        Mock<IHotPathReadCache> cache = new();
        Guid manifestId = Guid.NewGuid();

        Func<Task> act = async () =>
            await HotPathCacheEviction.RemoveManifestAsync(cache.Object, null!, manifestId, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("scope");
    }

    [Fact]
    public async Task RemoveManifestAsync_removes_manifest_key()
    {
        Mock<IHotPathReadCache> cache = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };
        Guid manifestId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        CancellationToken ct = CancellationToken.None;

        await HotPathCacheEviction.RemoveManifestAsync(cache.Object, scope, manifestId, ct);

        cache.Verify(c => c.RemoveAsync(HotPathCacheKeys.Manifest(scope, manifestId), ct), Times.Once);

        cache.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RemoveRunAsync_throws_when_cache_null()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Guid runId = Guid.NewGuid();

        Func<Task> act = async () =>
            await HotPathCacheEviction.RemoveRunAsync(null!, scope, runId, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("cache");
    }

    [Fact]
    public async Task RemoveRunAsync_removes_run_key()
    {
        Mock<IHotPathReadCache> cache = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };
        Guid runId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        CancellationToken ct = CancellationToken.None;

        await HotPathCacheEviction.RemoveRunAsync(cache.Object, scope, runId, ct);

        cache.Verify(c => c.RemoveAsync(HotPathCacheKeys.Run(scope, runId), ct), Times.Once);

        cache.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task RemovePolicyPackAsync_throws_when_cache_null()
    {
        Guid policyPackId = Guid.NewGuid();

        Func<Task> act = async () =>
            await HotPathCacheEviction.RemovePolicyPackAsync(null!, policyPackId, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>().WithParameterName("cache");
    }

    [Fact]
    public async Task RemovePolicyPackAsync_removes_policy_pack_key()
    {
        Mock<IHotPathReadCache> cache = new();
        Guid policyPackId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        CancellationToken ct = CancellationToken.None;

        await HotPathCacheEviction.RemovePolicyPackAsync(cache.Object, policyPackId, ct);

        cache.Verify(c => c.RemoveAsync(HotPathCacheKeys.PolicyPack(policyPackId), ct), Times.Once);

        cache.VerifyNoOtherCalls();
    }
}
