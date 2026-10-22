namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Maps applied clarification question ids to κ element ids for scoped incremental re-review.
/// </summary>
internal static class ClarificationAnswerAffectedElementResolver
{
    public static List<string> Resolve(IReadOnlyDictionary<string, string> answers)
    {
        ArgumentNullException.ThrowIfNull(answers);

        HashSet<string> elementIds = new(StringComparer.Ordinal);

        foreach (KeyValuePair<string, string> entry in answers)
        {
            string questionId = entry.Key?.Trim() ?? string.Empty;
            string answer = entry.Value?.Trim() ?? string.Empty;

            if (questionId.Length == 0 || answer.Length == 0)
                continue;

            if (questionId.StartsWith(
                    KnowledgeModelClarificationAnswerApplicator.KnowledgeModelQuestionIdPrefix,
                    StringComparison.OrdinalIgnoreCase))
            {
                string elementId = questionId[
                    KnowledgeModelClarificationAnswerApplicator.KnowledgeModelQuestionIdPrefix.Length..];

                if (elementId.Length > 0)
                    elementIds.Add(elementId);

                continue;
            }

            if (KnowledgeModelClarificationAnswerApplicator.IsFindingClarificationQuestionId(questionId))
                elementIds.Add(KnowledgeModelClarificationAnswerApplicator.BuildFindingClarificationElementId(questionId));
        }

        return elementIds.OrderBy(static id => id, StringComparer.Ordinal).ToList();
    }
}
