using ArchLucid.Application.Diffs;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class RecurrenceFindingDeltaCalculatorTests
{
    [Fact]
    public void CountFindingDelta_sums_added_and_removed_findings()
    {
        AgentResultDiffResult diff = new()
        {
            AgentDeltas =
            [
                new AgentResultDelta
                {
                    AgentType = AgentType.Critic,
                    AddedFindings = ["a", "b"],
                    RemovedFindings = ["c"],
                },
                new AgentResultDelta
                {
                    AgentType = AgentType.Topology,
                    AddedFindings = ["d"],
                    RemovedFindings = [],
                },
            ],
        };

        (int added, int removed) = RecurrenceFindingDeltaCalculator.CountFindingDelta(diff);

        added.Should().Be(3);
        removed.Should().Be(1);
    }
}
