using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Persistence.Governance;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class CachingPolicyPackVersionRepositoryTests
{
    [SkippableFact]
    public async Task Publishing_a_version_evicts_a_cached_miss_for_different_casing()
    {
        CachingPolicyPackVersionRepository repository = CreateRepository();
        Guid packId = Guid.NewGuid();
        CancellationToken ct = CancellationToken.None;

        (await repository.GetByPackAndVersionAsync(packId, "1.0.0-RC.1", ct)).Should().BeNull();
        await repository.UpsertPublishedVersionAsync(packId, "1.0.0-rc.1", "{}", ct);

        PolicyPackVersion? found = await repository.GetByPackAndVersionAsync(packId, "1.0.0-RC.1", ct);
        found.Should().NotBeNull();
        found!.Version.Should().Be("1.0.0-rc.1");
    }

    [SkippableFact]
    public async Task Updating_a_version_evicts_a_cached_hit_for_different_casing()
    {
        CachingPolicyPackVersionRepository repository = CreateRepository();
        PolicyPackVersion version = new()
        {
            PolicyPackId = Guid.NewGuid(),
            Version = "1.0.0-rc.1",
            ContentJson = "{}",
        };
        CancellationToken ct = CancellationToken.None;
        await repository.CreateAsync(version, ct);
        (await repository.GetByPackAndVersionAsync(version.PolicyPackId, "1.0.0-RC.1", ct))
            .Should().NotBeNull();

        await repository.UpdateAsync(new PolicyPackVersion
        {
            PolicyPackId = version.PolicyPackId,
            PolicyPackVersionId = version.PolicyPackVersionId,
            Version = version.Version,
            ContentJson = "{\"updated\":true}",
        }, ct);

        PolicyPackVersion? found = await repository.GetByPackAndVersionAsync(version.PolicyPackId, "1.0.0-RC.1", ct);
        found.Should().NotBeNull();
        found!.ContentJson.Should().Be("{\"updated\":true}");
    }

    private static CachingPolicyPackVersionRepository CreateRepository()
    {
        return new CachingPolicyPackVersionRepository(
            new InMemoryPolicyPackVersionRepository(),
            HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions { AbsoluteExpirationSeconds = 60 }));
    }
}
