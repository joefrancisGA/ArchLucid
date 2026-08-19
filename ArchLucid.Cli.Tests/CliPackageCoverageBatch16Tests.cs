using ArchLucid.Cli.Commands;
using ArchLucid.Cli.Stack.Doctor;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CliPackageCoverageBatch16Tests
{
    [Fact]
    public void MarketplacePreflightRunner_Evaluate_throws_for_blank_repository_root()
    {
        Action act = () => MarketplacePreflightRunner.Evaluate("   ");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void CliRepositoryRootResolver_returns_null_when_marker_missing()
    {
        string temp = Path.Combine(Path.GetTempPath(), "archlucid-cli-root-" + Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(temp);

        try
        {
            CliRepositoryRootResolver.TryResolveRepositoryRoot(temp).Should().BeNull();
        }
        finally
        {
            Directory.Delete(temp, recursive: true);
        }
    }

    [Fact]
    public void CliRepositoryRootResolver_finds_marker_within_parent_chain()
    {
        string temp = Path.Combine(Path.GetTempPath(), "archlucid-cli-root-" + Guid.NewGuid().ToString("n"));
        string nested = Path.Combine(temp, "nested", "child");
        string markerDirectory = Path.Combine(temp, "docs", "go-to-market");
        Directory.CreateDirectory(nested);
        Directory.CreateDirectory(markerDirectory);
        File.WriteAllText(Path.Combine(markerDirectory, "AZURE_MARKETPLACE_SAAS_OFFER.md"), "# marker");

        try
        {
            CliRepositoryRootResolver.TryResolveRepositoryRoot(nested).Should().Be(Path.GetFullPath(temp));
        }
        finally
        {
            Directory.Delete(temp, recursive: true);
        }
    }

    [Theory]
    [InlineData("artifacts/out/report.md", "report.md")]
    [InlineData("artifacts\\out\\report.md\\", "report.md")]
    public void ArtifactOutputPathHelper_normalizes_cross_platform_trailing_segments(string path, string expected)
    {
        ArtifactOutputPathHelper.GetTrailingPathSegment(path).Should().Be(expected);
        ArtifactOutputPathHelper.GetFileNameWithoutExtensionFromPath(path).Should().Be("report");
    }

    [Fact]
    public void StackDoctorVerdictRollup_maps_exit_codes_for_each_verdict()
    {
        StackDoctorVerdictRollup.ToExitCode(StackDoctorVerdict.Pass).Should().Be(0);
        StackDoctorVerdictRollup.ToExitCode(StackDoctorVerdict.Warn).Should().Be(1);
        StackDoctorVerdictRollup.ToExitCode(StackDoctorVerdict.Fail).Should().Be(2);
        StackDoctorVerdictRollup.ToExitCode(StackDoctorVerdict.Skipped).Should().Be(0);
    }

    [Fact]
    public void StackDoctorVerdictRollup_FromSteps_returns_skipped_when_all_steps_skipped()
    {
        List<StackDoctorStepResult> steps =
        [
            new()
            {
                StepId = "a",
                DisplayName = "Config lint",
                Verdict = StackDoctorVerdict.Skipped,
                Detail = "skipped",
            },
            new()
            {
                StepId = "b",
                DisplayName = "Deployment evidence",
                Verdict = StackDoctorVerdict.Skipped,
                Detail = "skipped",
            },
        ];

        StackDoctorVerdictRollup.FromSteps(steps).Should().Be(StackDoctorVerdict.Skipped);
    }

    [Fact]
    public void DeploymentEvidenceTriageCatalog_returns_actionable_lines_for_each_failure_class()
    {
        DeploymentEvidenceTriageCatalog.LiveFailure("https://api.example.com")
            .Should()
            .Contain(line => line.Contains("/health/live", StringComparison.Ordinal));
        DeploymentEvidenceTriageCatalog.ReadyFailure()
            .Should()
            .Contain(line => line.Contains("/health/ready", StringComparison.Ordinal));
        DeploymentEvidenceTriageCatalog.OpenApiFailure("https://api.example.com")
            .Should()
            .Contain(line => line.Contains("/openapi/v1.json", StringComparison.Ordinal));
        DeploymentEvidenceTriageCatalog.VersionFailure()
            .Should()
            .Contain(line => line.Contains("/version", StringComparison.Ordinal));
        DeploymentEvidenceTriageCatalog.SyntheticFailure("/api/auth/me")
            .Should()
            .Contain(line => line.Contains("/api/auth/me", StringComparison.Ordinal));
        DeploymentEvidenceTriageCatalog.TransportFailure("GET /version")
            .Should()
            .Contain(line => line.Contains("GET /version", StringComparison.Ordinal));
    }
}
