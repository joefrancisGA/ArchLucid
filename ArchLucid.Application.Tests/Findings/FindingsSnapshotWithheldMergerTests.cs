using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingsSnapshotWithheldMergerTests
{
    [Fact]
    public void MergeAgentWithheld_appends_rows_from_agent_results()
    {
        FindingsSnapshot snapshot = new();
        AgentResult result = new()
        {
            AgentType = AgentType.Compliance,
            WithheldFindings =
            [
                new WithheldFindingSummary
                {
                    WithheldFindingId = "emission-r1-f1",
                    Reason = WithheldFindingReasons.ProseOnlyEmission,
                    Title = "Prose only",
                },
            ],
        };

        FindingsSnapshotWithheldMerger.MergeAgentWithheld(snapshot, [result]);

        snapshot.WithheldFindings.Should().ContainSingle();
        snapshot.WithheldFindings[0].Title.Should().Be("Prose only");
    }
}
