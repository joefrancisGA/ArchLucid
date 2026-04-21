namespace ArchLucid.Core.Feedback;

public interface IFindingFeedbackRepository
{
    Task InsertAsync(FindingFeedbackSubmission submission, CancellationToken cancellationToken = default);
}
