using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingMuteFlagApplierTests
{
    [Fact]
    public void Apply_copies_flags_onto_matching_findings()
    {
        AgentResult result = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run1",
            Findings =
            [
                new ArchitectureFinding { FindingId = "a", Message = "m1" },
                new ArchitectureFinding { FindingId = "b", Message = "m2" }
            ]
        };

        Dictionary<string, FindingMuteFlag> flags = new(StringComparer.Ordinal)
        {
            ["a"] = new FindingMuteFlag(true, "noise"),
            ["missing"] = new FindingMuteFlag(true, "x")
        };

        FindingMuteFlagApplier.Apply([result], flags);

        ArchitectureFinding a = result.Findings[0];
        a.IsMuted.Should().BeTrue();
        a.MuteReason.Should().Be("noise");

        ArchitectureFinding b = result.Findings[1];
        b.IsMuted.Should().BeFalse();
        b.MuteReason.Should().BeNull();
    }
}
