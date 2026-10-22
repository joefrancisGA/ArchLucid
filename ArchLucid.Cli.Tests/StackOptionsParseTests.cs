using ArchLucid.Cli.Stack;
using ArchLucid.Cli.Stack.Doctor;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class StackOptionsParseTests
{
    [Fact]
    public void StackInitOptions_TryParse_parses_all_flags()
    {
        bool ok = StackInitOptions.TryParse(
            ["--from-example", "--force", "--answers", "a.yaml", "--out", "out", "--repo-root", "C:\\repo"],
            out StackInitOptions? options,
            out string? error);

        ok.Should().BeTrue(error);
        options.Should().NotBeNull();
        options!.FromExample.Should().BeTrue();
        options.Force.Should().BeTrue();
        options.AnswersPath.Should().Be("a.yaml");
        options.OutputDirectory.Should().Be("out");
        options.RepositoryRoot.Should().Be("C:\\repo");
    }

    [Fact]
    public void StackInitOptions_TryParse_rejects_unknown_token_and_missing_values()
    {
        StackInitOptions.TryParse(["--bogus"], out _, out string? unknown).Should().BeFalse();
        unknown.Should().Contain("Unknown argument");

        StackInitOptions.TryParse(["--answers"], out _, out string? missing).Should().BeFalse();
        missing.Should().Contain("Missing value");
    }

    [Fact]
    public void StackDiffOptions_TryParse_parses_all_flags()
    {
        bool ok = StackDiffOptions.TryParse(
            ["--answers", "answers.yaml", "--out", "generated", "--repo-root", "C:\\repo"],
            out StackDiffOptions? options,
            out string? error);

        ok.Should().BeTrue(error);
        options!.AnswersPath.Should().Be("answers.yaml");
        options.OutputDirectory.Should().Be("generated");
        options.RepositoryRoot.Should().Be("C:\\repo");
    }

    [Fact]
    public void StackDiffOptions_TryParse_rejects_unknown_token()
    {
        StackDiffOptions.TryParse(["--force"], out _, out string? error).Should().BeFalse();
        error.Should().Contain("Unknown argument");
    }

    [Fact]
    public void StackDoctorOptions_TryParse_parses_all_flags()
    {
        bool ok = StackDoctorOptions.TryParse(
            [
                "--profile",
                "post-deploy",
                "--answers",
                "stack.yaml",
                "--repo-root",
                "C:\\repo",
                "--api-base-url",
                "https://api.example.com",
                "--environment",
                "production",
                "--json",
                "--json-out",
                "out.json",
                "--markdown-out",
                "out.md",
            ],
            out StackDoctorOptions? options,
            out string? error);

        ok.Should().BeTrue(error);
        options!.Profile.Should().Be("post-deploy");
        options.AnswersPath.Should().Be("stack.yaml");
        options.RepositoryRoot.Should().Be("C:\\repo");
        options.ApiBaseUrl.Should().Be("https://api.example.com");
        options.DeploymentEnvironment.Should().Be("production");
        options.JsonStdout.Should().BeTrue();
        options.JsonOutPath.Should().Be("out.json");
        options.MarkdownOutPath.Should().Be("out.md");
    }

    [Fact]
    public void StackDoctorOptions_TryParse_accepts_help_without_other_flags()
    {
        StackDoctorOptions.TryParse(["--help"], out StackDoctorOptions? options, out string? error).Should().BeTrue(error);
        options.Should().NotBeNull();
    }

    [Fact]
    public void StackDoctorOptions_TryParse_rejects_null_args_empty_values_and_unknown_tokens()
    {
        StackDoctorOptions.TryParse(null!, out _, out string? nullArgs).Should().BeFalse();
        nullArgs.Should().Contain("required");

        StackDoctorOptions.TryParse(["--profile"], out _, out string? missing).Should().BeFalse();
        missing.Should().Contain("Missing value");

        StackDoctorOptions.TryParse(["--profile", "   "], out _, out string? empty).Should().BeFalse();
        empty.Should().Contain("Empty value");

        StackDoctorOptions.TryParse(["--nope"], out _, out string? unknown).Should().BeFalse();
        unknown.Should().Contain("Unknown argument");
    }
}
