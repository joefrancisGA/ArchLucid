using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Application.Drafts.PriorAnswerReuse;

/// <summary>
///     Pre-fills unanswered elicitation keys on a new draft from prior run-spawned drafts in the
///     same tenant/workspace/project scope (repeat-pilot answer reuse). Cross-tenant reuse is forbidden (ADR 0031).
/// </summary>
public static class DraftPriorAnswerReuseApplicator
{
    /// <summary>Maximum number of prior run-spawned drafts scanned for reusable answers.</summary>
    public const int MaxPriorDrafts = 5;

    /// <summary>
    ///     Copies non-empty answers from <paramref name="priorRunSpawnedDraftsNewestFirst" /> into
    ///     <paramref name="document" /> when the current draft has no answer for that question key.
    ///     Records reuse provenance on the transparency trail.
    /// </summary>
    public static DraftPriorAnswerReuseResult Apply(
        DraftRequestDocument document,
        IReadOnlyList<DraftRequestResponse> priorRunSpawnedDraftsNewestFirst)
    {
        ArgumentNullException.ThrowIfNull(document);
        ArgumentNullException.ThrowIfNull(priorRunSpawnedDraftsNewestFirst);

        List<string> reusedKeys = [];

        foreach (DraftRequestResponse prior in priorRunSpawnedDraftsNewestFirst)
        {
            if (prior.Document.QuestionAnswers.Count == 0)
                continue;

            foreach (KeyValuePair<string, string> entry in prior.Document.QuestionAnswers)
            {
                if (string.IsNullOrWhiteSpace(entry.Key) || string.IsNullOrWhiteSpace(entry.Value))
                    continue;

                string questionKey = entry.Key.Trim();

                if (HasAnswer(document, questionKey))
                    continue;

                string answer = entry.Value.Trim();
                document.QuestionAnswers[questionKey] = answer;
                RecordAssertedAnswer(document, questionKey, answer);
                RecordReuseProvenance(document, questionKey, prior.DraftId);
                reusedKeys.Add(questionKey);
            }
        }

        return new DraftPriorAnswerReuseResult
        {
            ReusedCount = reusedKeys.Count,
            ReusedQuestionKeys = reusedKeys,
        };
    }

    private static bool HasAnswer(DraftRequestDocument document, string questionKey)
    {
        if (!document.QuestionAnswers.TryGetValue(questionKey, out string? answer))
            return false;

        return !string.IsNullOrWhiteSpace(answer);
    }

    private static void RecordAssertedAnswer(DraftRequestDocument document, string questionKey, string answer)
    {
        UpsertAsserted(document.TransparencyTrail, $"answer.{questionKey}", answer);
    }

    private static void RecordReuseProvenance(DraftRequestDocument document, string questionKey, Guid sourceDraftId)
    {
        UpsertAsserted(document.TransparencyTrail, $"reused.answer.{questionKey}", sourceDraftId.ToString("D"));
    }

    private static void UpsertAsserted(TransparencyTrail trail, string key, string value)
    {
        AssertedTrailEntry? existing = trail.Asserted.Find(entry =>
            string.Equals(entry.Key, key, StringComparison.OrdinalIgnoreCase));

        if (existing is null)
        {
            trail.Asserted.Add(new AssertedTrailEntry { Key = key, Value = value });

            return;
        }

        existing.Value = value;
    }
}
