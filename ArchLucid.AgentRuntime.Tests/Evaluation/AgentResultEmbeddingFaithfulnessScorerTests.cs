using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Configuration;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Embedding;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentResultEmbeddingFaithfulnessScorerTests
{
    private sealed class DeterministicHistogramEmbeddingService : IEmbeddingService
    {
        public Task<float[]> EmbedAsync(string text, CancellationToken ct)
        {
            return Task.FromResult(Vec(text));
        }

        public Task<IReadOnlyList<float[]>> EmbedManyAsync(IReadOnlyList<string> texts, CancellationToken ct)
        {
            List<float[]> vectors = texts.Select(Vec).ToList();
            return Task.FromResult<IReadOnlyList<float[]>>(vectors);
        }

        private static float[] Vec(string text)
        {
            float[] vector = new float[256];

            foreach (char ch in text.ToLowerInvariant())
                vector[ch % vector.Length] += 1f;

            NormalizeL2(vector);

            return vector;
        }

        private static void NormalizeL2(float[] vector)
        {
            double sum = vector.Aggregate<float, double>(0, (current, t) => current + t * t);

            double norm = Math.Sqrt(sum);

            if (norm < 1e-12) return;

            for (int i = 0; i < vector.Length; i++)
                vector[i] = (float)(vector[i] / norm);
        }
    }

    private static AgentResultEmbeddingFaithfulnessScorer CreateSut(
        IEmbeddingService embeddingService,
        bool embeddingEnabled)
    {
        Mock<IOptionsMonitor<AgentFaithfulnessOptions>> optionsMonitor = new();
        optionsMonitor.Setup(static m => m.CurrentValue).Returns(
            new AgentFaithfulnessOptions { EmbeddingEnabled = embeddingEnabled });

        return new AgentResultEmbeddingFaithfulnessScorer(
            embeddingService,
            new SimpleTextChunker(),
            optionsMonitor.Object,
            NullLogger<AgentResultEmbeddingFaithfulnessScorer>.Instance);
    }

    [Fact]
    public async Task TryComputeMeanCosineAsync_disabled_returns_null_without_embedding_calls()
    {
        Mock<IEmbeddingService> embeddingService = new();
        AgentResultEmbeddingFaithfulnessScorer sut = CreateSut(embeddingService.Object, embeddingEnabled: false);

        AgentEvidencePackage evidence = MinimalEvidence("anything shared");

        double? result =
            await sut.TryComputeMeanCosineAsync("{}", evidence, CancellationToken.None);

        result.Should().BeNull();
        embeddingService.Verify(
            s => s.EmbedManyAsync(It.IsAny<IReadOnlyList<string>>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task TryComputeMeanCosineAsync_aligns_identical_claim_and_evidence_text_near_one()
    {
        const string shared = "uniquephrase telemetry grounding xyz987";

        AgentEvidencePackage evidence = MinimalEvidence(shared);

        string json =
            $$"""
            {"claims":[{"text":"{{shared}}"}],"findings":[]}
            """;

        AgentResultEmbeddingFaithfulnessScorer sut = CreateSut(new DeterministicHistogramEmbeddingService(), embeddingEnabled: true);

        double? cosine =
            await sut.TryComputeMeanCosineAsync(json, evidence, CancellationToken.None);

        cosine.Should().NotBeNull();
        cosine.Value.Should().BeGreaterThan(0.92);
    }

    private static AgentEvidencePackage MinimalEvidence(string requestDescription)
    {
        return new AgentEvidencePackage
        {
            RunId = "run",
            RequestId = "req",
            Request = new RequestEvidence { Description = requestDescription }
        };
    }
}
