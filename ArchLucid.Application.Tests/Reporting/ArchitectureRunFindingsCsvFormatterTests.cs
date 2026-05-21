using ArchLucid.Application.Reporting;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunFindingsCsvFormatterTests
{
    [Fact]
    public void BuildCsvContent_with_no_results_emits_header_only()
    {
        ArchitectureRunDetail detail = new();

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(detail);

        csv.Should().Be(ArchitectureRunFindingsCsvFormatter.HeaderLine + "\n");
        ArchitectureRunFindingsCsvFormatter.CountFindingsInDetail(detail).Should().Be(0);
    }

    [Fact]
    public void BuildCsvContent_flattens_findings_and_escapes_special_characters()
    {
        ArchitectureFinding finding = new()
        {
            FindingId = "f-1",
            SourceAgent = AgentType.Compliance,
            Severity = FindingSeverity.Warning,
            Category = "cat",
            Message = "Say \"hello\", line1\nline2",
            IsMuted = true,
            MuteReason = "noise",
            ConfidenceScore = 0.5
        };

        AgentResult result = new()
        {
            ResultId = "r-9",
            TaskId = "t-2",
            AgentType = AgentType.Compliance,
            Findings = [finding]
        };

        ArchitectureRunDetail detail = new() { Results = [result] };

        string csv = ArchitectureRunFindingsCsvFormatter.BuildCsvContent(detail);

        csv.Should().Contain("f-1,r-9,t-2,Compliance,Warning,cat,");
        csv.Should().Contain(",muted,noise,0.5");

        string escapedMessage = ExportFormatterService.EscapeCsvField(finding.Message);
        csv.Should().Contain(escapedMessage);

        ArchitectureRunFindingsCsvFormatter.CountFindingsInDetail(detail).Should().Be(1);
    }

    [Fact]
    public void FormatFindingStatus_maps_muted_and_active()
    {
        ArchitectureRunFindingsCsvFormatter.FormatFindingStatus(true).Should().Be("muted");
        ArchitectureRunFindingsCsvFormatter.FormatFindingStatus(false).Should().Be("active");
    }
}
