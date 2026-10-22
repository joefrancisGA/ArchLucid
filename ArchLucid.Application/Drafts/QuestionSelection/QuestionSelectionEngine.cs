using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Governance;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Application.Drafts.QuestionSelection;

/// <inheritdoc cref="IQuestionSelectionEngine" />
public sealed class QuestionSelectionEngine(IEffectiveGovernanceLoader effectiveGovernanceLoader) : IQuestionSelectionEngine
{
    private readonly IEffectiveGovernanceLoader _effectiveGovernanceLoader =
        effectiveGovernanceLoader ?? throw new ArgumentNullException(nameof(effectiveGovernanceLoader));

    /// <inheritdoc />
    public async Task<QuestionSelectionResult> SelectAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DraftRequestDocument document,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(document);

        PolicyPackContentDocument effectiveContent = await _effectiveGovernanceLoader.LoadEffectiveContentAsync(
            tenantId,
            workspaceId,
            projectId,
            cancellationToken);

        List<DraftElicitationQuestion> selected = [];
        selected.AddRange(UniversalIntakeQuestions.MustQuestions);
        selected.AddRange(MapExplicitPackQuestions(effectiveContent.ElicitationQuestions));
        selected.AddRange(DerivePackQuestions(effectiveContent));

        List<DraftElicitationQuestion> distinctOrdered = DeduplicateByQuestionKey(selected);

        List<string> requiredMustKeys = [];
        List<DraftElicitationQuestion> pendingMust = [];

        foreach (DraftElicitationQuestion question in distinctOrdered)
        {
            if (question.Tier != ElicitationQuestionTier.Must)
                continue;

            if (HasAnswer(document, question.QuestionKey))
                continue;

            requiredMustKeys.Add(question.QuestionKey);
            pendingMust.Add(question);
        }

        return new QuestionSelectionResult
        {
            AllQuestions = distinctOrdered,
            RequiredMustQuestionKeys = requiredMustKeys,
            PendingMustQuestions = pendingMust,
        };
    }

    private static IEnumerable<DraftElicitationQuestion> MapExplicitPackQuestions(
        IReadOnlyList<ElicitationQuestion> packQuestions)
    {
        foreach (ElicitationQuestion question in packQuestions)
        {
            if (string.IsNullOrWhiteSpace(question.QuestionKey) || string.IsNullOrWhiteSpace(question.Prompt))
                continue;

            yield return new DraftElicitationQuestion
            {
                QuestionKey = question.QuestionKey.Trim(),
                Prompt = question.Prompt.Trim(),
                Tier = question.Tier,
                AnswerKind = question.AnswerKind,
                Source = ElicitationQuestionSource.L1PackExplicit,
                RuleKeys = question.RuleKeys
                    .Where(static key => !string.IsNullOrWhiteSpace(key))
                    .Select(static key => key.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList(),
            };
        }
    }

    private static IEnumerable<DraftElicitationQuestion> DerivePackQuestions(PolicyPackContentDocument effectiveContent)
    {
        HashSet<string> coveredRuleKeys = effectiveContent.ElicitationQuestions
            .SelectMany(static question => question.RuleKeys)
            .Where(static key => !string.IsNullOrWhiteSpace(key))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (string ruleKey in effectiveContent.ComplianceRuleKeys.OrderBy(static key => key, StringComparer.OrdinalIgnoreCase))
        {
            if (string.IsNullOrWhiteSpace(ruleKey))
                continue;

            if (coveredRuleKeys.Contains(ruleKey))
                continue;

            yield return ComplianceRuleKeyQuestionDeriver.Derive(ruleKey);
        }
    }

    private static List<DraftElicitationQuestion> DeduplicateByQuestionKey(IEnumerable<DraftElicitationQuestion> questions)
    {
        Dictionary<string, DraftElicitationQuestion> byKey =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (DraftElicitationQuestion question in questions)
        {
            if (string.IsNullOrWhiteSpace(question.QuestionKey))
                continue;

            byKey.TryAdd(question.QuestionKey.Trim(), question);
        }

        return byKey.Values
            .OrderBy(static question => question.Source)
            .ThenBy(static question => question.QuestionKey, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static bool HasAnswer(DraftRequestDocument document, string questionKey)
    {
        if (!document.QuestionAnswers.TryGetValue(questionKey, out string? answer))
            return false;

        return !string.IsNullOrWhiteSpace(answer);
    }
}
