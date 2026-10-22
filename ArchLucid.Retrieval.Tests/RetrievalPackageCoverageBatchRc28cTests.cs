using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Graph;
using ArchLucid.Retrieval.Pricing;

using ArchLucid.Contracts.Persistence.Graph;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

/// <summary>
///     RC28c package-coverage batch: token-budget edge cases, retail heuristics for unknown SKUs, and graph embedding
///     document id helpers.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalPackageCoverageBatchRc28cTests
{
    [Fact]
    public void TokenAwareContextBudget_TruncateToTokenBudget_rejects_non_positive_max()
    {
        FluentActions
            .Invoking(() => TokenAwareContextBudget.TruncateToTokenBudget("abc", out _, maxEstimatedTokens: 0))
            .Should()
            .Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void TokenAwareContextBudget_TruncateToTokenBudget_tiny_budget_returns_suffix_only()
    {
        string result = TokenAwareContextBudget.TruncateToTokenBudget(
            new string('x', 200),
            out bool truncated,
            maxEstimatedTokens: 1,
            charsPerToken: 4);

        truncated.Should().BeTrue();
        result.Should().Contain("Context truncated");
    }

    [Fact]
    public void AwsRetailPricesHeuristicFallback_rejects_unknown_instance_family()
    {
        AwsRetailPricesHeuristicFallback.TryGetMonthlyUsd("AmazonEC2", "z9.metal", out decimal usd)
            .Should().BeFalse();
        usd.Should().Be(0m);
        FluentActions
            .Invoking(() => AwsRetailPricesHeuristicFallback.TryGetMonthlyUsd(" ", "m5.large", out _))
            .Should()
            .Throw<ArgumentException>();
    }

    [Fact]
    public void GcpRetailPricesHeuristicFallback_rejects_unknown_machine_family()
    {
        GcpRetailPricesHeuristicFallback.TryGetMonthlyUsd("Compute Engine", "custom-weird", out decimal usd)
            .Should().BeFalse();
        usd.Should().Be(0m);
    }

    [Fact]
    public void KnowledgeGraphNodeEmbeddingTextComposer_compose_and_document_id()
    {
        GraphNode node = new()
        {
            NodeId = "n-1",
            Label = "API Gateway",
            NodeType = "Service",
        };

        string content = KnowledgeGraphNodeEmbeddingTextComposer.Compose(node);
        content.Should().Contain("API Gateway");

        Guid snapshotId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        string documentId = KnowledgeGraphNodeEmbeddingTextComposer.BuildDocumentId(snapshotId, "n-1");
        documentId.Should().Contain(snapshotId.ToString("N"));
        documentId.Should().Contain("n-1");

        KnowledgeGraphNodeEmbeddingTextComposer.TryParseGraphSnapshotId(documentId, out Guid parsed)
            .Should().BeTrue();
        parsed.Should().Be(snapshotId);
    }
}
