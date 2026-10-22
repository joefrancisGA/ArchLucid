using System.Text.Json;

using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Decisioning.Governance.Resolution;

internal static partial class EffectiveGovernanceFacetMerger
{
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
}
