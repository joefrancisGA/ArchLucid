using System.Diagnostics;

using ArchLucid.AgentRuntime.Tests.Support;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Logging;

using Moq;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class LlmCompletionCostDeltaLoggerTests
{
    [Fact]
    public void LogIfEnabled_emits_cost_delta_event_when_actual_exceeds_estimate()
    {
        using Activity activity = new Activity("test.llm.completion");
        activity.SetTag("archlucid.run_id", "run-test-1");
        activity.SetTag("archlucid.agent.type_enum", "Cost");
        activity.Start();

        Mock<ILogger> logger = new();
        logger.Setup(l => l.IsEnabled(LogLevel.Information)).Returns(true);

        Mock<ILlmCostEstimator> cost = new();
        cost.Setup(e => e.EstimateUsd(100, 200)).Returns(0.10m);
        cost.Setup(e => e.EstimateUsd(50, 80)).Returns(0.20m);

        LlmMonthlyTenantDollarBudgetOptions opts = new()
        {
            AssumedMaxPromptTokensPerRequest = 100,
            AssumedMaxCompletionTokensPerRequest = 200
        };

        LlmCompletionCostDeltaLogger.LogIfEnabled(
            logger.Object,
            cost.Object,
            new FixedValueOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions>(opts),
            50,
            80);

        logger.Verify(
            l => l.Log(
                LogLevel.Information,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((state, _) => state.ToString()!.Contains(LlmCompletionCostDeltaLogger.EventName)),
                It.IsAny<Exception?>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }
}
