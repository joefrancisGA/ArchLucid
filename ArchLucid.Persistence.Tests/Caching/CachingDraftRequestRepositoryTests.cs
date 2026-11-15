using ArchLucid.Contracts.Drafts;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.Caching;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CachingDraftRequestRepositoryTests
{
    [Fact]
    public async Task GetAsync_cache_miss_invokes_inner_and_returns_draft()
    {
        Guid tenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        Guid workspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        Guid projectId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        Guid draftId = Guid.Parse("cf9ddef7-3a8b-4e10-aebb-79302e7c691c");
        DraftRequestResponse expected = new() { DraftId = draftId, Status = DraftRequestStatus.Drafting };

        Mock<IDraftRequestRepository> inner = new();
        inner
            .Setup(r => r.GetAsync(
                tenantId,
                workspaceId,
                projectId,
                draftId,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);

        CachingDraftRequestRepository sut = new(inner.Object, new FactoryInvokingHotPathReadCache());

        DraftRequestResponse? actual = await sut.GetAsync(
            tenantId,
            workspaceId,
            projectId,
            draftId,
            CancellationToken.None);

        actual.Should().BeSameAs(expected);
        inner.Verify(
            r => r.GetAsync(
                tenantId,
                workspaceId,
                projectId,
                draftId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task HardDeleteTerminalDraftsBatchAsync_evicts_deleted_draft_from_scoped_cache()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        InMemoryDraftRequestRepository inner = new();
        HybridHotPathReadCache hotPath = HybridHotPathCacheTestFactory.Create(new HotPathCacheOptions());
        CachingDraftRequestRepository repo = new(inner, hotPath);
        DraftRequestDocument document = new() { FreeTextIntent = "Test draft" };

        DraftRequestResponse draft = await inner.CreateAsync(
            tenantId, workspaceId, projectId, "operator", document, CancellationToken.None);
        await inner.UpdateAsync(
            tenantId, workspaceId, projectId, draft.DraftId, DraftRequestStatus.Abandoned,
            document, null, null, CancellationToken.None);
        (await repo.GetAsync(tenantId, workspaceId, projectId, draft.DraftId, CancellationToken.None))
            .Should().NotBeNull();

        DraftIntakeReaperBatchResult batch = await repo.HardDeleteTerminalDraftsBatchAsync(
            DateTimeOffset.UtcNow.AddDays(1), 10, CancellationToken.None);

        batch.DeletedDraftIds.Should().Equal(draft.DraftId);
        (await repo.GetAsync(tenantId, workspaceId, projectId, draft.DraftId, CancellationToken.None))
            .Should().BeNull();
    }
}
