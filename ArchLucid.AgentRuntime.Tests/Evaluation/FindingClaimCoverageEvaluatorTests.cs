using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.AgentRuntime.Tests.Evaluation;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingClaimCoverageEvaluatorTests
{
    private readonly FindingClaimCoverageEvaluator _sut = new(NullLogger<FindingClaimCoverageEvaluator>.Instance);

    [Fact]
    public void Evaluate_EmptyFindings_ReturnsPerfectCoverage()
    {
        FindingClaimCoverageReport report = _sut.Evaluate([]);

        report.TotalFindingCount.Should().Be(0);
        report.CoverageRatio.Should().Be(1.0);
        report.UnsupportedFindingIds.Should().BeEmpty();
    }

    [Fact]
    public void Evaluate_AllFindingsHaveEvidenceRefs_ReturnsCoverageOne()
    {
        List<ArchitectureFinding> findings =
        [
            new() { FindingId = "f1", Category = "Topology", Message = "m1", EvidenceRefs = ["ref-a"] },
            new() { FindingId = "f2", Category = "Cost", Message = "m2", EvidenceRefs = ["ref-b", "ref-c"] },
        ];

        FindingClaimCoverageReport report = _sut.Evaluate(findings);

        report.TotalFindingCount.Should().Be(2);
        report.SupportedFindingCount.Should().Be(2);
        report.HeuristicFindingCount.Should().Be(0);
        report.CoverageRatio.Should().Be(1.0);
        report.UnsupportedFindingIds.Should().BeEmpty();
    }

    [Fact]
    public void Evaluate_FindingWithNoRefsAndNoLabel_IsUnsupported()
    {
        List<ArchitectureFinding> findings =
        [
            new() { FindingId = "f1", Category = "Topology", Message = "m1", EvidenceRefs = [] },
        ];

        FindingClaimCoverageReport report = _sut.Evaluate(findings);

        report.TotalFindingCount.Should().Be(1);
        report.SupportedFindingCount.Should().Be(0);
        report.HeuristicFindingCount.Should().Be(0);
        report.CoverageRatio.Should().Be(0.0);
        report.UnsupportedFindingIds.Should().ContainSingle().Which.Should().Be("f1");
    }

    [Fact]
    public void Evaluate_EstimateLabeledFinding_CountsAsHeuristic()
    {
        List<ArchitectureFinding> findings =
        [
            new()
            {
                FindingId = "f-heuristic",
                Category = "Cost",
                Message = "Estimated savings from rightsizing",
                EvidenceRefs = [],
                ConfidenceLevel = FindingConfidenceLevel.Low
            },
        ];

        FindingClaimCoverageReport report = _sut.Evaluate(findings);

        report.HeuristicFindingCount.Should().Be(1);
        report.CoverageRatio.Should().Be(1.0, "a heuristic-labeled finding is acceptable");
        report.UnsupportedFindingIds.Should().BeEmpty();
    }

    [Fact]
    public void Evaluate_MixedFindings_ComputesCoverageCorrectly()
    {
        List<ArchitectureFinding> findings =
        [
            new() { FindingId = "f-supported", EvidenceRefs = ["r1"] },
            new() { FindingId = "f-heuristic", EvidenceRefs = [], ConfidenceLevel = FindingConfidenceLevel.Low },
            new() { FindingId = "f-unsupported-1", EvidenceRefs = [] },
            new() { FindingId = "f-unsupported-2", EvidenceRefs = [] },
        ];

        FindingClaimCoverageReport report = _sut.Evaluate(findings);

        report.TotalFindingCount.Should().Be(4);
        report.SupportedFindingCount.Should().Be(1);
        report.HeuristicFindingCount.Should().Be(1);
        report.CoverageRatio.Should().BeApproximately(0.5, precision: 0.001);
        report.UnsupportedFindingIds.Should().HaveCount(2);
        report.UnsupportedFindingIds.Should().Contain("f-unsupported-1");
        report.UnsupportedFindingIds.Should().Contain("f-unsupported-2");
    }

    [Fact]
    public void Evaluate_HighConfidenceFindingWithNoRefs_IsUnsupported()
    {
        List<ArchitectureFinding> findings =
        [
            new()
            {
                FindingId = "f-high",
                EvidenceRefs = [],
                ConfidenceLevel = FindingConfidenceLevel.High
            },
        ];

        FindingClaimCoverageReport report = _sut.Evaluate(findings);

        report.UnsupportedFindingIds.Should()
            .ContainSingle(because: "high confidence without refs is still unsupported");
    }
}
