using ArchLucid.Retrieval.Chunking;

using FluentAssertions;

namespace ArchLucid.Retrieval.Tests;

[Trait("Category", "Unit")]
public sealed class PolicyPackChunkerTests
{
    [Fact]
    public void Chunk_short_rule_returns_single_slice()
    {
        PolicyPackChunker sut = new();
        string text = "[pack v1.0] [High] Encrypt data (Security): Enable TLS for all endpoints.";

        IReadOnlyList<string> chunks = sut.Chunk(text);

        chunks.Should().ContainSingle().Which.Should().Be(text);
    }

    [Fact]
    public void Chunk_long_description_splits_header_and_body()
    {
        PolicyPackChunker sut = new();
        string body = string.Join(' ', Enumerable.Repeat("Sentence fragment.", 80));
        string text = "[pack v1.0] [High] Encrypt data (Security): " + body;

        IReadOnlyList<string> chunks = sut.Chunk(text, maxChars: 400, overlap: 40);

        chunks.Should().NotBeEmpty();
        chunks.Should().OnlyContain(c => c.StartsWith("[pack v1.0]", StringComparison.Ordinal));
    }

    [Fact]
    public void Chunk_url_in_control_name_splits_on_category_colon_not_url_colon()
    {
        PolicyPackChunker sut = new();
        string body = string.Join(' ', Enumerable.Repeat("Egress detail sentence.", 60));
        string text = "[pack v1.0] [High] Allow https://api.example.com:443 egress (Network): " + body;

        IReadOnlyList<string> chunks = sut.Chunk(text, maxChars: 400, overlap: 40);

        chunks.Should().NotBeEmpty();
        chunks.Should().OnlyContain(c => c.StartsWith("[pack v1.0] [High] Allow https://api.example.com:443 egress (Network):", StringComparison.Ordinal));
    }
}
