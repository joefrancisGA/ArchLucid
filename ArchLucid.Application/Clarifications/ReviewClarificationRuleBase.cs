using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Clarifications;

/// <summary>Shared helpers for finding-type clarification rules.</summary>
public abstract class ReviewClarificationRuleBase : IReviewClarificationRule
{
    public abstract string SupportedFindingType { get; }

    public abstract IEnumerable<ReviewClarificationQuestion> Derive(Finding finding);

    protected static ReviewClarificationQuestion BuildQuestion(
        Finding finding,
        string missingItem,
        string prompt)
    {
        return new ReviewClarificationQuestion
        {
            QuestionId = ReviewClarificationQuestionIdBuilder.Build(finding.FindingType, missingItem),
            Prompt = prompt,
            SourceFindingId = finding.FindingId,
            SourceFindingType = finding.FindingType,
            Severity = finding.Severity,
            MissingItem = missingItem,
        };
    }
}
