using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackSponsorReviewCoverageHonestyMarkdownTests
{
    [Fact]
    public void Coverage_honesty_blockquote_when_run_id_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        SponsorReviewCoverageHonestyMarkdownFormatter.AppendMarkdownSection(
            sb,
            new SponsorReviewCoverageHonestyContext(
                RunId: "run`kpi",
                Verdict: null,
                AnalysisStagesComplete: true,
                ActorNodeCount: 0));

        sb.ToString().Should().Contain("``run`kpi``");
    }
}
