using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Decisioning.Governance.Resolution;

/// <summary>
///     Merges materialized policy-pack rows into one <see cref="PolicyPackContentDocument" /> using precedence rules
///     defined by <see cref="EffectiveGovernanceResolver.GetPrecedenceRank" />.
/// </summary>
internal static class EffectiveGovernanceFacetMerger
{
    /// <summary>
    ///     Merges all facet collections on <paramref name="result" /> from <paramref name="packs" /> and appends summary
    ///     notes.
    /// </summary>
    internal static void Merge(EffectiveGovernanceResolutionResult result, List<ResolvedPackRow> packs)
    {
        ResolveGuidIdList(
            result,
            GovernanceConstants.ItemTypes.ComplianceRule,
            packs,
            x => x.Content.ComplianceRuleIds,
            (content, ids) => content.ComplianceRuleIds = ids);

        ResolveStringKeyList(
            result,
            GovernanceConstants.ItemTypes.ComplianceRuleKey,
            packs,
            x => x.Content.ComplianceRuleKeys,
            (content, keys) => content.ComplianceRuleKeys = keys);

        ResolveGuidIdList(
            result,
            GovernanceConstants.ItemTypes.AlertRule,
            packs,
            x => x.Content.AlertRuleIds,
            (content, ids) => content.AlertRuleIds = ids);

        ResolveGuidIdList(
            result,
            GovernanceConstants.ItemTypes.CompositeAlertRule,
            packs,
            x => x.Content.CompositeAlertRuleIds,
            (content, ids) => content.CompositeAlertRuleIds = ids);

        ResolveDictionary(
            result,
            GovernanceConstants.ItemTypes.AdvisoryDefault,
            packs,
            x => x.Content.AdvisoryDefaults,
            (content, dict) => content.AdvisoryDefaults = dict);

        ResolveDictionary(
            result,
            GovernanceConstants.ItemTypes.Metadata,
            packs,
            x => x.Content.Metadata,
            (content, dict) => content.Metadata = dict);

        ResolveElicitationQuestionList(result, packs);

        result.Notes.Add(string.Format(GovernanceConstants.Notes.ResolvedAssignmentCount, packs.Count));
        result.Notes.Add(string.Format(GovernanceConstants.Notes.ProducedDecisionCount, result.Decisions.Count));
        result.Notes.Add(string.Format(GovernanceConstants.Notes.DetectedConflictCount, result.Conflicts.Count));
    }

    /// <summary>Projects a <see cref="ResolvedPackRow" /> into a <see cref="GovernanceResolutionCandidate" /> for UI/API.</summary>
    private static GovernanceResolutionCandidate ToCandidate(ResolvedPackRow row, string valueJson)
    {
        PolicyPackAssignment a = row.Assignment;
        return new GovernanceResolutionCandidate
        {
            PolicyPackId = row.Pack.PolicyPackId,
            PolicyPackName = row.Pack.Name,
            Version = row.Version.Version,
            ScopeLevel = a.ScopeLevel,
            PrecedenceRank = EffectiveGovernanceResolver.GetPrecedenceRank(a),
            ValueJson = valueJson,
            AssignmentId = a.AssignmentId,
            AssignedUtc = a.AssignedUtc
        };
    }

    /// <summary>
    ///     Deterministic ordering: higher <see cref="GovernanceResolutionCandidate.PrecedenceRank" />, then newer
    ///     <see cref="GovernanceResolutionCandidate.AssignedUtc" />, then
    ///     <see cref="GovernanceResolutionCandidate.AssignmentId" />.
    /// </summary>
    private static List<GovernanceResolutionCandidate> OrderCandidates(
        IEnumerable<GovernanceResolutionCandidate> candidates)
    {
        return candidates
            .OrderByDescending(c => c.PrecedenceRank)
            .ThenByDescending(c => c.AssignedUtc)
            .ThenByDescending(c => c.AssignmentId)
            .ToList();
    }

