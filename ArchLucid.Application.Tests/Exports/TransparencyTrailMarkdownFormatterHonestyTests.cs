using System.Text;

using ArchLucid.Application.Exports;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TransparencyTrailMarkdownFormatterHonestyTests
{
    [Fact]
    public void AppendMarkdownSection_labels_blank_inferred_confidence_and_skipped_questions()
    {
        StringBuilder sb = new();
        TransparencyTrail trail = new()
        {
            Asserted = [new AssertedTrailEntry { Key = "outcome", Value = "Ship" }],
            Inferred =
            [
                new InferredTrailEntry
                {
                    Key = string.Empty,
                    Value = string.Empty,
                    Confidence = 0,
                },
            ],
            Skipped = [],
        };

        TransparencyTrailMarkdownFormatter.AppendMarkdownSection(sb, trail);
        string markdown = sb.ToString();

        markdown.Should().Contain(InferredTrailEntry.ConfidenceNotStoredLabel);
        markdown.Should().Contain(InferredTrailEntry.ValueStoredEmptyLabel);
        markdown.Should().Contain(TransparencyTrailMarkdownFormatter.SkippedQuestionsNotRecordedCopy);
        markdown.Should().Contain("Skipped MUST questions were stored empty.");
    }

    [Fact]
    public void AppendMarkdownSection_includes_asserted_trail_metadata_suffixes()
    {
        StringBuilder sb = new();
        TransparencyTrail trail = new()
        {
            Asserted =
            [
                new AssertedTrailEntry
                {
                    Key = "businessOutcome",
                    Value = "Ship",
                    ResponderLabel = "Room",
                    QuestionId = "q-1",
                    RecordedUtc = new DateTime(2026, 1, 2, 3, 4, 5, DateTimeKind.Utc),
                },
            ],
            Inferred = [],
            Skipped = [],
        };

        TransparencyTrailMarkdownFormatter.AppendMarkdownSection(sb, trail);
        string markdown = sb.ToString();

        markdown.Should().Contain(" — Room");
        markdown.Should().Contain(" — Question id: q-1");
        markdown.Should().Contain(" — Answer recorded time:");
    }
}
