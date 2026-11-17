using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Governance;

using Moq;

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
    public async Task Publishing_evicts_version_and_list_when_request_cancels_after_write()
    {
        Guid packId = Guid.NewGuid();
        const string version = "1.0.0";
        const string content = "{}";
        using CancellationTokenSource cancellation = new();
        PolicyPackVersion published = new() { PolicyPackId = packId, Version = version, ContentJson = content };
        Mock<IPolicyPackVersionRepository> inner = new();
        inner.Setup(repository => repository.UpsertPublishedVersionAsync(packId, version, content, cancellation.Token))
            .Callback(cancellation.Cancel)
            .ReturnsAsync((published, null));

        Mock<IHotPathReadCache> cache = new();
        cache.Setup(store => store.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns((string _, CancellationToken token) =>
                token.IsCancellationRequested ? Task.FromCanceled(token) : Task.CompletedTask);

        CachingPolicyPackVersionRepository repository = new(inner.Object, cache.Object);
        (PolicyPackVersion saved, _) = await repository.UpsertPublishedVersionAsync(
            packId, version, content, cancellation.Token);

        saved.Should().BeSameAs(published);
        cache.Verify(store => store.RemoveAsync(HotPathCacheKeys.PolicyPackVersionList(packId), CancellationToken.None), Times.Once);
        cache.Verify(store => store.RemoveAsync(HotPathCacheKeys.PolicyPackVersion(packId, version), CancellationToken.None), Times.Once);
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
