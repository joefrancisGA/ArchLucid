using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;

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

    [Fact]
    public void Apply_when_findings_set_to_null_uses_coalesced_empty_list()
    {
        AgentResult result = new()
        {
            ResultId = "r1",
            TaskId = "t1",
            RunId = "run1",
            Findings =
            [
                new ArchitectureFinding { FindingId = "a", Message = "m1" }
            ]
        };

        result.Findings = null!;

        result.Findings.Should().BeEmpty();

        Dictionary<string, FindingMuteFlag> flags = new(StringComparer.Ordinal)
        {
            ["a"] = new FindingMuteFlag(true, "noise")
        };

        FindingMuteFlagApplier.Apply([result], flags);
    }
}
