using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackSendableExportCoverPlainTextTests
{
    [Fact]
    public void RenderPlainTextLines_when_policy_pack_id_contains_pipe_quotes_id()
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
            RuleSetId: "azure|waf",
            RuleSetVersion: "2024.1");

        IReadOnlyList<string> lines = SendableExportCoverComposer.RenderPlainTextLines(input);

        lines.Should().Contain("Policy pack: 'azure|waf' @ 2024.1");
    }
}
