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

    [Fact]
    public void Build_WhenGraphRagNeighborShareHighWithLowCoverage_ReturnsPilotFloorWarn()
    {
        List<RetrievalGroundingTraceRecord> traces =
        [
            new RetrievalGroundingTraceRecord
            {
                AgentName = "Topology",
                RetrievedChunkIds = ["a", "b", "c", "d"],
                CitationCoverage = 0.2,
                GraphRagNeighborsAdded = 3,
                GraphRagSeedHits = 1,
                TokensIn = 1200,
            },
        ];

        RunRetrievalGroundingSummaryDto summary =
            RunRetrievalGroundingSummaryBuilder.Build(traces, null);

        summary.GraphRagPilotFloorDisposition.Should().Be("WARN");
        summary.Disposition.Should().Be("WARN");
        summary.TotalGraphRagNeighborsAdded.Should().Be(3);
        summary.GraphRagNeighborHitRate.Should().BeApproximately(0.75, 0.001);
        summary.TotalRetrievalTokensIn.Should().Be(1200);
    }

    [Fact]
    public void Build_WhenGraphRagQualityPostureProvided_PropagatesToDto()
    {
        List<RetrievalGroundingTraceRecord> traces =
        [
            new RetrievalGroundingTraceRecord
            {
                AgentName = "Topology",
                RetrievedChunkIds = ["a"],
                GraphRagNeighborsAdded = 1,
            },
        ];

        RunRetrievalGroundingSummaryDto summary =
            RunRetrievalGroundingSummaryBuilder.Build(traces, null, GraphRagQualityPosture.UnprovenValue);

        summary.GraphRagQualityPosture.Should().Be(GraphRagQualityPosture.UnprovenValue);
    }

    [Fact]
    public void Build_WhenTopologyReferenceArchitectureTracePresent_PropagatesExemplarSummary()
    {
        List<RetrievalGroundingTraceRecord> traces =
        [
            new RetrievalGroundingTraceRecord
            {
                AgentName = "Topology",
                RetrievedChunkIds = ["ra-1"],
                CorpusKind = "ReferenceArchitecture",
                DocumentIdsJson = """["exemplar-standard-3-tier"]""",
                CitationCoverage = 0.9,
            },
        ];

        RunRetrievalGroundingSummaryDto summary =
            RunRetrievalGroundingSummaryBuilder.Build(traces, null);

        summary.TopologyReferenceArchitectureExemplarMissing.Should().BeFalse();
        summary.TopologyReferenceArchitectureExemplarCount.Should().Be(1);
        summary.TopologyReferenceArchitectureExemplarDocumentIds.Should().ContainSingle()
            .Which.Should().Be("exemplar-standard-3-tier");
    }
}
