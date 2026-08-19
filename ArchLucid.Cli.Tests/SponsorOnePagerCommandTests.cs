using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class SponsorOnePagerCommandTests
{
    [Fact]
    public async Task Usage_error_when_run_id_missing()
    {
        int exit = await SponsorOnePagerCommand.RunAsync(string.Empty, save: false, CancellationToken.None);

        exit.Should().Be(CliExitCode.UsageError);
    }
}
