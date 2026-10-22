using ArchLucid.Core.Retrieval;
using ArchLucid.Host.Core.Services.Ask;
using ArchLucid.Retrieval.Models;

using FluentAssertions;

namespace ArchLucid.Host.Core.Tests.Ask;

[Trait("Category", "Unit")]
public sealed class AskRetrievalHitRankerTests
{
    [Fact]
    public void Rank_boosts_prior_manifest_hits_when_requested()
    {
        List<RetrievalHit> hits =
        [
            new()
            {
                ChunkId = "tenant",
                DocumentId = "d1",
                CorpusKind = nameof(CorpusKind.TenantManifest),
                SourceType = "Manifest",
                SourceId = "m1",
                Title = "Current",
                Text = "current",
                Score = 0.80,
            },
            new()
            {
                ChunkId = "prior",
                DocumentId = "d2",
                CorpusKind = nameof(CorpusKind.PriorManifest),
                SourceType = "PriorManifestFinding",
                SourceId = "f1",
                Title = "Prior",
                Text = "prior",
                Score = 0.70,
            },
        ];

        IReadOnlyList<RetrievalHit> ranked = AskRetrievalHitRanker.Rank(hits, boostPriorManifest: true, topK: 2);

        ranked[0].ChunkId.Should().Be("prior");
        ranked[0].Score.Should().BeApproximately(0.875, 0.001);
    }
}
