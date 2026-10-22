using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class InsightDensityGateHumanCalibrationMarkdownTests
{
    [Fact]
    public void Write_includes_claim_boundary_and_table_headers()
    {
        string markdown = InsightDensityGateHumanCalibrationMarkdown.Write([
            new InsightDensityGateHumanCalibrationRow
            {
                EngineType = "identity-blast-radius",
                FindingCount = 10,
                DecisionGradeCount = 10,
                MedianScore = 72,
                DidNotThinkOfThatCount = 8,
                NoveltyRate = 0.8,
                Residual = 0.42,
            },
        ]);

        markdown.Should().Contain(InsightDensityGateHumanCalibrationMarkdown.ClaimBoundary);
        markdown.Should().Contain("| EngineType | FindingCount | DecisionGradeCount | MedianScore |");
        markdown.Should().Contain("identity-blast-radius");
        markdown.Should().Contain("0.8");
        markdown.Should().Contain("0.42");
    }

    [Fact]
    public void Write_renders_null_novelty_and_residual_as_em_dash()
    {
        string markdown = InsightDensityGateHumanCalibrationMarkdown.Write([
            new InsightDensityGateHumanCalibrationRow
            {
                EngineType = "topology-coverage",
                FindingCount = 3,
                DecisionGradeCount = 3,
                MedianScore = 55,
                DidNotThinkOfThatCount = 0,
                NoveltyRate = null,
                Residual = null,
            },
        ]);

        markdown.Should().Contain("topology-coverage");
        markdown.Should().Contain("—");
    }
}
