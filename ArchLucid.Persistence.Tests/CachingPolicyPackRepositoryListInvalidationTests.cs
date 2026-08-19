using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Persistence.Governance;

namespace ArchLucid.Persistence.Tests;

/// <summary>
///     Ensures policy-pack writes bump the scope revision stamp so list caches refresh before TTL expiry (TB-581).
/// </summary>
[Trait("Suite", "Core")]
public sealed class CachingPolicyPackRepositoryListInvalidationTests
{
    [SkippableFact]
    public async Task CreateAsync_refreshes_cached_ListByScopeAsync()
    {
        HotPathCacheOptions options = new() { AbsoluteExpirationSeconds = 3600 };
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(options);
        InMemoryPolicyPackRepository inner = new();
        CachingPolicyPackRepository repo = new(inner, hotPath);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        PolicyPack first = new()
        {
            PolicyPackId = Guid.NewGuid(),
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Name = "Pack A",
            Description = "desc",
            PackType = PolicyPackType.BuiltIn,
            Status = PolicyPackStatus.Draft,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CurrentVersion = "1.0.0",
        };

        await inner.CreateAsync(first, CancellationToken.None);

        IReadOnlyList<PolicyPack> beforeSecondCreate =
            await repo.ListByScopeAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        beforeSecondCreate.Select(p => p.PolicyPackId).Should().Equal(first.PolicyPackId);

        PolicyPack second = new()
        {
            PolicyPackId = Guid.NewGuid(),
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Name = "Pack B",
            Description = "desc",
            PackType = PolicyPackType.BuiltIn,
            Status = PolicyPackStatus.Draft,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CurrentVersion = "1.0.0",
        };

        await repo.CreateAsync(second, CancellationToken.None);

        IReadOnlyList<PolicyPack> afterSecondCreate =
            await repo.ListByScopeAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        afterSecondCreate.Select(p => p.PolicyPackId).Should().Equal(second.PolicyPackId, first.PolicyPackId);
    }
}
