using ArchLucid.AgentRuntime.Evaluation;
using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Configuration;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentConfidenceCalibratorTests
{
    [Fact]
    public async Task CalibrateAsync_with_insufficient_samples_returns_raw_confidence()
    {
        Mock<IAgentConfidenceCalibrationSampleRepository> samples = new();
        samples
            .Setup(r => r.GetRecentByAgentTypeAsync(AgentType.Topology, 200, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        AgentConfidenceCalibrator sut = new(
            samples.Object,
            Options.Create(new AgentConfidenceCalibrationOptions { Enabled = true, MinimumSamplesForCalibration = 5 }));

        double calibrated = await sut.CalibrateAsync(AgentType.Topology, 0.42, CancellationToken.None);

        calibrated.Should().Be(0.42);
    }

    [Fact]
    public void BuildIsotonicKnots_enforces_monotonic_mapping()
    {
        List<AgentConfidenceCalibrationSampleRow> rows =
        [
            new() { RawConfidence = 0.2, SemanticScore = 0.9 },
            new() { RawConfidence = 0.5, SemanticScore = 0.4 },
            new() { RawConfidence = 0.8, SemanticScore = 0.85 }
        ];

        IReadOnlyList<AgentConfidenceCalibrator.CalibrationKnot> knots =
            AgentConfidenceCalibrator.BuildIsotonicKnots(rows);

        knots.Should().HaveCount(3);
        knots[0].CalibratedScore.Should().BeLessThanOrEqualTo(knots[1].CalibratedScore);
        knots[1].CalibratedScore.Should().BeLessThanOrEqualTo(knots[2].CalibratedScore);
    }

    [Fact]
    public void Evaluate_uses_calibrated_confidence_for_semantic_floor_when_present()
    {
        AgentOutputQualityGate sut = new(Options.Create(new AgentOutputQualityGateOptions
        {
            Enabled = true,
            SemanticRejectBelow = 0.6,
            StructuralRejectBelow = 0.0,
            SemanticWarnBelow = 0.0,
            StructuralWarnBelow = 0.0
        }));

        AgentOutputEvaluationScore structural = new()
        {
            TraceId = "t",
            AgentType = AgentType.Topology,
            StructuralCompletenessRatio = 0.9,
            IsJsonParseFailure = false
        };

        AgentOutputSemanticScore semantic = new()
        {
            TraceId = "t",
            AgentType = AgentType.Topology,
            OverallSemanticScore = 0.9
        };

        AgentOutputQualityGateOutcome without =
            sut.Evaluate(structural, semantic, calibratedConfidence: null);

        AgentOutputQualityGateOutcome withLowCalibrated =
            sut.Evaluate(structural, semantic, calibratedConfidence: 0.4);

        without.Should().Be(AgentOutputQualityGateOutcome.Accepted);
        withLowCalibrated.Should().Be(AgentOutputQualityGateOutcome.Rejected);
    }
}
