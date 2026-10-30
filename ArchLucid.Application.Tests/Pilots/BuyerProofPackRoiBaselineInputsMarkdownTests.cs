using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackRoiBaselineInputsMarkdownTests
{
    [Fact]
    public void Roi_baseline_section_when_fallback_copy_contains_newline_collapses_blockquote()
    {
        StringBuilder sb = new();
        PilotRoiBaselineInputsMarkdownFormatter.AppendMarkdownSection(
            sb,
            new PilotRoiBaselineInputsStatusResponse
            {
                ProjectedDollarClaimsSponsorSafe = false,
                SponsorSafeFallbackCopy = "Do not lead with savings.\n## Forged heading",
            });

        string md = sb.ToString();
        md.Should().Contain("> Do not lead with savings. ## Forged heading");
        md.Should().NotContain("\n> ## Forged heading");
    }
}
