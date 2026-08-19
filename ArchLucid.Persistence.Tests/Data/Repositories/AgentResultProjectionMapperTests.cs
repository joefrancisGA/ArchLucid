using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Data.Repositories;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentResultProjectionMapperTests
{
    private static readonly Guid SqlRunId = Guid.Parse("11111111-2222-3333-4444-555555555555");

    [Fact]
    public void MapMarkers_projects_identity_and_confidence()
    {
        List<AgentResult> markers = AgentResultProjectionMapper.MapMarkers(
        [
            new AgentResultMarkerRow
            {
                ResultId = "r1",
                TaskId = "t1",
                RunId = SqlRunId,
                AgentType = nameof(AgentType.Compliance),
                Confidence = 0.62,
                CreatedUtc = new DateTime(2026, 8, 11, 0, 0, 0, DateTimeKind.Utc),
            },
        ]);

        markers.Should().ContainSingle();
        markers[0].ResultId.Should().Be("r1");
        markers[0].AgentType.Should().Be(AgentType.Compliance);
        markers[0].Confidence.Should().Be(0.62);
        markers[0].RunId.Should().Be(SqlRunId.ToString("N"));
    }

    [Fact]
    public void MapMarkers_skips_rows_whose_agent_type_is_no_longer_known()
    {
        List<AgentResult> markers = AgentResultProjectionMapper.MapMarkers(
        [
            new AgentResultMarkerRow
            {
                ResultId = "r1",
                TaskId = "t1",
                RunId = SqlRunId,
                AgentType = "RetiredAgent",
            },
        ]);

        markers.Should().BeEmpty();
    }

    [Fact]
    public void MapRollupProjection_reads_json_subpaths_and_strips_heavy_fields()
    {
        List<AgentResult> projected = AgentResultProjectionMapper.MapRollupProjection(
        [
            new AgentResultRollupProjectionRow
            {
                ResultId = "r1",
                TaskId = "t1",
                RunId = SqlRunId,
                AgentType = nameof(AgentType.Topology),
                Confidence = 0.5,
                ClaimsJson = """["claim-1"]""",
                EvidenceRefsJson = """["evidence-1"]""",
                FindingsJson = """[{"message":"Missing subnet","severity":"Warning","reasoningTrace":"long trace"}]""",
                RequiredControlsJson = """["private-endpoints"]""",
            },
        ],
            "run1");

        projected.Should().ContainSingle();
        projected[0].Claims.Should().Equal("claim-1");
        projected[0].EvidenceRefs.Should().Equal("evidence-1");
        projected[0].ProposedChanges.Should().NotBeNull();
        projected[0].ProposedChanges!.RequiredControls.Should().Equal("private-endpoints");
        projected[0].Findings.Should().ContainSingle().Which.ReasoningTrace.Should().BeNull();
    }

    [Fact]
    public void MapRollupProjection_skips_rows_whose_agent_type_is_no_longer_known()
    {
        List<AgentResult> projected = AgentResultProjectionMapper.MapRollupProjection(
        [
            new AgentResultRollupProjectionRow
            {
                ResultId = "r1",
                TaskId = "t1",
                RunId = SqlRunId,
                AgentType = "RetiredAgent",
            },
        ],
            "run1");

        projected.Should().BeEmpty();
    }

    [Fact]
    public void MapEvidenceProposal_projects_the_queue_row()
    {
        EvidenceProposalListItem item = AgentResultProjectionMapper.MapEvidenceProposal(
            new AgentResultEvidenceProposalRow
            {
                ResultId = "r1",
                RunId = SqlRunId,
                AgentType = nameof(AgentType.Compliance),
                ProposedEvidenceJson = """{"title":"SOC 2 control"}""",
                CreatedUtc = new DateTime(2026, 8, 11, 0, 0, 0, DateTimeKind.Utc),
                IsPromoted = true,
            });

        item.ResultId.Should().Be("r1");
        item.RunId.Should().Be(SqlRunId.ToString("N"));
        item.AgentType.Should().Be(nameof(AgentType.Compliance));
        item.IsPromoted.Should().BeTrue();
    }

    [Fact]
    public void Mappers_reject_null_input()
    {
        Action nullMarkers = () => AgentResultProjectionMapper.MapMarkers(null!);
        Action nullRollup = () => AgentResultProjectionMapper.MapRollupProjection(null!, "run1");
        Action nullProposal = () => AgentResultProjectionMapper.MapEvidenceProposal(null!);

        nullMarkers.Should().Throw<ArgumentNullException>();
        nullRollup.Should().Throw<ArgumentNullException>();
        nullProposal.Should().Throw<ArgumentNullException>();
    }
}
