using ArchLucid.Application.Analysis;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Analysis;

[Trait("Category", "Unit")]
public sealed class CompareQualityDeltaCalculatorTests
{
    [Fact]
    public void Build_counts_high_severity_findings_from_run_findings()
    {
        ArchitectureKnowledgeModel empty = new()
        {
            ModelId = "m1",
            TenantId = "tenant",
            RunId = "run-left",
        };

        List<ArchitectureFinding> leftFindings = [
            new() { FindingId = "f1", Severity = FindingSeverity.Critical, Message = "critical gap" },
            new() { FindingId = "f2", Severity = FindingSeverity.Warning, Message = "warning only" },
        ];

        List<ArchitectureFinding> rightFindings = [
            new() { FindingId = "f3", Severity = FindingSeverity.Error, Message = "high gap" },
        ];

        CompareQualityDeltaCounts counts = CompareQualityDeltaCalculator.Build(
            empty,
            leftFindings,
            empty,
            rightFindings);

        counts.HighSeverityBefore.Should().Be(1);
        counts.HighSeverityAfter.Should().Be(1);
        counts.UnsupportedAssumptionsBefore.Should().Be(0);
        counts.UnsupportedAssumptionsAfter.Should().Be(0);
    }

    [Fact]
    public void Build_ignores_muted_findings_for_high_severity()
    {
        ArchitectureKnowledgeModel empty = new()
        {
            ModelId = "m1",
            TenantId = "tenant",
            RunId = "run-left",
        };

        List<ArchitectureFinding> findings = [
            new()
            {
                FindingId = "f1",
                Severity = FindingSeverity.Critical,
                Message = "muted critical",
                IsMuted = true,
            },
        ];

        CompareQualityDeltaCounts counts = CompareQualityDeltaCalculator.Build(empty, findings, empty, findings);

        counts.HighSeverityBefore.Should().Be(0);
        counts.HighSeverityAfter.Should().Be(0);
    }
}
