using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests.Commands;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TryCommandOptionsTests
{
    [Fact]
    public void Parse_DefaultsToRehearsalDoorWithoutCareerFlags()
    {
        TryCommandOptions? options = TryCommandOptions.Parse([], out string? error);

        error.Should().BeNull();
        options.Should().NotBeNull();
        options!.Door.Should().Be(TryCommandExecutionDoor.Rehearsal);
        options.StrictReal.Should().BeFalse();
        options.HasForwardedSmokeArgs.Should().BeFalse();
    }

    [Fact]
    public void Parse_Rehearse_SelectsRehearsalDoor()
    {
        TryCommandOptions? options = TryCommandOptions.Parse(["--rehearse", "--staging"], out string? error);

        error.Should().BeNull();
        options!.Door.Should().Be(TryCommandExecutionDoor.Rehearsal);
        options.ForwardedSmokeArgs.Should().Equal("--staging");
        options.IsHostedSmokeTarget.Should().BeTrue();
    }

    [Fact]
    public void Parse_Real_SelectsCareerDoor()
    {
        TryCommandOptions? options = TryCommandOptions.Parse(["--real", "--staging"], out string? error);

        error.Should().BeNull();
        options!.Door.Should().Be(TryCommandExecutionDoor.Career);
        options.IsHostedSmokeTarget.Should().BeTrue();
    }

    [Fact]
    public void Parse_RejectsRealAndRehearseTogether()
    {
        TryCommandOptions? options = TryCommandOptions.Parse(["--real", "--rehearse"], out string? error);

        options.Should().BeNull();
        error.Should().Contain("Career");
        error.Should().Contain("Rehearsal");
    }

    [Fact]
    public void Parse_StrictRealRequiresRealFlag()
    {
        TryCommandOptions? options = TryCommandOptions.Parse(["--strict-real"], out string? error);

        options.Should().BeNull();
        error.Should().Contain("--strict-real");
    }

    [Fact]
    public void BuildSmokeArgs_RehearsalPrependsAllowSimulator()
    {
        TryCommandOptions options = new()
        {
            Door = TryCommandExecutionDoor.Rehearsal,
            ForwardedSmokeArgs = ["--staging"],
        };

        string[] smokeArgs = TryCommand.BuildSmokeArgs(options);

        smokeArgs.Should().Equal("--allow-simulator", "--staging");
    }

    [Fact]
    public void BuildSmokeArgs_CareerDoesNotInjectAllowSimulator()
    {
        TryCommandOptions options = new()
        {
            Door = TryCommandExecutionDoor.Career,
            ForwardedSmokeArgs = ["--staging"],
        };

        string[] smokeArgs = TryCommand.BuildSmokeArgs(options);

        smokeArgs.Should().Equal("--staging");
    }
}
