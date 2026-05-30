using ArchLucid.Application.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Agents;

[Trait("Suite", "Core")]
public sealed class AgentExecutionTraceRunLlmCostAggregatorTests
{
    [Fact]
    public void Compute_EmptyTraces_YieldsZeroTokensNullCostAndEmptyModel()
    {
        Mock<ILlmCostEstimator> estimator = new();

        AgentExecutionTraceRunLlmCostSummary summary =
            AgentExecutionTraceRunLlmCostAggregator.Compute([], estimator.Object);

        summary.PromptTokens.Should().Be(0);
        summary.CompletionTokens.Should().Be(0);
        summary.EstimatedCostUsd.Should().BeNull();
        summary.ModelLabel.Should().BeEmpty();

        estimator.Verify(
            e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>()),
            Times.Never);
    }

    [Fact]
    public void Compute_SimulatorZeroTokens_UsesFallbackModelLabelAndNullUsd()
    {
        Mock<ILlmCostEstimator> estimator = new();

        List<AgentExecutionTrace> traces =
        [
            new()
            {
                ModelDeploymentName = AgentExecutionTraceModelMetadata.SimulatorDeploymentName,
                InputTokenCount = null,
                OutputTokenCount = null,
            },
        ];

        AgentExecutionTraceRunLlmCostSummary summary =
            AgentExecutionTraceRunLlmCostAggregator.Compute(traces, estimator.Object);

        summary.PromptTokens.Should().Be(0);
        summary.CompletionTokens.Should().Be(0);
        summary.EstimatedCostUsd.Should().BeNull();
        summary.ModelLabel.Should().Be(AgentExecutionTraceModelMetadata.SimulatorDeploymentName);

        estimator.Verify(
            e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>()),
            Times.Never);
    }

    [Fact]
    public void Compute_WithTokens_SumsPerTraceEstimatesAndDeployments()
    {
        Mock<ILlmCostEstimator> estimator = new();
        estimator
            .Setup(e => e.EstimateUsd(100, 40, 0, "dep-a"))
            .Returns(1.0m);
        estimator
            .Setup(e => e.EstimateUsd(50, 10, 0, "dep-b"))
            .Returns(0.25m);

        List<AgentExecutionTrace> traces =
        [
            new()
            {
                ModelDeploymentName = "dep-b",
                InputTokenCount = 50,
                OutputTokenCount = 10,
            },
            new()
            {
                ModelDeploymentName = "dep-a",
                InputTokenCount = 100,
                OutputTokenCount = 40,
            },
        ];

        AgentExecutionTraceRunLlmCostSummary summary =
            AgentExecutionTraceRunLlmCostAggregator.Compute(traces, estimator.Object);

        summary.PromptTokens.Should().Be(150);
        summary.CompletionTokens.Should().Be(50);
        summary.EstimatedCostUsd.Should().Be(1.25m);
        summary.ModelLabel.Should().Be("dep-a, dep-b");
        summary.CostEstimationBasis.Should().Be(RunLlmCostEstimationBasis.EstimatedFromConfiguredRates);

        estimator.Verify(e => e.EstimateUsd(100, 40, 0, "dep-a"), Times.Once);
        estimator.Verify(e => e.EstimateUsd(50, 10, 0, "dep-b"), Times.Once);
    }

    [Fact]
    public void Compute_WhenEstimatorReturnsNullButTokensPositive_YieldsNullUsd()
    {
        Mock<ILlmCostEstimator> estimator = new();
        estimator.Setup(e => e.EstimateUsd(10, 5, 0, null)).Returns((decimal?)null);

        List<AgentExecutionTrace> traces =
        [
            new()
            {
                ModelDeploymentName = AgentExecutionTraceModelMetadata.UnspecifiedDeploymentName,
                InputTokenCount = 10,
                OutputTokenCount = 5,
            },
        ];

        AgentExecutionTraceRunLlmCostSummary summary =
            AgentExecutionTraceRunLlmCostAggregator.Compute(traces, estimator.Object);

        summary.PromptTokens.Should().Be(10);
        summary.CompletionTokens.Should().Be(5);
        summary.EstimatedCostUsd.Should().BeNull();
        summary.CostEstimationBasis.Should().Be(RunLlmCostEstimationBasis.ProviderTokensWithoutRate);
    }

    [Fact]
    public void Compute_LargeTokenTotals_UseLongAccumulationWithoutOverflow()
    {
        Mock<ILlmCostEstimator> estimator = new();
        estimator.Setup(e => e.EstimateUsd(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string?>()))
            .Returns(1m);

        const int tokensPerTrace = 1_500_000_000;

        List<AgentExecutionTrace> traces =
        [
            new() { ModelDeploymentName = "dep-a", InputTokenCount = tokensPerTrace, OutputTokenCount = 0 },
            new() { ModelDeploymentName = "dep-a", InputTokenCount = tokensPerTrace, OutputTokenCount = 0 },
        ];

        AgentExecutionTraceRunLlmCostSummary summary =
            AgentExecutionTraceRunLlmCostAggregator.Compute(traces, estimator.Object);

        summary.PromptTokens.Should().Be((long)tokensPerTrace * 2);
        summary.PromptTokens.Should().BeGreaterThan(int.MaxValue);
        summary.EstimatedCostUsd.Should().Be(2m);
    }
}
