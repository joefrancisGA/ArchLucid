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
            rightFindings)!;

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

        CompareQualityDeltaCounts counts = CompareQualityDeltaCalculator.Build(empty, findings, empty, findings)!;

        counts.HighSeverityBefore.Should().Be(0);
        counts.HighSeverityAfter.Should().Be(0);
    }

    [Fact]
    public void Build_returns_null_when_after_model_is_missing_instead_of_fabricating_improvement()
    {
        ArchitectureKnowledgeModel left = new()
        {
            ModelId = "m1",
            TenantId = "tenant",
            RunId = "run-left",
            Elements =
            [
                new()
                {
                    ElementId = "req-1",
                    Kind = ArchitectureElementKind.FunctionalRequirement,
                    Name = "Req 1",
                },
                new()
                {
                    ElementId = "req-2",
                    Kind = ArchitectureElementKind.FunctionalRequirement,
                    Name = "Req 2",
                },
                new()
                {
                    ElementId = "req-3",
                    Kind = ArchitectureElementKind.FunctionalRequirement,
                    Name = "Req 3",
                },
            ],
        };

        CompareQualityDeltaCounts? counts = CompareQualityDeltaCalculator.Build(left, [], null, []);

        counts.Should().BeNull();
    }

    [Fact]
    public void Build_returns_null_when_before_model_is_missing()
    {
        ArchitectureKnowledgeModel right = new()
        {
            ModelId = "m2",
            TenantId = "tenant",
            RunId = "run-right",
        };

        CompareQualityDeltaCounts? counts = CompareQualityDeltaCalculator.Build(null, [], right, []);

        counts.Should().BeNull();
    }
}
