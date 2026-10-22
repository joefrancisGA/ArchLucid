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
}