    /// <summary>Builds operator-facing text explaining why the first candidate in an ordered list won.</summary>
    private static string BuildResolutionReason(List<GovernanceResolutionCandidate> ordered)
    {
        if (ordered.Count == 0)
            return GovernanceConstants.ResolutionReasons.NoCandidates;

        if (ordered.Count == 1)
            return GovernanceConstants.ResolutionReasons.SingleCandidate;

        GovernanceResolutionCandidate winner = ordered[0];
        GovernanceResolutionCandidate second = ordered[1];

        if (winner.PrecedenceRank != second.PrecedenceRank)
            return GovernanceConstants.ResolutionReasons.HigherScopeTier;

        return winner.AssignedUtc != second.AssignedUtc
            ? GovernanceConstants.ResolutionReasons.SameTierNewerAssignment
            : GovernanceConstants.ResolutionReasons.SameTierTieBreak;
    }

    /// <summary>
    ///     Merges a list-valued facet keyed by <see cref="Guid" /> (e.g. compliance / alert rule ids): union of distinct ids,
    ///     winner per id.
    /// </summary>
    private static void ResolveGuidIdList(
        EffectiveGovernanceResolutionResult result,
        string itemType,
        List<ResolvedPackRow> packs,
        Func<ResolvedPackRow, List<Guid>?> selector,
        Action<PolicyPackContentDocument, List<Guid>> setter)
    {
        List<Guid> allIds = packs
            .SelectMany(x => selector(x) ?? [])
            .Distinct()
            .ToList();

        List<Guid> effective = [];

        foreach (Guid id in allIds)
        {
            string raw = id.ToString("D");
            List<GovernanceResolutionCandidate> candidates = OrderCandidates(
                packs
                    .Where(x => (selector(x) ?? []).Contains(id))
                    .Select(x => ToCandidate(x, raw)));

            if (candidates.Count == 0)
                continue;

            candidates[0].WasSelected = true;
            effective.Add(id);

            GovernanceFacetResolutionRecorder.RecordWinnerWithDuplicateConflict(
                result,
                itemType,
                raw,
                candidates,
                BuildResolutionReason(candidates),
                string.Format(GovernanceConstants.Notes.DuplicateDefinitionItem, itemType));
        }

        setter(result.EffectiveContent, effective);
    }

    /// <summary>
    ///     Merges string list facets (e.g. <see cref="PolicyPackContentDocument.ComplianceRuleKeys" />) with
    ///     case-insensitive key equality.
    /// </summary>
    private static void ResolveStringKeyList(
        EffectiveGovernanceResolutionResult result,
        string itemType,
        List<ResolvedPackRow> packs,
        Func<ResolvedPackRow, List<string>?> selector,
        Action<PolicyPackContentDocument, List<string>> setter)
    {
        List<string> allKeys = packs
            .SelectMany(x => selector(x) ?? [])
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        List<string> effective = [];

        foreach (string key in allKeys)
        {
            List<GovernanceResolutionCandidate> candidates = OrderCandidates(
                packs
                    .Where(x => (selector(x) ?? []).Contains(key, StringComparer.OrdinalIgnoreCase))
                    .Select(x =>
                    {
                        List<string> list = selector(x) ?? [];
                        string v = list.First(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));
                        return ToCandidate(x, JsonSerializer.Serialize(v, PolicyPackJsonSerializerOptions.Default));
                    }));

            if (candidates.Count == 0)
                continue;

            candidates[0].WasSelected = true;
            string canonical = packs
                .SelectMany(x => selector(x) ?? [])
                .First(k => string.Equals(k, key, StringComparison.OrdinalIgnoreCase));
            effective.Add(canonical);

            GovernanceFacetResolutionRecorder.RecordWinnerWithDuplicateConflict(
                result,
                itemType,
                canonical,
                candidates,
                BuildResolutionReason(candidates),
                string.Format(GovernanceConstants.Notes.DuplicateDefinitionKey, itemType));
        }

        setter(result.EffectiveContent, effective);
    }

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

    /// <summary>
    ///     One materialized pack contribution: assignment + pack + version + parsed <see cref="PolicyPackContentDocument" />.
    /// </summary>
    internal sealed record ResolvedPackRow(
        PolicyPackAssignment Assignment,
        PolicyPack Pack,
        PolicyPackVersion Version,
        PolicyPackContentDocument Content);
}
