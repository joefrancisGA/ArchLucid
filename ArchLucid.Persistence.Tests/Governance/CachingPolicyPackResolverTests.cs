using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Governance;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class CachingPolicyPackResolverTests
{
    [Fact]
    public async Task ResolveAsync_ReusesCachedEffectiveSetUntilTenantRevisionChanges()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        EffectivePolicyPackSet expected = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        Mock<IPolicyPackResolver> inner = new();
        inner.Setup(
                r => r.ResolveAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        InMemoryHotPathReadCache cache = new();

        CachingPolicyPackResolver sut = new(inner.Object, cache);

        EffectivePolicyPackSet first = await sut.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);
        EffectivePolicyPackSet second = await sut.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        first.Should().BeSameAs(expected);
        second.Should().BeSameAs(expected);
        inner.Verify(
            r => r.ResolveAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ResolveAsync_AfterTenantInvalidation_ResolvesAgain()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid workspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid projectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

        Mock<IPolicyPackResolver> inner = new();
        inner.Setup(r => r.ResolveAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EffectivePolicyPackSet { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId });

        InMemoryHotPathReadCache cache = new();
        PolicyPackResolverCacheInvalidator invalidator = new(cache);
        CachingPolicyPackResolver sut = new(inner.Object, cache);

        await sut.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);
        await invalidator.InvalidateTenantAsync(tenantId, CancellationToken.None);
        await sut.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        inner.Verify(
            r => r.ResolveAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    private sealed class InMemoryHotPathReadCache : IHotPathReadCache
    {
        private readonly Dictionary<string, object> _entries = new(StringComparer.Ordinal);

        public async Task<T?> GetOrCreateAsync<T>(
            string key,
            Func<CancellationToken, Task<T?>> factory,
            CancellationToken ct,
            int? absoluteExpirationSecondsOverride = null)
            where T : class
        {
            if (_entries.TryGetValue(key, out object? existing))
            {
                return (T?)existing;
            }

            T? created = await factory(ct);

            if (created is not null)
            {
                _entries[key] = created;
            }

            return created;
        }

        public Task RemoveAsync(string key, CancellationToken ct)
        {
            _entries.Remove(key);

            return Task.CompletedTask;
        }
    }
}
