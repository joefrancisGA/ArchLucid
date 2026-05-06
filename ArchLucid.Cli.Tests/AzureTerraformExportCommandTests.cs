using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

public sealed class AzureTerraformExportCommandTests
{

    [Fact]

    public async Task RunAsync_missing_arguments_returns_usage()

    {

        int code = await AzureTerraformExportCommand.RunAsync(Array.Empty<string>());

        code.Should().Be(CliExitCode.UsageError);

    }

    [Fact]

    public async Task RunAsync_extra_token_returns_usage()

    {

        int code = await AzureTerraformExportCommand.RunAsync(
            ["--subscription", "s", "--resource-group", "g", "--out", "out.zip", "nope"]);

        code.Should().Be(CliExitCode.UsageError);

    }

}
