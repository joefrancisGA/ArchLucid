using ArchLucid.Contracts.Clarifications;

namespace ArchLucid.Application.Clarifications;

/// <summary>Computes question-id deltas between prior and current clarification rounds.</summary>
public sealed class ReviewClarificationDeltaComputer
{
    public ReviewClarificationDelta Compute(
        string priorRunId,
        IReadOnlyList<ReviewClarificationQuestion> priorQuestions,
        IReadOnlyList<ReviewClarificationQuestion> currentQuestions,
        IReadOnlyCollection<string> assertedQuestionIds)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(priorRunId);
        ArgumentNullException.ThrowIfNull(priorQuestions);
        ArgumentNullException.ThrowIfNull(currentQuestions);
        ArgumentNullException.ThrowIfNull(assertedQuestionIds);

        HashSet<string> priorIds = priorQuestions
            .Select(static question => question.QuestionId)
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .ToHashSet(StringComparer.Ordinal);

        HashSet<string> currentIds = currentQuestions
            .Select(static question => question.QuestionId)
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .ToHashSet(StringComparer.Ordinal);

        HashSet<string> assertedIds = assertedQuestionIds
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .ToHashSet(StringComparer.Ordinal);

        List<string> stillOpen = priorIds.Intersect(currentIds).OrderBy(static id => id, StringComparer.Ordinal).ToList();
        List<string> resolved = priorIds.Except(currentIds).OrderBy(static id => id, StringComparer.Ordinal).ToList();
        List<string> resolvedByAssertion = resolved
            .Where(assertedIds.Contains)
            .ToList();
        List<string> resolvedByEvidence = resolved
            .Where(id => !assertedIds.Contains(id))
            .ToList();

        return new ReviewClarificationDelta
        {
            PriorRunId = priorRunId.Trim(),
            ResolvedByEvidenceQuestionIds = resolvedByEvidence,
            ResolvedByAssertionQuestionIds = resolvedByAssertion,
            StillOpenQuestionIds = stillOpen,
        };
    }
}
