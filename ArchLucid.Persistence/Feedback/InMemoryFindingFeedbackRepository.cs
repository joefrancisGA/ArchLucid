using ArchLucid.Core.Feedback;

namespace ArchLucid.Persistence.Feedback;

public sealed class InMemoryFindingFeedbackRepository : IFindingFeedbackRepository
{
    public Task InsertAsync(FindingFeedbackSubmission submission, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(submission);

        return Task.CompletedTask;
    }
}
