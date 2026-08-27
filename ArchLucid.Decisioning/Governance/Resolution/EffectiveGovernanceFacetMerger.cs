using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Decisioning.Governance.PolicyPacks;

namespace ArchLucid.Decisioning.Governance.Resolution;

/// <summary>
///     Merges materialized policy-pack rows into one <see cref="PolicyPackContentDocument" /> using precedence rules
///     defined by <see cref="EffectiveGovernanceResolver.GetPrecedenceRank" />.
/// </summary>
internal static partial class EffectiveGovernanceFacetMerger
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
    ///     One materialized pack contribution: assignment + pack + version + parsed <see cref="PolicyPackContentDocument" />.
    /// </summary>
    internal sealed record ResolvedPackRow(
        PolicyPackAssignment Assignment,
        PolicyPack Pack,
        PolicyPackVersion Version,
        PolicyPackContentDocument Content);
}
