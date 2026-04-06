using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests;

/// <summary>
/// Additional <see cref="AgentResultDiffService"/> scenarios (latest result per agent type, empty inputs).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentResultDiffServiceApplicationTests
{
    [Fact]
    public void Compare_uses_latest_result_per_agent_type_by_CreatedUtc()
    {
        DateTime older = new(2026, 4, 1, 10, 0, 0, DateTimeKind.Utc);
        DateTime newer = new(2026, 4, 1, 11, 0, 0, DateTimeKind.Utc);

        AgentResult[] left =
        [
            new()
            {
                ResultId = "r-old",
                TaskId = "t1",
                RunId = "L",
                AgentType = AgentType.Topology,
                Claims = ["old"],
                CreatedUtc = older,
            },
            new()
            {
                ResultId = "r-new",
                TaskId = "t2",
                RunId = "L",
                AgentType = AgentType.Topology,
                Claims = ["new"],
                CreatedUtc = newer,
            },
        ];

        AgentResult[] right =
        [
            new()
            {
                ResultId = "r3",
                TaskId = "t3",
                RunId = "R",
                AgentType = AgentType.Topology,
                Claims = ["new"],
                CreatedUtc = newer,
            },
        ];

        AgentResultDiffService sut = new();

        AgentResultDiffResult diff = sut.Compare("L", left, "R", right);

        diff.AgentDeltas.Should().ContainSingle();
        diff.AgentDeltas[0].RemovedClaims.Should().BeEmpty();
        diff.AgentDeltas[0].AddedClaims.Should().BeEmpty();
    }

    [Fact]
    public void Compare_when_no_results_emits_warning()
    {
        AgentResultDiffService sut = new();

        AgentResultDiffResult diff = sut.Compare("L", [], "R", []);

        diff.Warnings.Should().Contain("No agent results were available to compare.");
    }

    [Fact]
    public void Compare_agent_only_on_right_marks_left_missing()
    {
        AgentResult[] right =
        [
            new()
            {
                ResultId = "r1",
                TaskId = "t1",
                RunId = "R",
                AgentType = AgentType.Cost,
                Claims = ["c"],
                CreatedUtc = DateTime.UtcNow,
            },
        ];

        AgentResultDiffService sut = new();

        AgentResultDiffResult diff = sut.Compare("L", [], "R", right);

        AgentResultDelta delta = diff.AgentDeltas.Should().ContainSingle().Subject;
        delta.LeftExists.Should().BeFalse();
        delta.RightExists.Should().BeTrue();
    }
}
