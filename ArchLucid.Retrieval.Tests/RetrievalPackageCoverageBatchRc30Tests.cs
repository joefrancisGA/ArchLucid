using ArchLucid.Retrieval.Indexing;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

/// <summary>RC30 package-coverage batch: retrieval document index state metadata bag.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RetrievalPackageCoverageBatchRc30Tests
{
    [Fact]
    public void RetrievalDocumentIndexState_roundtrips_index_metadata_fields()
    {
        DateTimeOffset indexedUtc = new(2026, 8, 14, 12, 0, 0, TimeSpan.Zero);

        RetrievalDocumentIndexState state = new()
        {
            ContentHash = "content-hash-1",
            ChunkingFingerprint = "chunk-fp-1",
            CorpusKind = "TenantManifest",
            LastIndexedUtc = indexedUtc,
        };

        state.ContentHash.Should().Be("content-hash-1");
        state.ChunkingFingerprint.Should().Be("chunk-fp-1");
        state.CorpusKind.Should().Be("TenantManifest");
        state.LastIndexedUtc.Should().Be(indexedUtc);
    }
}
