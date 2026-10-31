using System.Text;

using ArchLucid.Application.Pilots;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Persistence.DecisionTraces;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class BuyerProofPackEvidenceChainMarkdownTests
{
    [Fact]
    public void Evidence_chain_section_when_manifest_version_contains_pipe_escapes_table_cell()
    {
        StringBuilder sb = new();
        FirstValueReportTraceSectionFormatter.AppendEvidenceChainSection(
            sb,
            new PilotRunDeltas
            {
                TopFindingId = "f-1",
                TopFindingTitle = "Gap",
                TopFindingSeverity = "Error",
                TopFindingEvidenceChain = new FindingEvidenceChainResponse
                {
                    ManifestVersion = "v1|draft",
                },
            });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Manifest version |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| Manifest version | `v1\\|draft` |");
    }

    [Fact]
    public void Evidence_chain_section_when_manifest_version_contains_backtick_preserves_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportTraceSectionFormatter.AppendEvidenceChainSection(
            sb,
            new PilotRunDeltas
            {
                TopFindingId = "f-1",
                TopFindingTitle = "Gap",
                TopFindingSeverity = "Error",
                TopFindingEvidenceChain = new FindingEvidenceChainResponse
                {
                    ManifestVersion = "v1`draft",
                },
            });

        string row = sb.ToString()
            .Split('\n')
            .Single(line => line.Contains("| Manifest version |", StringComparison.Ordinal))
            .TrimEnd();

        row.Should().Be("| Manifest version | ``v1`draft`` |");
    }

    [Fact]
    public void Decision_trace_section_when_event_description_contains_pipe_preserves_inline_code()
    {
        StringBuilder sb = new();
        FirstValueReportTraceSectionFormatter.AppendDecisionTraceSection(
            sb,
            new ArchitectureRunDetail
            {
                Run = new ArchitectureRun { RunId = "run-1" },
                DecisionTraces =
                [
                    new RunEventTraceDto
                    {
                        RunEvent = new RunEventTracePayload
                        {
                            EventType = "Commit",
                            EventDescription = "phase|complete",
                        },
                    },
                ],
            },
            "run-1",
            "https://app.example");

        sb.ToString().Should().Contain("`phase\\|complete`");
    }
}
