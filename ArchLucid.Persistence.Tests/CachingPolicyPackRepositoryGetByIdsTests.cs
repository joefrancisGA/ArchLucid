using ArchLucid.Persistence.Governance;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class CachingPolicyPackRepositoryGetByIdsTests
{
    [Fact]
    public async Task GetByIdsAsync_empty_or_null_returns_empty_without_inner_calls()
    {
        Mock<IPolicyPackRepository> inner = new();
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions());
        CachingPolicyPackRepository sut = new(inner.Object, hotPath);

        (await sut.GetByIdsAsync([], CancellationToken.None)).Should().BeEmpty();
        (await sut.GetByIdsAsync(null!, CancellationToken.None)).Should().BeEmpty();

        inner.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetByIdsAsync_deduplicates_and_skips_missing_rows()
    {
        Guid presentId = Guid.NewGuid();
        Guid missingId = Guid.NewGuid();
        PolicyPack pack = new()
        {
            PolicyPackId = presentId,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            Name = "pack",
            Description = "desc",
            PackType = PolicyPackType.BuiltIn,
            Status = PolicyPackStatus.Draft,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            CurrentVersion = "1.0.0",
        };

        Mock<IPolicyPackRepository> inner = new();
        inner.Setup(r => r.GetByIdsAsync(
                It.Is<IReadOnlyCollection<Guid>>(ids =>
                    ids.Count == 2
                    && ids.Contains(presentId)
                    && ids.Contains(missingId)),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { pack });

        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions());
        CachingPolicyPackRepository sut = new(inner.Object, hotPath);

        IReadOnlyList<PolicyPack> rows =
            await sut.GetByIdsAsync([presentId, presentId, missingId], CancellationToken.None);

        rows.Should().ContainSingle().Which.PolicyPackId.Should().Be(presentId);
        inner.Verify(
            r => r.GetByIdsAsync(
                It.Is<IReadOnlyCollection<Guid>>(ids =>
                    ids.Count == 2
                    && ids.Contains(presentId)
                    && ids.Contains(missingId)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task GetByIdsAsync_does_not_restore_stale_metadata_to_single_read_cache()
    {
        Guid id = Guid.NewGuid();
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        PolicyPack Pack(string version) => new()
        {
            PolicyPackId = id,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            Name = "pack",
            CurrentVersion = version,
        };

        PolicyPack oldPack = Pack("1.0.0");
        PolicyPack currentPack = Pack("2.0.0");
        TaskCompletionSource<IReadOnlyList<PolicyPack>> pending = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IPolicyPackRepository> inner = new();
        inner.Setup(repo => repo.GetByIdsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), CancellationToken.None))
            .Returns(pending.Task);
        inner.Setup(repo => repo.GetByIdAsync(id, CancellationToken.None))
            .ReturnsAsync(currentPack);
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions());
        CachingPolicyPackRepository sut = new(inner.Object, hotPath);

        Task<IReadOnlyList<PolicyPack>> batch = sut.GetByIdsAsync([id], CancellationToken.None);
        await sut.UpdateAsync(currentPack, CancellationToken.None);
        pending.SetResult([oldPack]);
        (await batch).Should().ContainSingle().Which.CurrentVersion.Should().Be("1.0.0");

        PolicyPack? after = await sut.GetByIdAsync(id, CancellationToken.None);

        after.Should().NotBeNull();
        after!.CurrentVersion.Should().Be("2.0.0");
    }
}
