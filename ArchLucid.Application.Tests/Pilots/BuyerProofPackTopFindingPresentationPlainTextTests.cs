using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackTopFindingPresentationPlainTextTests
{
    [Fact]
    public void Selected_finding_plain_line_when_title_contains_backtick_quotes_title_for_pdf()
    {
        PilotRunDeltas deltas = new()
        {
            TopFindingTitle = "Run `kubectl` drain",
            TopFindingSeverity = "Error",
        };

        string line = PilotTopFindingPresentationHonestyCopy.FormatSelectedFindingPlainLine(deltas);

        line.Should().Be("Selected finding: 'Run `kubectl` drain' (severity Error).");
    }

    [Fact]
    public void Selected_finding_plain_line_when_severity_contains_apostrophe_quotes_severity()
    {
        PilotRunDeltas deltas = new()
        {
            TopFindingTitle = "Subnet drift",
            TopFindingSeverity = "O'Brien",
        };

        PilotTopFindingPresentationHonestyCopy.FormatSelectedFindingPlainLine(deltas)
            .Should()
            .Be("Selected finding: Subnet drift (severity 'O''Brien').");
    }
}
