using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Retrieval;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class RunRetrievalGroundingSummaryBuilderTests
{
    [Fact]
    public void Build_WhenRagAgentRanWithoutTrace_ReturnsHoldWithMissingAgent()
    {
        List<AgentResult> results =
        [
            new AgentResult { AgentType = AgentType.Topology, TaskId = "t1", RunId = "r1" },
        ];

        RunRetrievalGroundingSummaryDto summary =
            RunRetrievalGroundingSummaryBuilder.Build([], results);

        summary.Disposition.Should().Be("HOLD");
        summary.ExpectedAgentsMissingTraces.Should().ContainSingle().Which.Should().Be("Topology");
    }

    [Fact]
    public void Build_WhenTracesPresentWithChunks_ReturnsPass()
    {
        List<RetrievalGroundingTraceRecord> traces =
        [
            new RetrievalGroundingTraceRecord
            {
                AgentName = "Topology",
                RetrievedChunkIds = ["chunk-1"],
                CitationCoverage = 0.9,
            },
        ];

        List<AgentResult> results =
        [
            new AgentResult { AgentType = AgentType.Topology, TaskId = "t1", RunId = "r1" },
        ];

        RunRetrievalGroundingSummaryDto summary =
            RunRetrievalGroundingSummaryBuilder.Build(traces, results);

        summary.Disposition.Should().Be("PASS");
        summary.TraceCount.Should().Be(1);
        summary.TotalRetrievedChunks.Should().Be(1);
    }

    [Fact]
    public void Build_WhenNoTracesAndNoResults_ReturnsWarn()
    {
        RunRetrievalGroundingSummaryDto summary =
            RunRetrievalGroundingSummaryBuilder.Build([], null);

        summary.Disposition.Should().Be("WARN");
        summary.TraceCount.Should().Be(0);
    }
}
