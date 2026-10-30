using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackCareerExportCoverageHonestyPlainTextTests
{
    [Fact]
    public void RenderPlainTextLines_when_review_run_id_contains_pipe_uses_sponsor_plain_text_quoting()
    {
        CareerExportCoverageHonestyInput input = new(
            new SponsorReviewCoverageHonestyContext(
                RunId: "run|kpi",
                Verdict: new FeasibilityVerdict { Kind = FeasibilityVerdictKind.Feasible },
                AnalysisStagesComplete: true,
                ActorNodeCount: 0),
            EnginesSucceeded: 4,
            WorkingDesk: false,
            ClassificationCounts: null);

        IReadOnlyList<string> lines = CareerExportCoverageHonestyComposer.RenderPlainTextLines(input);

        lines.Should().Contain(
            "Sponsor KPIs for review 'run|kpi' are not an all-clear bill of health. Open the architecture package in ArchLucid before steering or procurement use.");
    }
}
