using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Roi;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
public sealed class ExecutiveOrphanCandidateKpiCalculatorTests
{
    [Fact]
    public void BuildFromLatestDetails_counts_structured_orphan_markers()
    {
        ArchitectureRunDetail detail = CommittedDetail(
            runId: "run-structured",
            findings:
            [
                StructuredOrphanFinding("orph-1", 120m),
                NonOrphanCostFinding(),
            ]);

        ExecutiveOrphanCandidateSummary summary =
            ExecutiveOrphanCandidateKpiCalculator.BuildFromLatestDetails([detail]);

        summary.CandidateCount.Should().Be(1);
        summary.AnnualSavingsUsd.Should().Be(120m);
        summary.EvidenceRunId.Should().Be("run-structured");
    }

    [Fact]
    public void BuildFromLatestDetails_uses_legacy_message_fallback()
    {
        ArchitectureRunDetail detail = CommittedDetail(
            runId: "run-legacy",
            findings:
            [
                new ArchitectureFinding
                {
                    FindingId = "legacy-1",
                    Category = "CostOptimization",
                    Message = "Public IP with no ipConfiguration.",
                    EstimatedUsdSavings = 50m,
                },
            ]);

        ExecutiveOrphanCandidateSummary summary =
            ExecutiveOrphanCandidateKpiCalculator.BuildFromLatestDetails([detail]);

        summary.CandidateCount.Should().Be(1);
        summary.AnnualSavingsUsd.Should().Be(50m);
    }

    [Fact]
    public void BuildFromLatestDetails_deduplicates_duplicate_finding_ids()
    {
        ArchitectureFinding duplicate = StructuredOrphanFinding("dup-1", 80m);
        ArchitectureRunDetail first = CommittedDetail("run-a", [duplicate]);
        ArchitectureRunDetail second = CommittedDetail("run-b", [duplicate, duplicate]);

        ExecutiveOrphanCandidateSummary summary =
            ExecutiveOrphanCandidateKpiCalculator.BuildFromLatestDetails([second, first]);

        summary.CandidateCount.Should().Be(1);
        summary.AnnualSavingsUsd.Should().Be(80m);
        summary.EvidenceRunId.Should().Be("run-b");
    }

    private static ArchitectureFinding StructuredOrphanFinding(string findingId, decimal savings) =>
        new()
        {
            FindingId = findingId,
            Category = "CostOptimization",
            Message = "Orphaned resource: Microsoft.Compute/disks",
            EstimatedUsdSavings = savings,
            EvidenceRefs =
            [
                "finding-type:OrphanedAzureResource",
                "engine:orphaned-azure-resource",
            ],
        };

    private static ArchitectureFinding NonOrphanCostFinding() =>
        new()
        {
            FindingId = "cost-1",
            Category = "CostOptimization",
            Message = "Reserved instance coverage gap",
            EstimatedUsdSavings = 999m,
        };

    private static ArchitectureRunDetail CommittedDetail(string runId, IReadOnlyList<ArchitectureFinding> findings)
    {
        return new ArchitectureRunDetail
        {
            Run = new ArchitectureRun
            {
                RunId = runId,
                CompletedUtc = DateTime.UtcNow,
            },
            Manifest = new GoldenManifest
            {
                Metadata = new ManifestMetadata { CreatedUtc = DateTime.UtcNow },
            },
            Results =
            [
                new AgentResult
                {
                    RunId = runId,
                    TaskId = "task-1",
                    AgentType = AgentType.Cost,
                    Findings = findings.ToList(),
                },
            ],
        };
    }
}
