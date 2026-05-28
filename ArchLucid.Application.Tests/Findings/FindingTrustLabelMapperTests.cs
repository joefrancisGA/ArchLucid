using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FindingTrustLabelMapperTests
{
    private readonly FindingTrustLabelMapper _sut = new();

    private static AgentTrustContext LiveContext => new(IsSimulatorDerived: false, IsDegraded: false);
    private static AgentTrustContext SimulatorContext => new(IsSimulatorDerived: true, IsDegraded: false);
    private static AgentTrustContext DegradedContext => new(IsSimulatorDerived: false, IsDegraded: true);
    private static AgentTrustContext RealModelContext => new(IsSimulatorDerived: false, IsDegraded: false, IsRealModel: true);

    [Fact]
    public void Map_DegradedContext_ReturnsDegraded()
    {
        ArchitectureFinding finding = new() { EvidenceRefs = ["ref-1"], EvaluationConfidenceScore = 90 };

        FindingTrustSummary summary = _sut.Map(finding, DegradedContext);

        summary.Label.Should().Be(FindingTrustLabel.Degraded);
    }

    [Fact]
    public void Map_SimulatorContext_ReturnsSimulatorDerived()
    {
        ArchitectureFinding finding = new() { EvidenceRefs = ["ref-1"], EvaluationConfidenceScore = 90 };

        FindingTrustSummary summary = _sut.Map(finding, SimulatorContext);

        summary.Label.Should().Be(FindingTrustLabel.SimulatorDerived);
    }

    [Fact]
    public void Map_EvidenceRefsAndHighScore_ReturnsEvidenceBacked()
    {
        ArchitectureFinding finding = new()
        {
            EvidenceRefs = ["ref-a", "ref-b"],
            EvaluationConfidenceScore = 80,
            ConfidenceLevel = FindingConfidenceLevel.High
        };

        FindingTrustSummary summary = _sut.Map(finding, LiveContext);

        summary.Label.Should().Be(FindingTrustLabel.EvidenceBacked);
    }

    [Fact]
    public void Map_EvidenceRefsAndHighScore_RealModelContext_ReturnsRealModel()
    {
        ArchitectureFinding finding = new()
        {
            EvidenceRefs = ["ref-a"],
            EvaluationConfidenceScore = 85,
            ConfidenceLevel = FindingConfidenceLevel.High
        };

        FindingTrustSummary summary = _sut.Map(finding, RealModelContext);

        summary.Label.Should().Be(FindingTrustLabel.RealModel);
    }

    [Fact]
    public void Map_EvidenceRefsAndLowScore_ReturnsEstimated()
    {
        ArchitectureFinding finding = new()
        {
            EvidenceRefs = ["ref-a"],
            EvaluationConfidenceScore = 40,
            ConfidenceLevel = FindingConfidenceLevel.Low
        };

        FindingTrustSummary summary = _sut.Map(finding, LiveContext);

        summary.Label.Should().Be(FindingTrustLabel.Estimated);
    }

    [Fact]
    public void Map_NoRefsAndLowConfidence_ReturnsHeuristic()
    {
        ArchitectureFinding finding = new()
        {
            EvidenceRefs = [],
            ConfidenceLevel = FindingConfidenceLevel.Low
        };

        FindingTrustSummary summary = _sut.Map(finding, LiveContext);

        summary.Label.Should().Be(FindingTrustLabel.Heuristic);
    }

    [Fact]
    public void Map_NoRefsAndHighConfidence_ReturnsMissingCitation()
    {
        ArchitectureFinding finding = new()
        {
            EvidenceRefs = [],
            ConfidenceLevel = FindingConfidenceLevel.High,
            EvaluationConfidenceScore = 90
        };

        FindingTrustSummary summary = _sut.Map(finding, LiveContext);

        summary.Label.Should().Be(FindingTrustLabel.MissingCitation);
    }

    [Fact]
    public void Map_NoRefsAndNullConfidenceLevel_ReturnsMissingCitation()
    {
        ArchitectureFinding finding = new()
        {
            EvidenceRefs = [],
            ConfidenceLevel = null
        };

        FindingTrustSummary summary = _sut.Map(finding, LiveContext);

        summary.Label.Should().Be(FindingTrustLabel.MissingCitation);
    }

    [Fact]
    public void Map_DegradedTakesPrecedenceOverSimulator()
    {
        ArchitectureFinding finding = new() { EvidenceRefs = ["r"] };
        AgentTrustContext bothFlaggedContext = new(IsSimulatorDerived: true, IsDegraded: true);

        FindingTrustSummary summary = _sut.Map(finding, bothFlaggedContext);

        summary.Label.Should().Be(FindingTrustLabel.Degraded, because: "degraded takes precedence");
    }

    [Fact]
    public void Map_SummaryAlwaysHasNonEmptyShortReason()
    {
        List<(ArchitectureFinding Finding, AgentTrustContext Context)> cases =
        [
            (new() { EvidenceRefs = ["r"], EvaluationConfidenceScore = 80 }, LiveContext),
            (new() { EvidenceRefs = [], ConfidenceLevel = FindingConfidenceLevel.Low }, LiveContext),
            (new() { EvidenceRefs = [] }, LiveContext),
            (new() { EvidenceRefs = ["r"] }, SimulatorContext),
            (new() { EvidenceRefs = ["r"] }, DegradedContext),
        ];

        foreach ((ArchitectureFinding finding, AgentTrustContext context) in cases)
        {
            FindingTrustSummary summary = _sut.Map(finding, context);
            summary.ShortReason.Should().NotBeNullOrWhiteSpace(because: $"label {summary.Label} must have a reason");
        }
    }
}
