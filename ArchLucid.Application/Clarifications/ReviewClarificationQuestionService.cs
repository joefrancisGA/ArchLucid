using ArchLucid.Application;
using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Clarifications;

public sealed class ReviewClarificationQuestionService(
    IAuthorityQueryService authorityQueryService,
    ReviewClarificationQuestionDeriver questionDeriver,
    ReviewClarificationDeltaComputer deltaComputer) : IReviewClarificationQuestionService
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly ReviewClarificationQuestionDeriver _questionDeriver =
        questionDeriver ?? throw new ArgumentNullException(nameof(questionDeriver));

    private readonly ReviewClarificationDeltaComputer _deltaComputer =
        deltaComputer ?? throw new ArgumentNullException(nameof(deltaComputer));

    public async Task<ReviewClarificationQuestionsResponse> GetQuestionsAsync(
        ScopeContext scope,
        Guid runId,
        Guid? priorRunId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(scope);

        RunDetailDto? detail = await _authorityQueryService.GetRunDetailAsync(scope, runId, cancellationToken);

        if (detail is null)
            throw new RunNotFoundException(runId.ToString("N"));

        FindingsSnapshot? findingsSnapshot = detail.FindingsSnapshot;
        IReadOnlyList<Finding> findings = findingsSnapshot?.Findings ?? [];
        ReviewClarificationDeriverResult derived = _questionDeriver.Derive(findings);

        ReviewClarificationDelta? delta = null;

        if (priorRunId.HasValue && priorRunId.Value != Guid.Empty)
        {
            RunDetailDto? priorDetail =
                await _authorityQueryService.GetRunDetailAsync(scope, priorRunId.Value, cancellationToken);

            if (priorDetail is not null)
            {
                IReadOnlyList<Finding> priorFindings = priorDetail.FindingsSnapshot?.Findings ?? [];
                ReviewClarificationDeriverResult priorDerived = _questionDeriver.Derive(priorFindings);
                IReadOnlyList<string> assertedQuestionIds = ExtractAssertedQuestionIds(detail);

                delta = _deltaComputer.Compute(
                    priorRunId.Value.ToString("N"),
                    priorDerived.Questions,
                    derived.Questions,
                    assertedQuestionIds);
            }
        }

        return new ReviewClarificationQuestionsResponse
        {
            RunId = runId.ToString("N"),
            Questions = derived.Questions.ToList(),
            TotalDerivedCount = derived.TotalDerivedCount,
            ClarificationRoundAvailable = derived.Questions.Count > 0,
            DeltaFromPriorRun = delta,
        };
    }

    private static IReadOnlyList<string> ExtractAssertedQuestionIds(RunDetailDto detail)
    {
        List<string> assumptions = detail.GoldenManifest?.Assumptions ?? [];

        return OperatorAssertedClarificationAnswerParser.ExtractQuestionIds(assumptions);
    }
}
