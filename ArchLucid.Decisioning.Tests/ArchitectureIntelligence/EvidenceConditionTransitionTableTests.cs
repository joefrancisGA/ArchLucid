using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;

using FluentAssertions;

using FsCheck.Xunit;

namespace ArchLucid.Decisioning.Tests.ArchitectureIntelligence;

[Trait("Suite", "Core")]
public sealed class EvidenceConditionTransitionTableTests
{
    [Fact]
    public void Documented_rules_map_events_to_conditions()
    {
        foreach (EvidenceConditionTransitionRule rule in EvidenceConditionTransitionTable.DocumentedRules)
        {
            EvidenceConditionTransitionTable.IsLegalTransition(
                rule.From,
                rule.LifecycleEvent,
                rule.To).Should().BeTrue();
        }
    }

    [Property(MaxTest = 40)]
    public void Every_lifecycle_event_maps_to_a_defined_condition(byte eventRaw)
    {
        if (!Enum.IsDefined(typeof(EvidenceConditionLifecycleEvent), (EvidenceConditionLifecycleEvent)eventRaw))
            return;

        EvidenceConditionLifecycleEvent lifecycleEvent = (EvidenceConditionLifecycleEvent)eventRaw;
        bool ok = EvidenceConditionTransitionTable.TryTransition(
            EvidenceCondition.Sufficient,
            lifecycleEvent,
            out EvidenceCondition to);

        ok.Should().BeTrue();
        Enum.IsDefined(to).Should().BeTrue();
    }
}
