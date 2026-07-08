using ArchLucid.Cli.Stack.Doctor;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class StackDoctorStepRunnerCoverageTests
{
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public void ConfigLintStepRunner_returns_structured_result_for_production_like_flag(bool productionLike)
    {
        StackDoctorStepResult result = StackDoctorConfigLintStepRunner.Run(productionLike);

        result.StepId.Should().Be("config-lint");
        result.DisplayName.Should().Contain(productionLike ? "Production-like" : "simulate production");
        result.Verdict.Should().BeOneOf(
            StackDoctorVerdict.Pass,
            StackDoctorVerdict.Warn,
            StackDoctorVerdict.Fail);
        result.Detail.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task DeploymentEvidenceStepRunner_rejects_invalid_api_base_url()
    {
        StackDoctorStepResult result =
            await StackDoctorDeploymentEvidenceStepRunner.RunAsync("not-a-url", "staging", CancellationToken.None);

        result.Verdict.Should().Be(StackDoctorVerdict.Fail);
        result.Detail.Should().Contain("Invalid API base URL");
    }

    [Fact]
    public async Task OnboardPreflightStepRunner_rejects_invalid_api_base_url()
    {
        StackDoctorStepResult result =
            await StackDoctorOnboardPreflightStepRunner.RunAsync("://bad", CancellationToken.None);

        result.Verdict.Should().Be(StackDoctorVerdict.Fail);
        result.Detail.Should().Contain("Invalid API base URL");
    }

    [Fact]
    public async Task PwshScriptRunner_returns_error_when_script_is_missing()
    {
        string tempRoot = Path.Combine(Path.GetTempPath(), "archlucid-pwsh-" + Guid.NewGuid().ToString("N"));

        try
        {
            Directory.CreateDirectory(tempRoot);

            (int exitCode, string output) = await StackDoctorPwshScriptRunner.RunAsync(
                tempRoot,
                Path.Combine("scripts", "missing-script.ps1"),
                [],
                CancellationToken.None);

            exitCode.Should().Be(2);
            output.Should().Contain("Script not found");
        }
        finally
        {
            if (Directory.Exists(tempRoot))
                Directory.Delete(tempRoot, recursive: true);
        }
    }
}
