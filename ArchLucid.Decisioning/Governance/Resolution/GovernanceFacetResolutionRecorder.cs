using ArchLucid.Contracts.Governance.Resolution;

namespace ArchLucid.Decisioning.Governance.Resolution;

/// <summary>Shared decision/conflict recording for effective-governance facet merge helpers.</summary>
internal static class GovernanceFacetResolutionRecorder
{
    public static void RecordWinner(
        EffectiveGovernanceResolutionResult result,
        string itemType,
        string itemKey,
        List<GovernanceResolutionCandidate> candidates,
        string resolutionReason)
    {
        result.Decisions.Add(new GovernanceResolutionDecision
        {
            ItemType = itemType,
            ItemKey = itemKey,
            WinningPolicyPackId = candidates[0].PolicyPackId,
            WinningPolicyPackName = candidates[0].PolicyPackName,
            WinningVersion = candidates[0].Version,
            WinningScopeLevel = candidates[0].ScopeLevel,
            ResolutionReason = resolutionReason,
            Candidates = candidates
        });
    }

    public static void RecordWinnerWithDuplicateConflict(
        EffectiveGovernanceResolutionResult result,
        string itemType,
        string itemKey,
        List<GovernanceResolutionCandidate> candidates,
        string resolutionReason,
        string duplicateConflictDescription)
    {
        RecordWinner(result, itemType, itemKey, candidates, resolutionReason);

        if (candidates.Count <= 1)
            return;

        result.Conflicts.Add(new GovernanceConflictRecord
        {
            ItemType = itemType,
            ItemKey = itemKey,
            ConflictType = GovernanceConstants.ConflictTypes.DuplicateDefinition,
            Description = duplicateConflictDescription,
            Candidates = candidates
        });
    }

    public static void RecordValueConflict(
        EffectiveGovernanceResolutionResult result,
        string itemType,
        string itemKey,
        List<GovernanceResolutionCandidate> candidates,
        string valueConflictDescription)
    {
        if (candidates.Count <= 1)
            return;

        int distinctValues = candidates
            .Select(static candidate => candidate.ValueJson)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();

        if (distinctValues <= 1)
            return;

        result.Conflicts.Add(new GovernanceConflictRecord
        {
            ItemType = itemType,
            ItemKey = itemKey,
            ConflictType = GovernanceConstants.ConflictTypes.ValueConflict,
            Description = valueConflictDescription,
            Candidates = candidates
        });
    }
}
