using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Caching;
using ArchLucid.Persistence.Repositories;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class CachingGoldenManifestRepositoryTests
{
    [Fact]
    public async Task GetByIdAsync_uses_hot_path_cache()
    {
        Mock<IGoldenManifestRepository> inner = new();
        Mock<IHotPathReadCache> cache = new();
        ScopeContext scope = NewScope();
        Guid manifestId = Guid.NewGuid();
        ManifestDocument? expected = new() { ManifestId = manifestId };

        cache.Setup(c => c.GetOrCreateAsync(
                HotPathCacheKeys.Manifest(scope, manifestId),
                It.IsAny<Func<CancellationToken, Task<ManifestDocument?>>>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<int?>()))
            .ReturnsAsync(expected);

        CachingGoldenManifestRepository sut = new(inner.Object, cache.Object);

        ManifestDocument? actual = await sut.GetByIdAsync(scope, manifestId, CancellationToken.None);

        actual.Should().BeSameAs(expected);
        inner.Verify(
            i => i.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task SaveAsync_document_evicts_manifest_cache_entry()
    {
        Mock<IGoldenManifestRepository> inner = new();
        Mock<IHotPathReadCache> cache = new();
        ManifestDocument manifest = new()
        {
            ManifestId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        inner.Setup(i => i.SaveAsync(manifest, It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);
        cache.Setup(c => c.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        CachingGoldenManifestRepository sut = new(inner.Object, cache.Object);

        await sut.SaveAsync(manifest, CancellationToken.None);

        cache.Verify(
            c => c.RemoveAsync(HotPathCacheKeys.Manifest(AmbientScope(manifest), manifest.ManifestId), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task SupersedeUnreferencedActiveGoldenManifestsAsync_evicts_after_the_caller_cancels()
    {
        using CancellationTokenSource caller = new();
        Mock<IGoldenManifestRepository> inner = new();
        Mock<IHotPathReadCache> cache = new();
        ScopeContext scope = NewScope();
        Guid newManifestId = Guid.NewGuid();
        Guid supersededId = Guid.NewGuid();

        inner.Setup(i => i.SupersedeUnreferencedActiveGoldenManifestsAsync(
                scope,
                newManifestId,
                null,
                null,
                caller.Token))
            .Returns(() =>
            {
                caller.Cancel();
                return Task.FromResult<IReadOnlyList<Guid>>([supersededId]);
            });
        cache.Setup(c => c.RemoveAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns((string _, CancellationToken token) =>
                token.IsCancellationRequested ? Task.FromCanceled(token) : Task.CompletedTask);

        CachingGoldenManifestRepository sut = new(inner.Object, cache.Object);

        IReadOnlyList<Guid> result = await sut.SupersedeUnreferencedActiveGoldenManifestsAsync(
            scope,
            newManifestId,
            connection: null,
            transaction: null,
            caller.Token);

        result.Should().Equal(supersededId);
        cache.Verify(
            c => c.RemoveAsync(HotPathCacheKeys.Manifest(scope, supersededId), CancellationToken.None),
            Times.Once);
    }

    [Fact]
    public async Task UpdateSealedHasherBoundSliceAsync_evicts_after_write_cancels_the_caller_token()
    {
        using CancellationTokenSource caller = new();
        Mock<IGoldenManifestRepository> inner = new();
        Mock<IHotPathReadCache> cache = new();
        ScopeContext scope = NewScope();
        ManifestDocument manifest = new() { ManifestId = Guid.NewGuid() };
        string cacheKey = HotPathCacheKeys.Manifest(scope, manifest.ManifestId);

        inner.Setup(i => i.UpdateSealedHasherBoundSliceAsync(scope, manifest, caller.Token))
            .Returns(() =>
            {
                caller.Cancel();
                return Task.CompletedTask;
            });
        cache.Setup(c => c.RemoveAsync(cacheKey, It.IsAny<CancellationToken>()))
            .Returns((string _, CancellationToken token) =>
                token.IsCancellationRequested ? Task.FromCanceled(token) : Task.CompletedTask);

        CachingGoldenManifestRepository sut = new(inner.Object, cache.Object);

        await sut.UpdateSealedHasherBoundSliceAsync(scope, manifest, caller.Token);

        cache.Verify(c => c.RemoveAsync(cacheKey, CancellationToken.None), Times.Once);
    }

    private static ScopeContext NewScope()
    {
        return new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
    }

    private static ScopeContext AmbientScope(ManifestDocument manifest)
    {
        return new ScopeContext
        {
            TenantId = manifest.TenantId,
            WorkspaceId = manifest.WorkspaceId,
            ProjectId = manifest.ProjectId,
        };
    }
}
