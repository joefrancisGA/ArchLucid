using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Drafts.QuestionSelection;

/// <summary>
///     Cold-start L1 prompts derived from effective <c>complianceRuleKeys</c> when packs lack explicit questions (ADR 0051).
/// </summary>
public static class ComplianceRuleKeyQuestionDeriver
{
    private const string DerivedKeyPrefix = "l1.rule.";

    /// <summary>Builds a SHOULD-tier derived question for a governance rule key.</summary>
    public static DraftElicitationQuestion Derive(string ruleKey)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(ruleKey);

        string trimmedKey = ruleKey.Trim();

        return new DraftElicitationQuestion
        {
            QuestionKey = $"{DerivedKeyPrefix}{trimmedKey}",
            Prompt = $"Does your design address the '{trimmedKey}' governance requirement?",
            Tier = ElicitationQuestionTier.Should,
            AnswerKind = ElicitationAnswerKind.Text,
            Source = ElicitationQuestionSource.L1PackDerived,
            RuleKeys = [trimmedKey],
        };
    }

    /// <summary>Returns <see langword="true" /> when <paramref name="questionKey" /> is a derived rule prompt key.</summary>
    public static bool IsDerivedKey(string questionKey) =>
        questionKey.StartsWith(DerivedKeyPrefix, StringComparison.OrdinalIgnoreCase);
}
