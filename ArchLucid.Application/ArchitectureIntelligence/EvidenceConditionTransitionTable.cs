using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Explicit legal transitions for <see cref="EvidenceCondition" /> (TB-1985).</summary>
public static class EvidenceConditionTransitionTable
{
    private static readonly EvidenceConditionTransitionRule[] Rules =
        Enum.GetValues<EvidenceCondition>()
            .SelectMany(from => Enum.GetValues<EvidenceConditionLifecycleEvent>()
                .Select(lifecycleEvent => Rule(from, lifecycleEvent, MapEventToCondition(lifecycleEvent))))
            .ToArray();

    public static IReadOnlyList<EvidenceConditionTransitionRule> DocumentedRules => Rules;

    public static bool IsLegalTransition(
        EvidenceCondition from,
        EvidenceConditionLifecycleEvent lifecycleEvent,
        EvidenceCondition to) =>
        to == MapEventToCondition(lifecycleEvent);

    public static bool TryTransition(
        EvidenceCondition from,
        EvidenceConditionLifecycleEvent lifecycleEvent,
        out EvidenceCondition to)
    {
        to = MapEventToCondition(lifecycleEvent);
        return true;
    }

    private static EvidenceCondition MapEventToCondition(EvidenceConditionLifecycleEvent lifecycleEvent) =>
        lifecycleEvent switch
        {
            EvidenceConditionLifecycleEvent.SetSufficient => EvidenceCondition.Sufficient,
            EvidenceConditionLifecycleEvent.SetInsufficient => EvidenceCondition.Insufficient,
            EvidenceConditionLifecycleEvent.SetConflicting => EvidenceCondition.Conflicting,
            EvidenceConditionLifecycleEvent.SetStale => EvidenceCondition.Stale,
            EvidenceConditionLifecycleEvent.SetUnverified => EvidenceCondition.Unverified,
            _ => throw new ArgumentOutOfRangeException(nameof(lifecycleEvent), lifecycleEvent, null),
        };

    private static EvidenceConditionTransitionRule Rule(
        EvidenceCondition from,
        EvidenceConditionLifecycleEvent lifecycleEvent,
        EvidenceCondition to) =>
        new(from, lifecycleEvent, to);
}
