using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotInitReportBuilderTests
{
    [Fact]
    public void Build_AllPass_DispositionIsPassWithNoFixSteps()
    {
        IReadOnlyList<PilotPreflightStepResult> checks =
        [
            new()
            {
                Name = "health/ready",
                Disposition = PilotPreflightDisposition.Pass,
                Detail = "ok",
            },
        ];

        PilotInitReportDocument report = PilotInitReportBuilder.Build("https://api.test", checks);

        report.OverallDisposition.Should().Be("PASS");
        report.BlockingCount.Should().Be(0);
        report.WarningCount.Should().Be(0);
        report.FixSteps.Should().BeEmpty();
    }

    [Fact]
    public void Build_WithBlockAndWarn_DispositionIsHoldWithNumberedFixSteps()
    {
        IReadOnlyList<PilotPreflightStepResult> checks =
        [
            new()
            {
                Name = "health/ready",
                Disposition = PilotPreflightDisposition.Block,
                Detail = "503",
                Remediation = "Start API",
            },
            new()
            {
                Name = "config-lint:Auth:rule",
                Disposition = PilotPreflightDisposition.Warn,
                Detail = "advisory",
            },
        ];

        PilotInitReportDocument report = PilotInitReportBuilder.Build("https://api.test", checks);

        report.OverallDisposition.Should().Be("HOLD");
        report.BlockingCount.Should().Be(1);
        report.WarningCount.Should().Be(1);
        report.FixSteps.Should().HaveCount(2);
        report.FixSteps[0].StepNumber.Should().Be(1);
        report.FixSteps[0].Remediation.Should().Be("Start API");
        report.FixSteps[1].StepNumber.Should().Be(2);
    }
}
