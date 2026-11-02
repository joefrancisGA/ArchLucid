using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackSponsorReviewCoverageHonestyMarkdownTests
{
    [Fact]
    public void Coverage_honesty_blockquote_when_run_id_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        SponsorReviewCoverageHonestyMarkdownFormatter.AppendMarkdownSection(
            sb,
            new SponsorReviewCoverageHonestyContext(
                RunId: "run`kpi",
                Verdict: null,
                AnalysisStagesComplete: true,
                ActorNodeCount: 0));

        sb.ToString().Should().Contain("``run`kpi``");
    }

    [Fact]
    public void Coverage_honesty_when_skipped_must_question_key_contains_newline_does_not_emit_extra_bullet()
    {
        TransparencyTrail trail = new()
        {
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
        markdown.Should().Contain("**Skipped required questions:**");
        markdown.Should().Contain("`scale -evil`");
        markdown.Split('\n').Should().NotContain("- evil");
    }
}
