using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackSponsorReviewCoverageHonestyPlainTextTests
{
    [Fact]
    public void RenderPlainTextLines_when_run_id_contains_pipe_quotes_run_id_in_lead_line()
    {
        IReadOnlyList<string> lines = SponsorReviewCoverageHonestyMarkdownFormatter.RenderPlainTextLines(
            new SponsorReviewCoverageHonestyContext(
                RunId: "run|kpi",
                Verdict: new FeasibilityVerdict { Kind = FeasibilityVerdictKind.Feasible },
                AnalysisStagesComplete: true,
                ActorNodeCount: 0));

        lines[1].Should().Be(
            "Sponsor KPIs for review 'run|kpi' are not an all-clear bill of health. Open the architecture package in ArchLucid before steering or procurement use.");
    }

    [Fact]
    public void RenderPlainTextLines_when_skipped_must_question_key_contains_comma_quotes_key()
    {
        TransparencyTrail trail = new()
        {
            Skipped =
            [
                new SkippedQuestionTrailEntry
                {
                    Tier = ElicitationQuestionTier.Must,
                    QuestionKey = "scale,evil",
                },
            ],
        };

        IReadOnlyList<string> lines = SponsorReviewCoverageHonestyMarkdownFormatter.RenderPlainTextLines(
            new SponsorReviewCoverageHonestyContext(
                RunId: "run-1",
                Verdict: new FeasibilityVerdict
                {
                    Kind = FeasibilityVerdictKind.Feasible,
                    TransparencyTrail = trail,
                },
                AnalysisStagesComplete: false,
                ActorNodeCount: 1));

        lines.Should().Contain("Skipped required questions: 'scale,evil'");
    }
}
