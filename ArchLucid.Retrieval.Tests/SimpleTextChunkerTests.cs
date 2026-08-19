using ArchLucid.Retrieval.Chunking;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class SimpleTextChunkerTests
{
    [Fact]
    public void Chunk_returns_empty_for_blank_input()
    {
        SimpleTextChunker sut = new();

        IReadOnlyList<string> chunks = sut.Chunk("   ");

        chunks.Should().BeEmpty();
    }

    [Fact]
    public void Chunk_splits_long_text_with_overlap_stride()
    {
        SimpleTextChunker sut = new();
        string text = new('a', 250);

        IReadOnlyList<string> chunks = sut.Chunk(text, maxChars: 120, overlap: 20);

        chunks.Should().HaveCountGreaterThan(1);
        chunks.Should().OnlyContain(chunk => chunk.Length <= 120);
    }
}
