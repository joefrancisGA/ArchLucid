using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class RealModeSmokeCommandOptionsTests
{
    [Fact]
    public void Parse_Staging_AutoTargetsBaseUrlAndOneLineAndRequiresRealTokens()
    {
        RealModeSmokeCommandOptions? opts = RealModeSmokeCommandOptions.Parse(["--staging"], out string? error);

        error.Should().BeNull();
        opts.Should().NotBeNull();
        opts!.ApiBaseUrl.Should().Be(RealModeSmokeCommandOptions.StagingApiBaseUrl);
        opts.TargetStaging.Should().BeTrue();
        opts.OneLineOutput.Should().BeTrue();
        opts.RequireRealExecutionTokens.Should().BeTrue();
    }

    [Fact]
    public void Parse_RejectsConflictingStagingBaseUrl()
    {
        RealModeSmokeCommandOptions? opts = RealModeSmokeCommandOptions.Parse(
            ["--staging", "--api-base-url", "https://other.example"],
            out string? error);

        opts.Should().BeNull();
        error.Should().Contain("--staging");
    }

    [Fact]
    public void Parse_AllowSimulator_DisablesRealTokenRequirementEvenOnStaging()
    {
        RealModeSmokeCommandOptions? opts = RealModeSmokeCommandOptions.Parse(
            ["--staging", "--allow-simulator"],
            out string? error);

        error.Should().BeNull();
        opts!.RequireRealExecutionTokens.Should().BeFalse();
    }

    [Fact]
    public void Parse_AcceptsTimeoutAndPollOverrides()
    {
        RealModeSmokeCommandOptions? opts = RealModeSmokeCommandOptions.Parse(
            ["--api-base-url", "http://127.0.0.1:5000", "--timeout-seconds", "120", "--poll-interval-seconds", "5"],
            out string? error);

        error.Should().BeNull();
        opts!.TimeoutSeconds.Should().Be(120);
        opts.PollIntervalSeconds.Should().Be(5);
        opts.OneLineOutput.Should().BeFalse();
    }
}
