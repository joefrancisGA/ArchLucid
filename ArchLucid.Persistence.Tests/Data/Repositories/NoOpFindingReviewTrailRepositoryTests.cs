using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
public sealed class NoOpFindingReviewTrailRepositoryTests
{
    [Fact]
    public async Task AppendAsync_completes_without_side_effects()
    {
        NoOpFindingReviewTrailRepository sut = new();
        FindingReviewEventRecord reviewEvent = new()
        {
            FindingId = "finding-1",
            Action = FindingReviewAction.Approve,
        };

        Func<Task> act = async () => await sut.AppendAsync(reviewEvent, CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task ListByFindingAsync_returns_empty_list()
    {
        NoOpFindingReviewTrailRepository sut = new();

        IReadOnlyList<FindingReviewEventRecord> rows = await sut.ListByFindingAsync(
            Guid.NewGuid(),
            "finding-1",
            CancellationToken.None);

        rows.Should().BeEmpty();
    }

    [Fact]
    public async Task ListSinceUtcAsync_returns_empty_list()
    {
        NoOpFindingReviewTrailRepository sut = new();

        IReadOnlyList<FindingReviewEventRecord> rows = await sut.ListSinceUtcAsync(
            Guid.NewGuid(),
            DateTimeOffset.UtcNow.AddDays(-1),
            CancellationToken.None);

        rows.Should().BeEmpty();
    }
}
