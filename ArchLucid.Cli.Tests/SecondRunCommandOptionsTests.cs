using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SecondRunCommandOptionsTests
{
    [Fact]
    public void Parse_returns_null_when_args_empty()
    {
        SecondRunCommandOptions? options = SecondRunCommandOptions.Parse([], out string? error);

        options.Should().BeNull();
        error.Should().Contain("second-run");
    }

    [Fact]
    public void Parse_rejects_flag_as_input_path()
    {
        SecondRunCommandOptions? options = SecondRunCommandOptions.Parse(["--api-base-url"], out string? error);

        options.Should().BeNull();
        error.Should().Contain("Missing input file");
    }

    [Fact]
    public void Parse_applies_defaults_for_input_only()
    {
        SecondRunCommandOptions? options = SecondRunCommandOptions.Parse(["second-run.json"], out string? error);

        error.Should().BeNull();
        options.Should().NotBeNull();
        options!.InputPath.Should().Be("second-run.json");
        options.ApiBaseUrl.Should().Be(SecondRunCommandOptions.DefaultApiBaseUrl);
        options.UiBaseUrl.Should().Be(SecondRunCommandOptions.DefaultUiBaseUrl);
        options.OpenArtifacts.Should().BeTrue();
        options.ApiBaseUrlFromArgument.Should().BeFalse();
        options.CommitDeadline.Should().Be(SecondRunCommandOptions.DefaultCommitDeadline);
    }

    [Fact]
    public void Parse_honors_api_ui_no_open_and_commit_deadline()
    {
        SecondRunCommandOptions? options = SecondRunCommandOptions.Parse(
            [
                "pack.json",
                "--api-base-url",
                "https://api.example.com/",
                "--ui-base-url",
                "https://ui.example.com/",
                "--no-open",
                "--commit-deadline",
                "120"
            ],
            out string? error);

        error.Should().BeNull();
        options.Should().NotBeNull();
        options!.ApiBaseUrl.Should().Be("https://api.example.com");
        options.UiBaseUrl.Should().Be("https://ui.example.com");
        options.OpenArtifacts.Should().BeFalse();
        options.ApiBaseUrlFromArgument.Should().BeTrue();
        options.CommitDeadline.Should().Be(TimeSpan.FromSeconds(120));
    }

    [Fact]
    public void Parse_rejects_unknown_flag()
    {
        SecondRunCommandOptions? options = SecondRunCommandOptions.Parse(
            ["pack.json", "--unexpected"],
            out string? error);

        options.Should().BeNull();
        error.Should().Contain("Unknown argument");
    }

    [Fact]
    public void Parse_rejects_missing_value_for_api_base_url()
    {
        SecondRunCommandOptions? options = SecondRunCommandOptions.Parse(
            ["pack.json", "--api-base-url"],
            out string? error);

        options.Should().BeNull();
        error.Should().Contain("Missing value for --api-base-url");
    }

    [Fact]
    public void Parse_rejects_non_positive_commit_deadline()
    {
        SecondRunCommandOptions? options = SecondRunCommandOptions.Parse(
            ["pack.json", "--commit-deadline", "0"],
            out string? error);

        options.Should().BeNull();
        error.Should().Contain("positive integer");
    }
}
