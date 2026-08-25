using ArchLucid.Application;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Clarifications;

public sealed class ReviewClarificationQuestionService(
    IAuthorityQueryService authorityQueryService,
    ReviewClarificationQuestionDeriver questionDeriver,
    ReviewClarificationDeltaComputer deltaComputer,
    IArchitectureKnowledgeModelAccess? knowledgeModelAccess = null) : IReviewClarificationQuestionService
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly ReviewClarificationQuestionDeriver _questionDeriver =
        questionDeriver ?? throw new ArgumentNullException(nameof(questionDeriver));

    private readonly ReviewClarificationDeltaComputer _deltaComputer =
        deltaComputer ?? throw new ArgumentNullException(nameof(deltaComputer));

    private readonly IArchitectureKnowledgeModelAccess? _knowledgeModelAccess = knowledgeModelAccess;

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
        IReadOnlyList<ReviewClarificationQuestion> modelQuestions = await DeriveKnowledgeModelQuestionsAsync(
            scope,
            runId,
            cancellationToken);
        List<ReviewClarificationQuestion> mergedQuestions = MergeInterviewQuestions(modelQuestions, derived.Questions);

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
                    mergedQuestions,
                    assertedQuestionIds);
            }
        }

        return new ReviewClarificationQuestionsResponse
        {
            RunId = runId.ToString("N"),
            Questions = mergedQuestions,
            TotalDerivedCount = modelQuestions.Count + derived.TotalDerivedCount,
            ClarificationRoundAvailable = mergedQuestions.Count > 0,
            DeltaFromPriorRun = delta,
        };
    }

    private async Task<IReadOnlyList<ReviewClarificationQuestion>> DeriveKnowledgeModelQuestionsAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        if (_knowledgeModelAccess is null)
            return [];

        ArchitectureKnowledgeModel? model = await _knowledgeModelAccess
            .GetForRunAsync(scope, runId, cancellationToken)
            .ConfigureAwait(false);

        return KnowledgeModelInterviewQuestionDeriver.Derive(model);
    }

    private static List<ReviewClarificationQuestion> MergeInterviewQuestions(
        IReadOnlyList<ReviewClarificationQuestion> modelQuestions,
        IReadOnlyList<ReviewClarificationQuestion> findingsQuestions)
    {
        Dictionary<string, ReviewClarificationQuestion> merged = new(StringComparer.Ordinal);

        foreach (ReviewClarificationQuestion question in modelQuestions)
        {
            if (string.IsNullOrWhiteSpace(question.QuestionId))
                continue;

            merged[question.QuestionId] = question;
        }

        foreach (ReviewClarificationQuestion question in findingsQuestions)
        {
            if (string.IsNullOrWhiteSpace(question.QuestionId))
                continue;

            if (!merged.ContainsKey(question.QuestionId))
                merged[question.QuestionId] = question;
        }

        return merged.Values
            .OrderByDescending(static question => question.Severity)
            .ThenBy(static question => question.QuestionId, StringComparer.Ordinal)
            .Take(ReviewClarificationQuestionDeriver.MaxSurfacedQuestions)
            .ToList();
    }

    private static IReadOnlyList<string> ExtractAssertedQuestionIds(RunDetailDto detail)
    {
        List<string> assumptions = detail.GoldenManifest?.Assumptions ?? [];

        return OperatorAssertedClarificationAnswerParser.ExtractQuestionIds(assumptions);
    }
}
