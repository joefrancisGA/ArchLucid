using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Explicit legal transitions for <see cref="GovernanceDisposition" /> (TB-1985).</summary>
public static class GovernanceDispositionTransitionTable
{
    private static readonly GovernanceDispositionTransitionRule[] Rules =
    [
        Rule(GovernanceDisposition.Open, GovernanceDispositionLifecycleEvent.SetAccepted, GovernanceDisposition.Accepted),
        Rule(GovernanceDisposition.Open, GovernanceDispositionLifecycleEvent.SetRemediationPlanned, GovernanceDisposition.RemediationPlanned),
        Rule(GovernanceDisposition.Open, GovernanceDispositionLifecycleEvent.SetDeferred, GovernanceDisposition.Deferred),
        Rule(GovernanceDisposition.Open, GovernanceDispositionLifecycleEvent.SetExceptionGranted, GovernanceDisposition.ExceptionGranted),
        Rule(GovernanceDisposition.Open, GovernanceDispositionLifecycleEvent.SetHumanDecisionRequired, GovernanceDisposition.HumanDecisionRequired),
        Rule(GovernanceDisposition.Open, GovernanceDispositionLifecycleEvent.SetOpen, GovernanceDisposition.Open),
        Rule(GovernanceDisposition.Accepted, GovernanceDispositionLifecycleEvent.SetAccepted, GovernanceDisposition.Accepted),
        Rule(GovernanceDisposition.RemediationPlanned, GovernanceDispositionLifecycleEvent.SetRemediationPlanned, GovernanceDisposition.RemediationPlanned),
        Rule(GovernanceDisposition.Deferred, GovernanceDispositionLifecycleEvent.SetDeferred, GovernanceDisposition.Deferred),
        Rule(GovernanceDisposition.ExceptionGranted, GovernanceDispositionLifecycleEvent.SetExceptionGranted, GovernanceDisposition.ExceptionGranted),
        Rule(GovernanceDisposition.HumanDecisionRequired, GovernanceDispositionLifecycleEvent.SetHumanDecisionRequired, GovernanceDisposition.HumanDecisionRequired),
    ];

    public static IReadOnlyList<GovernanceDispositionTransitionRule> DocumentedRules => Rules;

    public static bool IsLegalTransition(
        GovernanceDisposition from,
        GovernanceDispositionLifecycleEvent lifecycleEvent,
        GovernanceDisposition to)
    {
        foreach (GovernanceDispositionTransitionRule rule in Rules)
        {
            if (rule.From == from && rule.LifecycleEvent == lifecycleEvent && rule.To == to)
                return true;
        }

        return false;
    }

    public static bool TryTransition(
        GovernanceDisposition from,
        GovernanceDispositionLifecycleEvent lifecycleEvent,
        out GovernanceDisposition to)
    {
        foreach (GovernanceDispositionTransitionRule rule in Rules)
        {
            if (rule.From == from && rule.LifecycleEvent == lifecycleEvent)
            {
                to = rule.To;
                return true;
            }
        }

        to = from;
        return false;
    }

    private static GovernanceDispositionTransitionRule Rule(
        GovernanceDisposition from,
        GovernanceDispositionLifecycleEvent lifecycleEvent,
        GovernanceDisposition to) =>
        new(from, lifecycleEvent, to);
}
