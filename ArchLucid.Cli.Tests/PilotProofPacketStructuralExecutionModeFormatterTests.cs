using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PilotProofPacketStructuralExecutionModeFormatterTests
{
    [Theory]
    [InlineData("{\"structuralExecutionMode\":1}", "Real")]
    [InlineData("{\"structuralExecutionMode\":\"Simulator\"}", "Simulator")]
    [InlineData("{\"structuralExecutionMode\":2}", "Fallback")]
    public void TryResolveLabelFromDeltasJson_parses_wire_values(string json, string expected)
    {
        PilotProofPacketStructuralExecutionModeFormatter.TryResolveLabelFromDeltasJson(json)
            .Should()
            .Be(expected);
    }

    [Fact]
    public void BuildSponsorCaveatLine_simulator_warns_against_real_mode_claims()
    {
        string line = PilotProofPacketStructuralExecutionModeFormatter.BuildSponsorCaveatLine("Simulator");

        line.Should().Contain("Simulator");
        line.Should().Contain("do not");
    }
}
