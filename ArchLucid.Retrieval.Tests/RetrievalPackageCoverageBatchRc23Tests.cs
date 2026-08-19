using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Compliance;
using ArchLucid.Retrieval.Graph;
using ArchLucid.Retrieval.Indexing;
using ArchLucid.Retrieval.Summarization;

using FluentAssertions;

using Moq;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class RetrievalPackageCoverageBatchRc23Tests
{
    [Fact]
    public void KnowledgeGraphNodeEmbeddingTextComposer_formats_node_with_category()
    {
        GraphNode node = new()
        {
            NodeId = "svc-1",
            NodeType = "Service",
            Label = "Payments API",
            Category = "Compute",
            ReasoningTrace = "High fan-out.",
        };

        string text = KnowledgeGraphNodeEmbeddingTextComposer.Compose(node);

        text.Should().Contain("Service: Payments API (Compute)");
        text.Should().Contain("High fan-out");
    }

    [Fact]
    public void KnowledgeGraphNodeEmbeddingTextComposer_builds_and_parses_document_ids()
    {
        Guid snapshotId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

        string documentId = KnowledgeGraphNodeEmbeddingTextComposer.BuildDocumentId(snapshotId, "node 1");
        string chunkId = KnowledgeGraphNodeEmbeddingTextComposer.BuildChunkId(snapshotId, "node 1");

        documentId.Should().StartWith("graph-");
        chunkId.Should().EndWith("#0");
        KnowledgeGraphNodeEmbeddingTextComposer.TryParseGraphSnapshotId(documentId, out Guid parsed).Should().BeTrue();
        parsed.Should().Be(snapshotId);
    }

    [Fact]
    public void KnowledgeGraphNodeEmbeddingTextComposer_try_parse_returns_false_for_invalid_document_id()
    {
        bool parsed = KnowledgeGraphNodeEmbeddingTextComposer.TryParseGraphSnapshotId("not-a-graph-id", out Guid snapshotId);

        parsed.Should().BeFalse();
        snapshotId.Should().Be(Guid.Empty);
    }

    [Fact]
    public void CompliancePolicyPackRetrievalPromptFormatter_formats_empty_hits_as_grounding_missing()
    {
        Mock<IRetrievalCitationFormatter> formatter = new();

        string block = CompliancePolicyPackRetrievalPromptFormatter.FormatPolicyPackBlock([], formatter.Object);

        block.Should().Contain("groundingMissing: true");
    }

    [Fact]
    public void CompliancePolicyPackRetrievalPromptFormatter_builds_policy_query_text_from_request()
    {
        ArchitectureRequest request = new()
        {
            SystemName = "Claims",
            Environment = "prod",
            RequiredCapabilities = ["SQL", "Search"],
            Constraints = ["HIPAA"],
        };

        string query = CompliancePolicyPackRetrievalPromptFormatter.BuildPolicyQueryText(request);

        query.Should().Contain("Claims prod");
        query.Should().Contain("SQL");
        query.Should().Contain("HIPAA");
    }

    [Fact]
    public async Task NoOpManifestChunkSummarizer_returns_hits_unchanged()
    {
        NoOpManifestChunkSummarizer sut = new();
        RetrievalHit hit = new() { ChunkId = "chunk-1", Text = "body" };

        IReadOnlyList<RetrievalHit> result = await sut.MaybeSummarizeAsync([hit], CancellationToken.None);

        result.Should().ContainSingle().Which.Should().BeSameAs(hit);
    }

    [Fact]
    public void NullVectorIndexEmbeddingMetadataProvider_returns_null_metadata()
    {
        NullVectorIndexEmbeddingMetadataProvider.Instance.GetEmbeddingMetadata().Should().BeNull();
    }

    [Fact]
    public void RetrievalCorpusStartupIndexerTelemetry_ignores_blank_corpus_kind()
    {
        RetrievalCorpusStartupIndexerTelemetry.RecordFailure("   ");

        // Fail-open telemetry only; absence of throw is the contract.
        true.Should().BeTrue();
    }
}
