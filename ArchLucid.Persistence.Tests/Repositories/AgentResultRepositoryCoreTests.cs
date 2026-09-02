using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Persistence;
using ArchLucid.Persistence.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentResultRepositoryCoreTests
{
    [Fact]
    public void RequireSingleRun_rejects_multiple_runs()
    {
        Action act = () => AgentResultRepositoryCore.RequireSingleRun(
        [
            new AgentResult { RunId = "run-a", TaskId = "t1" },
            new AgentResult { RunId = "run-b", TaskId = "t2" },
        ]);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Clone_round_trips_result()
    {
        AgentResult source = new()
        {
            ResultId = "r1",
            RunId = "run-1",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            Claims = ["claim-a"],
        };

        AgentResult clone = AgentResultRepositoryCore.Clone(source);

        clone.Should().NotBeSameAs(source);
        clone.ResultId.Should().Be(source.ResultId);
        clone.Claims.Should().ContainSingle().Which.Should().Be("claim-a");
    }

    [Fact]
    public void ProjectMarker_strips_heavy_fields()
    {
        AgentResult source = new()
        {
            ResultId = "r1",
            RunId = "run-1",
            TaskId = "task-1",
            AgentType = AgentType.Topology,
            Confidence = 0.9,
            CreatedUtc = DateTime.UtcNow,
            Claims = ["claim-a"],
        };

        AgentResult marker = AgentResultRepositoryCore.ProjectMarker(source);

        marker.Claims.Should().BeNullOrEmpty();
        marker.AgentType.Should().Be(AgentType.Topology);
    }

    [Fact]
    public void IsEvidencePromoted_checks_promoted_timestamp()
    {
        AgentResultRepositoryCore.IsEvidencePromoted(new AgentResultEnrichmentRecord
        {
            EvidenceProposalPromotedUtc = DateTime.UtcNow,
        }).Should().BeTrue();

        AgentResultRepositoryCore.IsEvidencePromoted(null).Should().BeFalse();
    }
}
