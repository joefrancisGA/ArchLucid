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
}
