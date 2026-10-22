using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Suite", "Core")]
public sealed class TemplatesListCommandTests
{
    [Fact]
    public async Task RunAsync_succeeds_when_repo_marker_present()
    {
        string? root = CliRepositoryRootResolver.TryResolveRepositoryRoot();

        if (root is null)
            return;

        int exit = await TemplatesListCommand.RunAsync(["--repo-root", root]);

        exit.Should().Be(CliExitCode.Success);
    }
}
