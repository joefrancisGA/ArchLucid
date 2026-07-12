using ArchLucid.Application.Runs;
using ArchLucid.Core.Retrieval;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Category", "Unit")]
public sealed class TopologyReferenceArchitectureExemplarSummaryResolverTests
{
    [Fact]
    public void Resolve_WhenNoTopologyTrace_ReturnsExemplarMissing()
    {
        TopologyReferenceArchitectureExemplarSummary summary =
            TopologyReferenceArchitectureExemplarSummaryResolver.Resolve(
            [
                new RetrievalGroundingTraceRecord
                {
                    AgentName = "Compliance",
                    RetrievedChunkIds = ["chunk-1"],
                    CorpusKind = "PolicyPack",
                },
            ]);

        summary.ExemplarMissing.Should().BeTrue();
        summary.ExemplarCount.Should().Be(0);
        summary.ExemplarDocumentIds.Should().BeEmpty();
    }

    [Fact]
    public void Resolve_WhenTopologyTraceHasReferenceArchitectureHits_ReturnsCountAndDocumentIds()
    {
        TopologyReferenceArchitectureExemplarSummary summary =
            TopologyReferenceArchitectureExemplarSummaryResolver.Resolve(
            [
                new RetrievalGroundingTraceRecord
                {
                    AgentName = "Topology",
                    RetrievedChunkIds = ["ra-1", "ra-2"],
                    CorpusKind = "ReferenceArchitecture",
                    DocumentIdsJson = """["exemplar-standard-3-tier","exemplar-microservices"]""",
                },
            ]);

        summary.ExemplarMissing.Should().BeFalse();
        summary.ExemplarCount.Should().Be(2);
        summary.ExemplarDocumentIds.Should().Equal("exemplar-microservices", "exemplar-standard-3-tier");
    }

    [Fact]
    public void Resolve_WhenTopologyTraceIsNonReferenceArchitecture_ReturnsExemplarMissing()
    {
        TopologyReferenceArchitectureExemplarSummary summary =
            TopologyReferenceArchitectureExemplarSummaryResolver.Resolve(
            [
                new RetrievalGroundingTraceRecord
                {
                    AgentName = "Topology",
                    RetrievedChunkIds = ["pp-1"],
                    CorpusKind = "PolicyPack",
                    DocumentIdsJson = """["policy-pack-a"]""",
                },
            ]);

        summary.ExemplarMissing.Should().BeTrue();
        summary.ExemplarCount.Should().Be(0);
        summary.ExemplarDocumentIds.Should().BeEmpty();
    }

    [Fact]
    public void Resolve_WhenTopologyTraceHasMixedCorpusWithExemplarHits_ReturnsExemplarContribution()
    {
        TopologyReferenceArchitectureExemplarSummary summary =
            TopologyReferenceArchitectureExemplarSummaryResolver.Resolve(
            [
                new RetrievalGroundingTraceRecord
                {
                    AgentName = "Topology",
                    RetrievedChunkIds =
                    [
                        "exemplar-standard-3-tier-chunk-0",
                        "policy-pack-a-chunk-0",
                    ],
                    CorpusKind = "Mixed",
                    DocumentIdsJson = """["exemplar-standard-3-tier","policy-pack-a"]""",
                },
            ]);

        summary.ExemplarMissing.Should().BeFalse();
        summary.ExemplarCount.Should().Be(1);
        summary.ExemplarDocumentIds.Should().Equal("exemplar-standard-3-tier");
    }

    [Fact]
    public void Resolve_WhenTopologyTraceHasZeroChunks_ReturnsExemplarMissing()
    {
        TopologyReferenceArchitectureExemplarSummary summary =
            TopologyReferenceArchitectureExemplarSummaryResolver.Resolve(
            [
                new RetrievalGroundingTraceRecord
                {
                    AgentName = "Topology",
                    RetrievedChunkIds = [],
                    CorpusKind = null,
                },
            ]);

        summary.ExemplarMissing.Should().BeTrue();
        summary.ExemplarCount.Should().Be(0);
    }
}
