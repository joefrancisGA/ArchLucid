using ArchiForge.Decisioning.Alerts;
using ArchiForge.Decisioning.Alerts.Composite;
using ArchiForge.Decisioning.Alerts.Simulation;
using ArchiForge.Decisioning.Alerts.Tuning;

using FluentAssertions;

using Moq;

namespace ArchiForge.Decisioning.Tests;

/// <summary>
/// Unit tests for <see cref="ThresholdRecommendationService"/>:
/// no-candidates path, Simple rule sweep, Composite rule sweep, and unknown RuleKind.
/// </summary>
[Trait("Category", "Unit")]
public sealed class ThresholdRecommendationServiceTests
{
    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    private static (ThresholdRecommendationService Sut,
        Mock<IRuleSimulationService> Simulation,
        Mock<IAlertNoiseScorer> Scorer)
        Build()
    {
        Mock<IRuleSimulationService> simulation = new();
        Mock<IAlertNoiseScorer> scorer = new();

        ThresholdRecommendationService sut = new(simulation.Object, scorer.Object);
        return (sut, simulation, scorer);
    }

    private static RuleSimulationResult SimResult(int matched = 0, int wouldCreate = 0) => new()
    {
        RuleKind = RuleKindConstants.Simple,
        EvaluatedRunCount = 5,
        MatchedCount = matched,
        WouldCreateCount = wouldCreate
    };

    private static NoiseScoreBreakdown ScoreWith(double finalScore) => new()
    {
        CoverageScore = finalScore,
        FinalScore = finalScore
    };

    // ──────────────────────────────────────────────────────────────────────────
    // No candidates (empty threshold list)
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task RecommendAsync_NoCandidates_RecommendedCandidateIsNull()
    {
        (ThresholdRecommendationService sut, _, _) = Build();

        ThresholdRecommendationRequest request = new()
        {
            RuleKind = RuleKindConstants.Simple,
            TunedMetricType = AlertMetricType.CriticalRecommendationCount,
            BaseSimpleRule = new AlertRule { RuleType = AlertRuleType.CriticalRecommendationCount },
            CandidateThresholds = []   // empty — nothing to evaluate
        };

        ThresholdRecommendationResult result = await sut.RecommendAsync(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), request, CancellationToken.None);

        result.RecommendedCandidate.Should().BeNull();
        result.Candidates.Should().BeEmpty();
        result.SummaryNotes.Should().Contain(n => n.Contains("No candidates"));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Simple rule: simulation called once per threshold; best score wins
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task RecommendAsync_SimpleRule_SimulationCalledPerThreshold()
    {
        (ThresholdRecommendationService sut, Mock<IRuleSimulationService> sim, Mock<IAlertNoiseScorer> scorer) = Build();

        sim.Setup(x => x.SimulateAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<RuleSimulationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(SimResult(matched: 2, wouldCreate: 1));

        scorer.Setup(x => x.Score(It.IsAny<RuleSimulationResult>(), It.IsAny<int>(), It.IsAny<int>()))
            .Returns(ScoreWith(20));

        ThresholdRecommendationRequest request = new()
        {
            RuleKind = RuleKindConstants.Simple,
            TunedMetricType = AlertMetricType.CriticalRecommendationCount,
            BaseSimpleRule = new AlertRule { RuleType = AlertRuleType.CriticalRecommendationCount },
            CandidateThresholds = [1m, 2m, 3m]
        };

        ThresholdRecommendationResult result = await sut.RecommendAsync(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), request, CancellationToken.None);

        sim.Verify(
            x => x.SimulateAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<RuleSimulationRequest>(), It.IsAny<CancellationToken>()),
            Times.Exactly(3));

        result.Candidates.Should().HaveCount(3);
        result.RecommendedCandidate.Should().NotBeNull();
    }

    [Fact]
    public async Task RecommendAsync_SimpleRule_HighestScoreRecommended()
    {
        (ThresholdRecommendationService sut, Mock<IRuleSimulationService> sim, Mock<IAlertNoiseScorer> scorer) = Build();

        // Return same simulation result each time; scorer returns different scores per call order
        int callCount = 0;
        sim.Setup(x => x.SimulateAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<RuleSimulationRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(SimResult(matched: 1, wouldCreate: 1));

        scorer.Setup(x => x.Score(It.IsAny<RuleSimulationResult>(), It.IsAny<int>(), It.IsAny<int>()))
            .Returns(() =>
            {
                callCount++;
                return ScoreWith(callCount == 2 ? 100 : 10); // second threshold scores highest
            });

        ThresholdRecommendationRequest request = new()
        {
            RuleKind = RuleKindConstants.Simple,
            TunedMetricType = AlertMetricType.CriticalRecommendationCount,
            BaseSimpleRule = new AlertRule { RuleType = AlertRuleType.CriticalRecommendationCount },
            CandidateThresholds = [1m, 2m, 3m]
        };

        ThresholdRecommendationResult result = await sut.RecommendAsync(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), request, CancellationToken.None);

        // thresholds sorted ascending: [1, 2, 3] → second call gets threshold 2
        result.RecommendedCandidate!.Candidate.ThresholdValue.Should().Be(2m);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Composite rule path
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task RecommendAsync_CompositeRule_SimulationCalledPerThreshold()
    {
        (ThresholdRecommendationService sut, Mock<IRuleSimulationService> sim, Mock<IAlertNoiseScorer> scorer) = Build();

        sim.Setup(x => x.SimulateAsync(
                It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.Is<RuleSimulationRequest>(r => r.RuleKind == RuleKindConstants.Composite),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(SimResult());

        scorer.Setup(x => x.Score(It.IsAny<RuleSimulationResult>(), It.IsAny<int>(), It.IsAny<int>()))
            .Returns(ScoreWith(5));

        CompositeAlertRule baseRule = new()
        {
            Name = "test",
            Conditions =
            [
                new AlertRuleCondition
                {
                    MetricType = AlertMetricType.CriticalRecommendationCount,
                    Operator = AlertConditionOperator.GreaterThanOrEqual,
                    ThresholdValue = 1
                }
            ]
        };

        ThresholdRecommendationRequest request = new()
        {
            RuleKind = RuleKindConstants.Composite,
            TunedMetricType = AlertMetricType.CriticalRecommendationCount,
            BaseCompositeRule = baseRule,
            CandidateThresholds = [2m, 4m]
        };

        ThresholdRecommendationResult result = await sut.RecommendAsync(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), request, CancellationToken.None);

        sim.Verify(
            x => x.SimulateAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.Is<RuleSimulationRequest>(r => r.RuleKind == RuleKindConstants.Composite),
                It.IsAny<CancellationToken>()),
            Times.Exactly(2));

        result.Candidates.Should().HaveCount(2);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Unknown RuleKind → all thresholds skipped
    // ──────────────────────────────────────────────────────────────────────────

    [Fact]
    public async Task RecommendAsync_UnknownRuleKind_ProducesNoCandidates()
    {
        (ThresholdRecommendationService sut, Mock<IRuleSimulationService> sim, _) = Build();

        ThresholdRecommendationRequest request = new()
        {
            RuleKind = "Fancy",
            TunedMetricType = AlertMetricType.CriticalRecommendationCount,
            CandidateThresholds = [1m, 2m]
        };

        ThresholdRecommendationResult result = await sut.RecommendAsync(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), request, CancellationToken.None);

        sim.Verify(
            x => x.SimulateAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
                It.IsAny<RuleSimulationRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);

        result.Candidates.Should().BeEmpty();
        result.RecommendedCandidate.Should().BeNull();
    }
}
