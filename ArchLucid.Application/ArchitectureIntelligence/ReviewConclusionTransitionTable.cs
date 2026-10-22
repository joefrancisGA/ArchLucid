using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>Explicit legal transitions for <see cref="ReviewConclusion" /> (TB-1985).</summary>
public static class ReviewConclusionTransitionTable
{
    private static readonly ReviewConclusionTransitionRule[] Rules =
    [
        Rule(ReviewConclusion.Pass, ReviewConclusionLifecycleEvent.ProvisionalDowngradeToIndeterminate, ReviewConclusion.Indeterminate),
        Rule(ReviewConclusion.Fail, ReviewConclusionLifecycleEvent.ProvisionalDowngradeToIndeterminate, ReviewConclusion.Indeterminate),
        Rule(ReviewConclusion.Pass, ReviewConclusionLifecycleEvent.SpecialistSetPass, ReviewConclusion.Pass),
        Rule(ReviewConclusion.Fail, ReviewConclusionLifecycleEvent.SpecialistSetFail, ReviewConclusion.Fail),
        Rule(ReviewConclusion.Indeterminate, ReviewConclusionLifecycleEvent.SpecialistSetIndeterminate, ReviewConclusion.Indeterminate),
        Rule(ReviewConclusion.NotApplicable, ReviewConclusionLifecycleEvent.SpecialistSetNotApplicable, ReviewConclusion.NotApplicable),
    ];

    public static IReadOnlyList<ReviewConclusionTransitionRule> DocumentedRules => Rules;

    public static bool IsLegalTransition(
        ReviewConclusion from,
        ReviewConclusionLifecycleEvent lifecycleEvent,
        ReviewConclusion to)
    {
        foreach (ReviewConclusionTransitionRule rule in Rules)
        {
            if (rule.From == from && rule.LifecycleEvent == lifecycleEvent && rule.To == to)
                return true;
        }

        return false;
    }

    public static bool TryTransition(
        ReviewConclusion from,
        ReviewConclusionLifecycleEvent lifecycleEvent,
        out ReviewConclusion to)
    {
        foreach (ReviewConclusionTransitionRule rule in Rules)
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

    private static ReviewConclusionTransitionRule Rule(
        ReviewConclusion from,
        ReviewConclusionLifecycleEvent lifecycleEvent,
        ReviewConclusion to) =>
        new(from, lifecycleEvent, to);
}
