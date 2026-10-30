using System.Text;

using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackSendableExportCoverMarkdownTests
{
    [Fact]
    public void Sendable_cover_when_review_record_status_contains_pipe_wraps_inline_code()
    {
        CareerExportCoverageHonestyInput input = new(
            new SponsorReviewCoverageHonestyContext(
                RunId: "run-1",
                Verdict: new FeasibilityVerdict { Kind = FeasibilityVerdictKind.Feasible },
                AnalysisStagesComplete: true,
                ActorNodeCount: 0),
            EnginesSucceeded: null,
            WorkingDesk: false,
            ClassificationCounts: null,
            ReviewRecordStatus: "Committed|Pending");

        StringBuilder sb = new();
        SendableExportCoverComposer.AppendMarkdownSection(sb, input);

        sb.ToString().Should().Contain("**Review record status:** `Committed\\|Pending`");
    }
}
