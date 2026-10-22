using ArchLucid.Contracts.Clarifications;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Clarifications;

public interface IReviewClarificationQuestionService
{
    Task<ReviewClarificationQuestionsResponse> GetQuestionsAsync(
        ScopeContext scope,
        Guid runId,
        Guid? priorRunId,
        CancellationToken cancellationToken);
}
