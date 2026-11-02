using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackPilotRunDeltasLlmCallCountFormatterTests
{
    [Fact]
    public void FormatPlainText_when_zero_resolved_discloses_simulator_caveat()
    {
        PilotRunDeltas deltas = new()
        {
            LlmCallCount = 0,
            LlmCallCountResolved = true,
        };

        PilotRunDeltasLlmCallCountFormatter.FormatPlainText(deltas)
            .Should()
            .Contain(PilotRunDeltasLlmCallCountFormatter.ZeroSimulatorCaveatPlain);
    }

    [Fact]
    public void FormatMarkdownTableCell_when_zero_resolved_discloses_simulator_caveat()
    {
        PilotRunDeltas deltas = new()
        {
            LlmCallCount = 0,
            LlmCallCountResolved = true,
        };

        PilotRunDeltasLlmCallCountFormatter.FormatMarkdownTableCell(deltas)
            .Should()
            .Contain(PilotRunDeltasLlmCallCountFormatter.ZeroSimulatorCaveatPlain);
    }
}
