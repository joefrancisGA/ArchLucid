using ArchLucid.AgentRuntime;

using FluentAssertions;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Suite", "Core")]
public sealed class StreamingJsonAnswerExtractorTests
{
    [Fact]
    public void AppendChunkAndTakeAnswerDelta_streams_answer_field_incrementally()
    {
        StreamingJsonAnswerExtractor extractor = new();
        string[] chunks =
        [
            "{\"answer\":\"Hel",
            "lo ",
            "world\"",
            ",\"referencedDecisions\":[]}"
        ];

        string first = extractor.AppendChunkAndTakeAnswerDelta(chunks[0]);
        string second = extractor.AppendChunkAndTakeAnswerDelta(chunks[1]);
        string third = extractor.AppendChunkAndTakeAnswerDelta(chunks[2]);
        string fourth = extractor.AppendChunkAndTakeAnswerDelta(chunks[3]);

        first.Should().Be("Hel");
        second.Should().Be("lo ");
        third.Should().Be("world");
        fourth.Should().BeEmpty();
    }

    [Fact]
    public void TryExtractAnswerValue_decodes_json_escapes()
    {
        string? value = StreamingJsonAnswerExtractor.TryExtractAnswerValue(
            """{"answer":"Line1\nLine2","referencedDecisions":[]}""");

        value.Should().Be("Line1\nLine2");
    }

    [Fact]
    public void AppendChunk_buffers_unicode_escapes_and_surrogate_pairs_across_chunks()
    {
        StreamingJsonAnswerExtractor extractor = new();

        extractor.AppendChunkAndTakeAnswerDelta("""{"answer":"left \u00""").Should().Be("left ");
        extractor.AppendChunkAndTakeAnswerDelta("""e9\uD83D""").Should().Be("é");
        extractor.AppendChunkAndTakeAnswerDelta("""\uDE03!""").Should().Be("😃!");
        extractor.AppendChunkAndTakeAnswerDelta("\"}").Should().BeEmpty();
    }

    [Fact]
    public void AppendChunk_waits_for_the_top_level_answer()
    {
        StreamingJsonAnswerExtractor extractor = new();

        extractor.AppendChunkAndTakeAnswerDelta("""{"metadata":[{"answer":"not the answer"}],""")
            .Should().BeEmpty();
        extractor.AppendChunkAndTakeAnswerDelta(""" "answer":"the answer"}""").Should().Be("the answer");
    }

    [Fact]
    public void AppendChunk_streams_an_escaped_top_level_answer_name()
    {
        StreamingJsonAnswerExtractor extractor = new();

        extractor.AppendChunkAndTakeAnswerDelta("""{"metadata":{"\u0061nswer":"nested"},"\u00""").Should().BeEmpty();
        extractor.AppendChunkAndTakeAnswerDelta("""61nswer":"Hel""").Should().Be("Hel");
        extractor.AppendChunkAndTakeAnswerDelta("""lo"}""").Should().Be("lo");
        extractor.RawJson.Should().Be("""{"metadata":{"\u0061nswer":"nested"},"\u0061nswer":"Hello"}""");
    }

    [Theory]
    [InlineData("""\u006deta""")]
    [InlineData("""\uD83D""")]
    public void AppendChunk_ignores_unrelated_escaped_property_names(string escapedName)
    {
        StreamingJsonAnswerExtractor extractor = new();

        extractor.AppendChunkAndTakeAnswerDelta($$"""{"{{escapedName}}":"metadata","answer":"Hello"}""")
            .Should().Be("Hello");
    }

    [Fact]
    public void AppendChunk_does_not_emit_half_of_a_raw_surrogate_pair()
    {
        StreamingJsonAnswerExtractor extractor = new();
        extractor.AppendChunkAndTakeAnswerDelta("{\"answer\":\"\uD83D").Should().BeEmpty();
        extractor.AppendChunkAndTakeAnswerDelta("\uDE03\"}").Should().Be("😃");
    }
}
