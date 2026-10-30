using System.Text;

using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackTransparencyTrailMarkdownTests
{
    [Fact]
    public void Transparency_trail_when_skipped_must_question_key_contains_newline_does_not_emit_extra_bullet()
    {
        TransparencyTrail trail = new()
        {
            Asserted = [],
            Inferred = [],
            Skipped =
            [
                new SkippedQuestionTrailEntry
                {
                    Tier = ElicitationQuestionTier.Must,
                    QuestionKey = "scale\n-evil",
                },
            ],
        };

        StringBuilder sb = new();
        SponsorReviewCoverageHonestyMarkdownFormatter.AppendMarkdownSection(
            sb,
            new SponsorReviewCoverageHonestyContext(
                RunId: "run-1",
                Verdict: new FeasibilityVerdict
                {
                    Kind = FeasibilityVerdictKind.Feasible,
                    TransparencyTrail = trail,
                },
                AnalysisStagesComplete: false,
                ActorNodeCount: 1));

        string markdown = sb.ToString();
        markdown.Should().Contain("### Skipped MUST questions");
        markdown.Should().Contain("`scale -evil`");
        markdown.Split('\n').Should().NotContain("- evil (Must)");
    }

    [Fact]
    public void Transparency_trail_when_asserted_value_contains_newline_does_not_emit_extra_bullet()
    {
        TransparencyTrail trail = new()
        {
            Asserted =
            [
                new AssertedTrailEntry
                {
                    Key = "businessOutcome",
                    Value = "Ship\n-evil",
                },
            ],
            Inferred = [],
            Skipped = [],
        };

        StringBuilder sb = new();
        TransparencyTrailMarkdownFormatter.AppendMarkdownSection(sb, trail);

        string markdown = sb.ToString();
        markdown.Should().Contain("### Asserted");
        markdown.Should().Contain("`Ship -evil`");
        markdown.Split('\n').Should().NotContain("- evil");
    }

    [Fact]
    public void Transparency_trail_when_asserted_responder_label_contains_newline_does_not_emit_extra_bullet()
    {
        TransparencyTrail trail = new()
        {
            Asserted =
            [
                new AssertedTrailEntry
                {
                    Key = "businessOutcome",
                    Value = "Ship",
                    ResponderLabel = "Room\n-evil",
                },
            ],
            Inferred = [],
            Skipped = [],
        };

        StringBuilder sb = new();
        TransparencyTrailMarkdownFormatter.AppendMarkdownSection(sb, trail);

        string markdown = sb.ToString();
        markdown.Should().Contain("`Room -evil`");
        markdown.Split('\n').Should().NotContain("- evil");
    }

    [Fact]
    public void Transparency_trail_when_inferred_value_contains_newline_does_not_emit_extra_bullet()
    {
        TransparencyTrail trail = new()
        {
            Asserted = [],
            Inferred =
            [
                new InferredTrailEntry
                {
                    Key = "scale.requestsPerSecond",
                    Value = "1000\n-evil",
                    Confidence = 80,
                },
            ],
            Skipped = [],
        };

        StringBuilder sb = new();
        TransparencyTrailMarkdownFormatter.AppendMarkdownSection(sb, trail);

        string markdown = sb.ToString();
        markdown.Should().Contain("### Inferred");
        markdown.Should().Contain("`1000 -evil`");
        markdown.Split('\n').Should().NotContain("- evil");
    }

    [Fact]
    public void Transparency_trail_when_working_document_open_question_value_contains_newline_does_not_emit_extra_bullet()
    {
        TransparencyTrail trail = new()
        {
            Asserted =
            [
                new AssertedTrailEntry
                {
                    Key = "openQuestions.followUp",
                    Value = "Need\n-evil",
                },
            ],
            Inferred = [],
            Skipped = [],
        };

        StringBuilder sb = new();
        TransparencyTrailMarkdownFormatter.AppendMarkdownSection(sb, trail);

        string markdown = sb.ToString();
        markdown.Should().Contain(OpenQuestionsExportHonesty.WorkingDocumentExportHeading);
        markdown.Should().Contain("`Need -evil`");
        markdown.Split('\n').Should().NotContain("- evil");
    }
}
