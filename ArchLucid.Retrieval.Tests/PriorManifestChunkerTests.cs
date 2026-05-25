using ArchLucid.Retrieval.Chunking;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class PriorManifestChunkerTests
{
    [Fact]
    public void Chunk_short_prior_record_stays_single_chunk()
    {
        PriorManifestChunker sut = new();
        string text = "[Cost] Decision Storage: selected Blob. Right-size tier.";

        IReadOnlyList<string> chunks = sut.Chunk(text);

        chunks.Should().ContainSingle().Which.Should().Be(text);
    }

    [Fact]
    public void Chunk_long_prior_record_uses_windows()
    {
        PriorManifestChunker sut = new();
        string text = new('a', 2000);

        IReadOnlyList<string> chunks = sut.Chunk(text, maxChars: 800, overlap: 100);

        chunks.Count.Should().BeGreaterThan(1);
    }
}
