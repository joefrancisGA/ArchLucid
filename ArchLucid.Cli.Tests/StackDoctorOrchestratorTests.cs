using ArchLucid.Cli.Commands;
using ArchLucid.Cli.Stack.Doctor;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class StackDoctorOrchestratorTests
{
    [Fact]
    public async Task RunAsync_throws_when_required_arguments_are_missing()
    {
        StackDoctorOrchestrator sut = new();
        StackDoctorOptions options = new();

        Func<Task> nullRoot = () => sut.RunAsync(null!, StackDoctorProfile.FirstPilotMinimum, options, CancellationToken.None);
        await nullRoot.Should().ThrowAsync<ArgumentException>();

        Func<Task> nullProfile = () => sut.RunAsync("C:\\repo", null!, options, CancellationToken.None);
        await nullProfile.Should().ThrowAsync<ArgumentException>();

        Func<Task> nullOptions = () => sut.RunAsync("C:\\repo", StackDoctorProfile.FirstPilotMinimum, null!, CancellationToken.None);
        await nullOptions.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task RunAsync_production_like_profile_includes_config_lint_step()
    {
        string repoRoot = RequireRepositoryRoot();
        StackDoctorOrchestrator sut = new();
        StackDoctorOptions options = new();

        StackDoctorReport report = await sut.RunAsync(
            repoRoot,
            StackDoctorProfile.ProductionLike,
            options,
            CancellationToken.None);

        report.Profile.Should().Be(StackDoctorProfile.ProductionLike);
        report.Steps.Should().Contain(step => step.DisplayName.Contains("config lint", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task PostDeploy_profile_without_api_base_url_marks_http_steps_failed()
    {
        string repoRoot = RequireRepositoryRoot();
        StackDoctorOrchestrator sut = new();
        StackDoctorOptions options = new();

        StackDoctorReport report = await sut.RunAsync(
            repoRoot,
            StackDoctorProfile.PostDeploy,
            options,
            CancellationToken.None);

        report.Steps.Should().OnlyContain(step => step.Verdict == StackDoctorVerdict.Fail);
        report.Steps.Should().Contain(step => step.Detail.Contains("api-base-url", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task PostDeploy_profile_with_invalid_api_base_url_marks_http_steps_failed()
    {
        string repoRoot = RequireRepositoryRoot();
        StackDoctorOrchestrator sut = new();
        StackDoctorOptions options = new()
        {
            ApiBaseUrl = "not-a-valid-url",
        };

        StackDoctorReport report = await sut.RunAsync(
            repoRoot,
            StackDoctorProfile.PostDeploy,
            options,
            CancellationToken.None);

        report.Steps.Should().OnlyContain(step => step.Verdict == StackDoctorVerdict.Fail);
        report.Steps.Should().Contain(step => step.Detail.Contains("Invalid API base URL", StringComparison.Ordinal));
    }

    private static string RequireRepositoryRoot()
    {
        string? repoRoot = CliRepositoryRootResolver.TryResolveRepositoryRoot(AppContext.BaseDirectory);
        repoRoot.Should().NotBeNull("tests require ArchLucid repository root marker");

        return repoRoot!;
    }
}
