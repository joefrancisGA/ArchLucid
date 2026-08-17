using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

using FsCheck;
using FsCheck.Xunit;

namespace ArchLucid.Decisioning.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
public sealed class ReviewConclusionTransitionTableTests
{
    [Fact]
    public void Documented_rules_are_exhaustively_legal()
    {
        foreach (ReviewConclusionTransitionRule rule in ReviewConclusionTransitionTable.DocumentedRules)
        {
            ReviewConclusionTransitionTable.IsLegalTransition(
                rule.From,
                rule.LifecycleEvent,
                rule.To).Should().BeTrue();
        }
    }

    [Property(MaxTest = 50)]
    public void Provisional_downgrade_only_from_pass_or_fail(byte fromRaw)
    {
        if (!Enum.IsDefined(typeof(ReviewConclusion), (ReviewConclusion)fromRaw))
            return;

        ReviewConclusion from = (ReviewConclusion)fromRaw;
        bool legal = ReviewConclusionTransitionTable.TryTransition(
            from,
            ReviewConclusionLifecycleEvent.ProvisionalDowngradeToIndeterminate,
            out ReviewConclusion to);

        if (from is ReviewConclusion.Pass or ReviewConclusion.Fail)
        {
            legal.Should().BeTrue();
            to.Should().Be(ReviewConclusion.Indeterminate);
        }
        else
        {
            legal.Should().BeFalse();
        }
    }
}
