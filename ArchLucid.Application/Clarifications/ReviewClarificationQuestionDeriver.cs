using ArchLucid.Contracts.Clarifications;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Clarifications;

/// <summary>Applies clarification rules, dedupes, sorts by severity, and caps surfaced questions.</summary>
public sealed class ReviewClarificationQuestionDeriver
{
    public const int MaxSurfacedQuestions = 7;

    private readonly IReadOnlyDictionary<string, IReviewClarificationRule> _rulesByFindingType;

    public ReviewClarificationQuestionDeriver(IEnumerable<IReviewClarificationRule> rules)
    {
        ArgumentNullException.ThrowIfNull(rules);

        _rulesByFindingType = rules.ToDictionary(
            static rule => rule.SupportedFindingType,
            static rule => rule,
            StringComparer.OrdinalIgnoreCase);
    }

    public ReviewClarificationDeriverResult Derive(IReadOnlyList<Finding> findings)
    {
        ArgumentNullException.ThrowIfNull(findings);

        List<ReviewClarificationQuestion> derived = [];

        foreach (Finding finding in findings)
        {
            if (string.IsNullOrWhiteSpace(finding.FindingType))
                continue;

            if (!_rulesByFindingType.TryGetValue(finding.FindingType, out IReviewClarificationRule? rule))
                continue;

            derived.AddRange(rule.Derive(finding));
        }

        List<ReviewClarificationQuestion> deduped = DeduplicateByQuestionId(derived);
        int totalDerivedCount = deduped.Count;

        List<ReviewClarificationQuestion> surfaced = deduped
            .OrderByDescending(static question => question.Severity)
            .ThenBy(static question => question.QuestionId, StringComparer.Ordinal)
            .Take(MaxSurfacedQuestions)
            .ToList();

        return new ReviewClarificationDeriverResult(surfaced, totalDerivedCount);
    }

    private static List<ReviewClarificationQuestion> DeduplicateByQuestionId(
        IReadOnlyList<ReviewClarificationQuestion> questions)
    {
        Dictionary<string, ReviewClarificationQuestion> byId = new(StringComparer.Ordinal);

        foreach (ReviewClarificationQuestion question in questions)
        {
            if (string.IsNullOrWhiteSpace(question.QuestionId))
                continue;

            if (!byId.TryGetValue(question.QuestionId, out ReviewClarificationQuestion? existing))
            {
                byId[question.QuestionId] = question;
                continue;
            }

            if (question.Severity > existing.Severity)
                byId[question.QuestionId] = question;
        }

        return byId.Values.ToList();
    }
}

public sealed record ReviewClarificationDeriverResult(
    IReadOnlyList<ReviewClarificationQuestion> Questions,
    int TotalDerivedCount);
