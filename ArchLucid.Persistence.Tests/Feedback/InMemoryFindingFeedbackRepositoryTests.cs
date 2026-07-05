using ArchLucid.Core.Feedback;
using ArchLucid.Persistence.Feedback;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Feedback;

[Trait("Category", "Unit")]
public sealed class InMemoryFindingFeedbackRepositoryTests
{
    [Fact]
    public async Task InsertAsync_completes_for_valid_submission()
    {
        InMemoryFindingFeedbackRepository sut = new();
        FindingFeedbackSubmission submission = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            FindingId = "finding-1",
            Score = 1,
        };

        Func<Task> act = async () => await sut.InsertAsync(submission, CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task InsertAsync_throws_when_submission_null()
    {
        InMemoryFindingFeedbackRepository sut = new();

        Func<Task> act = async () => await sut.InsertAsync(null!, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }
}
