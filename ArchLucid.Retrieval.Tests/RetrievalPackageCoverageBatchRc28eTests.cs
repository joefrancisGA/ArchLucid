using ArchLucid.Core.Retrieval;
using ArchLucid.Retrieval.Reranking;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

/// <summary>
///     RC28e package-coverage batch: lexical overlap and pass-through retrieval rerankers.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalPackageCoverageBatchRc28eTests
{
    [Fact]
    public async Task LexicalOverlapRetrievalReranker_RerankAsync_returns_empty_for_no_candidates()
    {
        LexicalOverlapRetrievalReranker reranker = new();

        IReadOnlyList<RetrievalHit> result = await reranker.RerankAsync("private endpoint", [], 3, CancellationToken.None);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task LexicalOverlapRetrievalReranker_RerankAsync_prefers_token_overlap_and_policy_pack_boost()
    {
        List<RetrievalHit> candidates =
        [
            new()
            {
                ChunkId = "low",
                DocumentId = "doc-low",
                SourceType = "Manifest",
                SourceId = "low",
                Title = "Unrelated topic",
                Text = "generic platform guidance",
                Score = 0.99,
            },
            new()
            {
                ChunkId = "high",
                DocumentId = "doc-high",
                SourceType = "PolicyPack",
                SourceId = "pp-1",
                CorpusKind = nameof(CorpusKind.PolicyPack),
                Title = "Private endpoint requirement",
                Text = "Require private endpoint access for data plane.",
                Score = 0.1,
            },
        ];

        LexicalOverlapRetrievalReranker reranker = new();

        IReadOnlyList<RetrievalHit> result = await reranker.RerankAsync(
            "private endpoint data plane",
            candidates,
            finalTopK: 1,
            CancellationToken.None);

        result.Should().ContainSingle();
        result[0].ChunkId.Should().Be("high");
    }

    [Fact]
    public async Task LexicalOverlapRetrievalReranker_RerankAsync_throws_for_blank_query()
    {
        LexicalOverlapRetrievalReranker reranker = new();
        List<RetrievalHit> candidates =
        [
            new()
            {
                ChunkId = "a",
                DocumentId = "doc",
                SourceType = "Manifest",
                SourceId = "a",
                Title = "A",
                Text = "alpha",
                Score = 1,
            },
        ];

        Func<Task> act = async () => await reranker.RerankAsync("  ", candidates, 1, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task PassThroughRetrievalReranker_RerankAsync_throws_when_candidates_empty_before_take()
    {
        PassThroughRetrievalReranker reranker = new();

        Func<Task> act = async () => await reranker.RerankAsync("query", [], 5, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentException>();
    }

    [Fact]
    public async Task PassThroughRetrievalReranker_RerankAsync_keeps_score_order_and_clamps_top_k()
    {
        List<RetrievalHit> candidates =
        [
            new()
            {
                ChunkId = "a",
                DocumentId = "doc-a",
                SourceType = "Manifest",
                SourceId = "a",
                Title = "A",
                Text = "alpha",
                Score = 0.2,
            },
            new()
            {
                ChunkId = "b",
                DocumentId = "doc-b",
                SourceType = "Manifest",
                SourceId = "b",
                Title = "B",
                Text = "beta",
                Score = 0.9,
            },
            new()
            {
                ChunkId = "c",
                DocumentId = "doc-c",
                SourceType = "Manifest",
                SourceId = "c",
                Title = "C",
                Text = "gamma",
                Score = 0.5,
            },
        ];

        PassThroughRetrievalReranker reranker = new();

        IReadOnlyList<RetrievalHit> result = await reranker.RerankAsync("ignored", candidates, finalTopK: 2, CancellationToken.None);

        result.Should().HaveCount(2);
        result[0].ChunkId.Should().Be("b");
        result[1].ChunkId.Should().Be("c");
    }

    [Fact]
    public async Task PassThroughRetrievalReranker_RerankAsync_throws_when_candidates_null()
    {
        PassThroughRetrievalReranker reranker = new();

        Func<Task> act = async () => await reranker.RerankAsync("query", null!, 1, CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }
}
