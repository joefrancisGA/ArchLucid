using ArchLucid.Retrieval.Chunking;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class StructureAwareTextChunkerTests
{
    [Fact]
    public void Chunk_returns_empty_for_blank_input()
    {
        StructureAwareTextChunker sut = new();

        IReadOnlyList<string> chunks = sut.Chunk("   ");

        chunks.Should().BeEmpty();
    }

    [Fact]
    public void Chunk_keeps_short_markdown_section_single_chunk()
    {
        StructureAwareTextChunker sut = new();
        string text = """
            ## Context
            Payment service stores card tokens in PCI scope.

            ## Decision
            Use tokenization gateway instead of local PAN storage.
            """;

        IReadOnlyList<string> chunks = sut.Chunk(text, maxChars: 1200, overlap: 150);

        chunks.Should().HaveCount(1);
        chunks[0].Should().Contain("## Context");
        chunks[0].Should().Contain("## Decision");
    }

    [Fact]
    public void Chunk_splits_on_markdown_headings_when_sections_exceed_max_chars()
    {
        StructureAwareTextChunker sut = new();
        string sectionA = new string('a', 700);
        string sectionB = new string('b', 700);
        string text = $"## Section A\n{sectionA}\n\n## Section B\n{sectionB}";

        IReadOnlyList<string> chunks = sut.Chunk(text, maxChars: 500, overlap: 50);

        chunks.Should().HaveCountGreaterThan(1);
        chunks[0].Should().Contain("## Section A");
        chunks.Should().Contain(chunk => chunk.Contains("## Section B"));
    }

    [Fact]
    public void Chunk_keeps_heading_with_following_body_across_blank_line()
    {
        StructureAwareTextChunker sut = new();
        string body = new string('x', 700);
        string text = $"## Section A\n\n{body}";

        IReadOnlyList<string> chunks = sut.Chunk(text, maxChars: 1200, overlap: 150);

        chunks.Should().ContainSingle();
        chunks[0].Should().StartWith("## Section A");
        chunks[0].Should().Contain(body);
    }

    [Fact]
    public void Chunk_preserves_fenced_code_block_without_splitting_fence_markers()
    {
        StructureAwareTextChunker sut = new();
        string text = """
            ## Implementation
            Sample payload:

            ```json
            {
              "service": "payments",
              "region": "eastus"
            }
            ```

            ## Notes
            Rotate keys quarterly.
            """;

        IReadOnlyList<string> chunks = sut.Chunk(text, maxChars: 1200, overlap: 150);

        chunks.Should().ContainSingle();
        chunks[0].Should().Contain("```json");
        chunks[0].Should().Contain("\"service\": \"payments\"");
    }

    [Fact]
    public void Chunk_keeps_fenced_code_block_markers_intact_when_block_exceeds_max_chars()
    {
        StructureAwareTextChunker sut = new();
        string inner = new string('x', 800);
        string text = $"## Implementation\n```json\n{inner}\n```\n\n## Notes\nTail section.";

        IReadOnlyList<string> chunks = sut.Chunk(text, maxChars: 200, overlap: 20);

        chunks.Should().NotBeEmpty();

        foreach (string chunk in chunks)
        {
            int fenceMarkers = chunk.Split("```", StringSplitOptions.None).Length - 1;
            fenceMarkers.Should().BeOneOf(0, 2, 4);
        }
    }
}
