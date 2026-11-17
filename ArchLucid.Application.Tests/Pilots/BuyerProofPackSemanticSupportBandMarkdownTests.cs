using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackSemanticSupportBandMarkdownTests
{
    [Fact]
    public void Semantic_support_section_when_unsupported_finding_message_contains_newline_does_not_emit_extra_bullet()
    {
        ArchitectureRunDetail detail = BuildDetail(
            CreateUnsupportedFinding("f-1", "Rotate keys\n-evil"));

        StringBuilder sb = new();
        FirstValueReportSemanticSupportBandSectionFormatter.AppendMarkdownSection(sb, detail, new PilotRunDeltas());

        string markdown = sb.ToString();
        markdown.Should().Contain("**Unsupported decision-grade findings:**");
        markdown.Should().Contain("`f-1: Rotate keys -evil`");
        markdown.Split('\n').Should().NotContain("- evil");
    }

    [Fact]
    public void Semantic_support_sponsor_status_cell_when_unsupported_label_contains_backtick_preserves_inline_code()
    {
        ArchitectureRunDetail detail = BuildDetail(
            CreateUnsupportedFinding("f-1", "Gap`title"));

        string cell = FirstValueReportSemanticSupportBandSectionFormatter.FormatSponsorStatusTableCell(
            detail,
            new PilotRunDeltas());

        cell.Should().Contain("``f-1: Gap`title``");
    }

    private static ArchitectureFinding CreateUnsupportedFinding(string findingId, string message) =>
        new()
        {
            FindingId = findingId,
            Message = message,
            Severity = FindingSeverity.Error,
            Classification = FindingClassification.DecisionGradeFinding,
            SemanticSupportBand = FindingSemanticSupportBand.Unsupported,
        };

    private static ArchitectureRunDetail BuildDetail(ArchitectureFinding finding) =>
        new()
        {
            Run = new ArchitectureRun { RunId = "run-1", Status = ArchitectureRunStatus.Committed },
            Results =
            [
                new AgentResult
                {
                    TaskId = "t1",
                    RunId = "run-1",
                    Findings = [finding],
                },
            ],
        };
}
