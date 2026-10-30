using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class SponsorRoiNarrativeGateMarkdownFormatterTests
{
    [Fact]
    public void AppendMarkdownSection_when_disposition_lead_line_contains_pipe_escapes_copy()
    {
        StringBuilder sb = new();
        SponsorRoiNarrativeGateMarkdownFormatter.AppendMarkdownSection(
            sb,
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Hold,
                PilotRoiEvidenceConfidence.Low,
                "Basis|class",
                false,
                "Hold|review",
                "Narrative|block"));

        string markdown = sb.ToString();

        markdown.Should().Contain("**Disposition:** Hold\\|review");
        markdown.Should().Contain("**Basis class:** Basis\\|class");
        markdown.Should().Contain("> Narrative\\|block");
    }
}
