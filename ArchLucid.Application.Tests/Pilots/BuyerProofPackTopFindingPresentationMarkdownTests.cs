using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackTopFindingPresentationMarkdownTests
{
    [Fact]
    public void Selected_finding_line_when_title_contains_backtick_preserves_inline_code()
    {
        PilotRunDeltas deltas = new()
        {
            TopFindingTitle = "Run `kubectl` drain",
            TopFindingSeverity = "Error",
        };

        string line = PilotTopFindingPresentationHonestyCopy.FormatSelectedFindingMarkdownLine(deltas);

        line.Should().Be("Selected finding: ``Run `kubectl` drain`` (severity `Error`).");
    }

    [Fact]
    public void Evidence_chain_excerpt_when_title_contains_backtick_preserves_selected_finding_line()
    {
        System.Text.StringBuilder sb = new();
        FirstValueReportTraceSectionFormatter.AppendEvidenceChainSection(
            sb,
            new PilotRunDeltas
            {
                TopFindingId = "f-1",
                TopFindingTitle = "Use `helm` upgrade",
                TopFindingSeverity = "Warning",
                TopFindingEvidenceChain = null,
            });

        sb.ToString().Should().Contain("``Use `helm` upgrade``");
    }
}
