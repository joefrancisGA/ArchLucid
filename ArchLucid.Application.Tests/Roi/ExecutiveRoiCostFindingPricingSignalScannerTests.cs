using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ExecutiveRoiCostFindingPricingSignalScannerTests
{
    [Fact]
    public void Scan_detects_uploaded_extractor_and_heuristic_signals()
    {
        ArchitectureRunDetail detail = BuildDetail(
        [
            new ArchitectureFinding
            {
                Category = "Cost",
                Message = "Orphan VM",
                EvidenceRefs = ["AzureExtractorZIP packageId=abc; collectionTimestampUtc=2026-05-01T00:00:00Z"],
            },
            new ArchitectureFinding
            {
                Category = "Cost",
                Message = "Unknown SKU",
                EvidenceRefs = ["[Fallback Estimate] monthly=120"],
            },
        ]);

        ExecutiveRoiCostFindingPricingSignalScanner.PricingSignals signals =
            ExecutiveRoiCostFindingPricingSignalScanner.Scan([detail]);

        signals.HasUploadedExtractorEvidence.Should().BeTrue();
        signals.HasHeuristicCostEvidence.Should().BeTrue();
    }

    [Fact]
    public void Scan_ignores_muted_and_non_cost_findings()
    {
        ArchitectureRunDetail detail = BuildDetail(
        [
            new ArchitectureFinding
            {
                Category = "Security",
                Message = "AzureExtractorZIP should not count",
                IsMuted = false,
            },
            new ArchitectureFinding
            {
                Category = "Cost",
                Message = "Muted",
                EvidenceRefs = ["Fallback Estimate"],
                IsMuted = true,
            },
        ]);

        ExecutiveRoiCostFindingPricingSignalScanner.PricingSignals signals =
            ExecutiveRoiCostFindingPricingSignalScanner.Scan([detail]);

        signals.HasUploadedExtractorEvidence.Should().BeFalse();
        signals.HasHeuristicCostEvidence.Should().BeFalse();
    }

    private static ArchitectureRunDetail BuildDetail(IReadOnlyList<ArchitectureFinding> findings)
    {
        string runId = Guid.NewGuid().ToString("N");

        return new ArchitectureRunDetail
        {
            Run = new ArchitectureRun
            {
                RunId = runId,
                RequestId = "req",
                Status = ArchitectureRunStatus.Committed,
            },
            Results =
            [
                new AgentResult
                {
                    TaskId = "t1",
                    RunId = runId,
                    AgentType = AgentType.Cost,
                    Findings = findings.ToList(),
                },
            ],
        };
    }
}
