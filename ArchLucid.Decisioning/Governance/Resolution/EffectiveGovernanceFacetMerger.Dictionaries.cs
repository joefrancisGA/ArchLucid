using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Decisioning.Governance.Resolution;

internal static partial class EffectiveGovernanceFacetMerger
{
    /// <summary>
    ///     Merges dictionary facets (<see cref="PolicyPackContentDocument.AdvisoryDefaults" />,
    ///     <see cref="PolicyPackContentDocument.Metadata" />):
    ///     last-winner per key by precedence; <c>ValueConflict</c> when values differ across packs.
    /// </summary>
    private static void ResolveDictionary(
        EffectiveGovernanceResolutionResult result,
        string itemType,
        List<ResolvedPackRow> packs,
        Func<ResolvedPackRow, Dictionary<string, string>?> selector,
        Action<PolicyPackContentDocument, Dictionary<string, string>> setter)
    {
        List<string> keys = packs
            .SelectMany(x => (selector(x) ?? []).Keys)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

#pragma warning disable IDE0028 // Simplify collection initialization
        Dictionary<string, string> effective = new(StringComparer.OrdinalIgnoreCase);
#pragma warning restore IDE0028 // Simplify collection initialization

        foreach (string key in keys)
        {
            List<GovernanceResolutionCandidate> candidates = OrderCandidates(
                packs
                    .Where(x =>
                        (selector(x) ?? []).Keys.Any(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase)))
                    .Select(x =>
                    {
                        Dictionary<string, string> dict = selector(x) ?? [];
                        string actualKey =
                            dict.Keys.First(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));
                        string val = dict[actualKey];
                        return ToCandidate(x, val);
                    }));

            if (candidates.Count == 0)
                continue;

            candidates[0].WasSelected = true;
            string canonicalKey = packs
                .SelectMany(x => (selector(x) ?? []).Keys)
                .First(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));
            effective[canonicalKey] = candidates[0].ValueJson;

            GovernanceFacetResolutionRecorder.RecordWinner(
                result,
                itemType,
                canonicalKey,
                candidates,
                BuildResolutionReason(candidates));

            GovernanceFacetResolutionRecorder.RecordValueConflict(
                result,
                itemType,
                canonicalKey,
                candidates,
                string.Format(GovernanceConstants.Notes.ValueConflict, itemType, canonicalKey));
        }

        setter(result.EffectiveContent, effective);
    }

    /// <summary>
    ///     Merges <see cref="PolicyPackContentDocument.ElicitationQuestions" /> by <see cref="ElicitationQuestion.QuestionKey" />
    ///     with the same precedence rules as other list facets.
    /// </summary>
    private static void ResolveElicitationQuestionList(
        EffectiveGovernanceResolutionResult result,
        List<ResolvedPackRow> packs)
    {
        List<string> allKeys = packs
            .SelectMany(static row => row.Content.ElicitationQuestions)
            .Select(static question => question.QuestionKey)
            .Where(static key => !string.IsNullOrWhiteSpace(key))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        List<ElicitationQuestion> effective = [];

        foreach (string key in allKeys)
        {
            List<GovernanceResolutionCandidate> candidates = OrderCandidates(
                packs
                    .Where(row => row.Content.ElicitationQuestions.Exists(question =>
                        string.Equals(question.QuestionKey, key, StringComparison.OrdinalIgnoreCase)))
                    .Select(row =>
                    {
                        ElicitationQuestion question = row.Content.ElicitationQuestions.First(q =>
                            string.Equals(q.QuestionKey, key, StringComparison.OrdinalIgnoreCase));

                        string valueJson = JsonSerializer.Serialize(question, PolicyPackJsonSerializerOptions.Default);

                        return ToCandidate(row, valueJson);
                    }));

            if (candidates.Count == 0)
                continue;

            candidates[0].WasSelected = true;

            ElicitationQuestion? winningQuestion = JsonSerializer.Deserialize<ElicitationQuestion>(
                candidates[0].ValueJson,
                PolicyPackJsonSerializerOptions.Default);

            if (winningQuestion is null)
                continue;

            effective.Add(winningQuestion);

            string canonicalKey = packs
                .SelectMany(static row => row.Content.ElicitationQuestions)
                .Select(static question => question.QuestionKey)
                .First(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));

            GovernanceFacetResolutionRecorder.RecordWinnerWithDuplicateConflict(
                result,
                GovernanceConstants.ItemTypes.ElicitationQuestion,
                canonicalKey,
                candidates,
                BuildResolutionReason(candidates),
                string.Format(
                    GovernanceConstants.Notes.DuplicateDefinitionKey,
                    GovernanceConstants.ItemTypes.ElicitationQuestion));

            GovernanceFacetResolutionRecorder.RecordValueConflict(
                result,
                GovernanceConstants.ItemTypes.ElicitationQuestion,
                canonicalKey,
                candidates,
                string.Format(
                    GovernanceConstants.Notes.ValueConflict,
                    GovernanceConstants.ItemTypes.ElicitationQuestion,
                    canonicalKey));
        }

        result.EffectiveContent.ElicitationQuestions = effective;
    }
}
