using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
public sealed class InfeasibleHonestyCommandTests
{
    [Fact]
    public async Task RunAsync_json_includes_hard_and_soft_lines()
    {
        using StringWriter writer = new();
        Console.SetOut(writer);

        int exitCode = await InfeasibleHonestyCommand.RunAsync(["--json"]);

        exitCode.Should().Be(0);

        string output = writer.ToString();

        output.Should().Contain("hardRequiresCitation");
        output.Should().Contain("softEnvelope");
        output.Should().Contain(CliInfeasibleHonesty.HardRequiresCitationLine);
        output.Should().Contain("Soft infeasible: labeled envelope");
        output.Should().Contain("not Career-complete without sealed run stamp (CG).");
    }
}
