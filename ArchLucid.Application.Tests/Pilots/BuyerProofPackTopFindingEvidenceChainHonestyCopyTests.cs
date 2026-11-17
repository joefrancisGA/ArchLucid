using ArchLucid.Application.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackTopFindingEvidenceChainHonestyCopyTests
{
    [Fact]
    public void Pdf_unavailable_line_wraps_shared_prose_for_sponsor_one_pager()
    {
        string line = PilotTopFindingEvidenceChainHonestyCopy.FormatPdfUnavailableItalicLine();

        line.Should().Be($"({PilotTopFindingEvidenceChainHonestyCopy.UnavailableProse})");
        line.Should().NotBe("(Evidence chain unavailable — finding not present in persisted FindingsSnapshot.)");
    }

    [Fact]
    public void Pdf_no_findings_skip_line_wraps_shared_prose()
    {
        PilotTopFindingEvidenceChainHonestyCopy.FormatPdfNoFindingsSkipItalicLine()
            .Should()
            .Be($"({PilotTopFindingEvidenceChainHonestyCopy.NoFindingsSkipPlain})");
    }
}
