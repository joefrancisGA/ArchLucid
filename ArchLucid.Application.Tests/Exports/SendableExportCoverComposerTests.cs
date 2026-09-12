using System.Text;

using ArchLucid.Application.Exports;
using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
public sealed class SendableExportCoverComposerTests
{
    [Fact]
    public void AppendMarkdownSection_includes_sendable_cover_heading_and_policy_pack()
    {
        StringBuilder sb = new();
        CareerExportCoverageHonestyInput input = CreateInput();

        SendableExportCoverComposer.AppendMarkdownSection(sb, input);

        string markdown = sb.ToString();

        markdown.Should().Contain("## Sendable export cover");
        markdown.Should().Contain("Policy pack: azure-waf @ 2024.1");
        markdown.Should().Contain("Execution mode: Simulator");
        markdown.Should().Contain(SendableExportCoverComposer.PolicyPackInfluenceHonestyLine);
    }

    [Fact]
    public void RenderPlainTextLines_matches_consulting_docx_cover_presenter()
    {
        CareerExportCoverageHonestyInput input = CreateInput();

        IReadOnlyList<string> lines = SendableExportCoverComposer.RenderPlainTextLines(input);

        lines.Should().Contain("Policy pack: azure-waf @ 2024.1");
        lines.Should().ContainSingle(line => line.StartsWith("Gate outcome:", StringComparison.Ordinal));
        lines.Should().Contain("Execution mode: Simulator");
        lines.Should().Contain($"Policy influence: {SendableExportCoverComposer.PolicyPackInfluenceHonestyLine}");
    }

    private static CareerExportCoverageHonestyInput CreateInput() =>
        new(
            new SponsorReviewCoverageHonestyContext(
                RunId: "run-1",
                Verdict: new FeasibilityVerdict
                {
                    Kind = FeasibilityVerdictKind.SoftInfeasible,
                    Summary = "Sample gate summary",
                },
                AnalysisStagesComplete: true,
                ActorNodeCount: 1),
            EnginesSucceeded: 4,
            WorkingDesk: true,
            ClassificationCounts: null,
            CatalogAdvisoryEngineFailureCount: 0,
            PreCommitGateEnabled: true,
            StructuralExecutionMode: StructuralExecutionMode.Simulator,
            IsSampleRun: false,
            RuleSetId: "azure-waf",
            RuleSetVersion: "2024.1");
}
