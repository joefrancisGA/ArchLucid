using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SponsorReviewCoverageHonestyMarkdownFormatterTests
{
    [Fact]
    public void AppendMarkdownSection_includes_honesty_when_skipped_must_questions_present()
    {
        SponsorReviewCoverageHonestyContext context = new(
            RunId: "run-abc",
            Verdict: new FeasibilityVerdict
            {
                Kind = FeasibilityVerdictKind.Feasible,
                TransparencyTrail = new TransparencyTrail
                {
                    Skipped =
                    [
                        new SkippedQuestionTrailEntry
                        {
                            QuestionKey = "data-residency",
                            Tier = ElicitationQuestionTier.Must,
                        },
                    ],
                },
            },
            AnalysisStagesComplete: true,
            ActorNodeCount: 1);

        StringBuilder sb = new();
        SponsorReviewCoverageHonestyMarkdownFormatter.AppendMarkdownSection(sb, context);
        string markdown = sb.ToString();

        markdown.Should().Contain("Architecture package honesty");
        markdown.Should().Contain("not** an all-clear");
        markdown.Should().Contain("data-residency");
    }

    [Fact]
    public void AppendMarkdownSection_includes_quiet_engine_clause_when_no_actors()
    {
        SponsorReviewCoverageHonestyContext context = new(
            RunId: "run-quiet",
            Verdict: null,
            AnalysisStagesComplete: true,
            ActorNodeCount: 0);

        StringBuilder sb = new();
        SponsorReviewCoverageHonestyMarkdownFormatter.AppendMarkdownSection(sb, context);
        string markdown = sb.ToString();

        markdown.Should().Contain("no Actor nodes");
        markdown.Should().Contain("IaC uploads alone do not create actors");
    }

    [Fact]
    public void AppendMarkdownSection_includes_transparency_trail_excerpt_for_infeasible_verdict()
    {
        SponsorReviewCoverageHonestyContext context = new(
            RunId: "run-infeasible",
            Verdict: new FeasibilityVerdict
            {
                Kind = FeasibilityVerdictKind.SoftInfeasible,
                Summary = "Policy controls are not satisfied.",
                TransparencyTrail = new TransparencyTrail
                {
                    Asserted =
                    [
                        new AssertedTrailEntry { Key = "businessOutcome", Value = "Reduce triage time" },
                    ],
                    Inferred =
                    [
                        new InferredTrailEntry
                        {
                            Key = "policy.violation.CIS-1.1",
                            Value = "Encrypt data at rest",
                            Confidence = 85,
                        },
                    ],
                    Skipped =
                    [
                        new SkippedQuestionTrailEntry
                        {
                            QuestionKey = "l0.pillar.security",
                            Tier = ElicitationQuestionTier.Must,
                        },
                    ],
                },
            },
            AnalysisStagesComplete: true,
            ActorNodeCount: 1);

        StringBuilder sb = new();
        SponsorReviewCoverageHonestyMarkdownFormatter.AppendMarkdownSection(sb, context);
        string markdown = sb.ToString();

        markdown.Should().Contain("Feasibility verdict:");
        markdown.Should().Contain("Soft infeasible");
        markdown.Should().Contain("## Transparency trail");
        markdown.Should().Contain("### Asserted (1)");
        markdown.Should().Contain("businessOutcome");
        markdown.Should().Contain("l0.pillar.security");
    }

    [Fact]
    public void AppendMarkdownSection_omits_section_when_coverage_is_complete()
    {
        SponsorReviewCoverageHonestyContext context = new(
            RunId: "run-clean",
            Verdict: new FeasibilityVerdict { Kind = FeasibilityVerdictKind.Feasible },
            AnalysisStagesComplete: true,
            ActorNodeCount: 2);

        StringBuilder sb = new();
        SponsorReviewCoverageHonestyMarkdownFormatter.AppendMarkdownSection(sb, context);

        sb.ToString().Should().BeEmpty();
    }
}
