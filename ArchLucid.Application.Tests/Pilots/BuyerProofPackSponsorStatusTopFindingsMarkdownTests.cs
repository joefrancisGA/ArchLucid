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
public sealed class BuyerProofPackSponsorStatusTopFindingsMarkdownTests
{
    [Fact]
    public void Sponsor_status_top_findings_row_when_message_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        ArchitectureRunDetail detail = new()
        {
            Results =
            [
                new AgentResult
                {
                    Findings =
                    [
                        new ArchitectureFinding
                        {
                            FindingId = "f-1",
                            Message = "Gap`title",
                            Severity = FindingSeverity.Error,
                        },
                    ],
                },
            ],
        };

        AppendMinimalSection(sb, detail);

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Top findings |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("Error: ``Gap`title``");
    }

    [Fact]
    public void Sponsor_status_top_findings_row_when_message_contains_newline_collapses_table_cell()
    {
        StringBuilder sb = new();
        ArchitectureRunDetail detail = new()
        {
            Results =
            [
                new AgentResult
                {
                    Findings =
                    [
                        new ArchitectureFinding
                        {
                            FindingId = "f-1",
                            Message = "Gap\n-evil",
                            Severity = FindingSeverity.Error,
                        },
                    ],
                },
            ],
        };

        AppendMinimalSection(sb, detail);

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Top findings |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Contain("`Gap -evil`");
        row.Should().NotContain("\n-evil");
    }

    private static void AppendMinimalSection(StringBuilder sb, ArchitectureRunDetail detail) =>
        FirstValueReportSponsorStatusSectionFormatter.AppendMarkdownSection(
            sb,
            detail,
            SponsorSafeProofDisposition.Sendable,
            new ProofPackageCompletenessResponse
            {
                AgentOutputPilotStrictEvidenceSatisfied = true,
                AuditRowCountResolved = true,
                LlmCallCountResolved = true,
            },
            new PilotRunDeltas(),
            new ArchitectureRun { Status = ArchitectureRunStatus.Committed },
            new SponsorRoiClaimDispositionResult(
                SponsorRoiClaimDisposition.Pass,
                PilotRoiEvidenceConfidence.Strong,
                "",
                true,
                "Pass",
                "Pass narrative"));
}
