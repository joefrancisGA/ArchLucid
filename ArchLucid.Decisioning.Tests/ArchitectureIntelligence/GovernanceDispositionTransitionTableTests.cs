using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
public sealed class GovernanceDispositionTransitionTableTests
{
    [Fact]
    public void Documented_rules_are_exhaustively_legal()
    {
        foreach (GovernanceDispositionTransitionRule rule in GovernanceDispositionTransitionTable.DocumentedRules)
        {
            GovernanceDispositionTransitionTable.IsLegalTransition(
                rule.From,
                rule.LifecycleEvent,
                rule.To).Should().BeTrue();
        }
    }

    [Fact]
    public void Accepted_is_only_legal_from_open()
    {
        foreach (GovernanceDisposition disposition in Enum.GetValues<GovernanceDisposition>())
        {
            bool legal = GovernanceDispositionTransitionTable.IsLegalTransition(
                disposition,
                GovernanceDispositionLifecycleEvent.SetAccepted,
                GovernanceDisposition.Accepted);

            if (disposition is GovernanceDisposition.Open)
                legal.Should().BeTrue();
            else if (disposition is GovernanceDisposition.Accepted)
                legal.Should().BeTrue();
            else
                legal.Should().BeFalse();
        }
    }
}
