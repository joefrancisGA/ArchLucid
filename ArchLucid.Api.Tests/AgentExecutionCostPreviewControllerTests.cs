using ArchLucid.Api.Controllers.AgentExecution;
using ArchLucid.Api.Models;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.DevTesting;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentExecutionCostPreviewControllerTests
{
    [Theory]
    [InlineData(64, 1, 64, 0.000175, 0.000700)]
    [InlineData(8192, 1, 8192, 0.020495, 0.081980)]
    [InlineData(65536, 1024, 8192, 0.035840, 0.716800)]
    public void GetCostPreview_uses_an_ordered_band_and_reports_the_actual_prompt_assumptions(
        int requestTokenAllowance,
        int maxOutputTokens,
        int expectedLowInputTokens,
        double expectedLow,
        double expectedHigh)
    {
        AgentExecutionCostPreviewResponse body = GetPreview(
            requestTokenAllowance, maxOutputTokens, DevAgentExecutionModeHeaderNames.Real, enabled: true);

        body.EstimatedCostUsdLow.Should().NotBeNull();
        body.EstimatedCostUsdHigh.Should().NotBeNull();
        body.EstimatedCostUsdLow!.Value.Should().BeApproximately(expectedLow, 0.000000001);
        body.EstimatedCostUsdHigh!.Value.Should().BeApproximately(expectedHigh, 0.000000001);
        body.EstimatedCostUsdLow.Value.Should().BeLessThanOrEqualTo(body.EstimatedCostUsdHigh.Value);
        body.EstimatedCostUsd.Should().Be(body.EstimatedCostUsdHigh);
        body.EstimatedCostBasis.Should().Contain($"at {expectedLowInputTokens} assumed input tokens");
        body.EstimatedCostBasis.Should().Contain($"({requestTokenAllowance} assumed input tokens)");
    }

    [Theory]
    [InlineData(false, true)]
    [InlineData(true, false)]
    public void GetCostPreview_omits_estimates_in_simulator_or_when_disabled(bool real, bool enabled)
    {
        AgentExecutionCostPreviewResponse body = GetPreview(
            64, 1, real ? DevAgentExecutionModeHeaderNames.Real : DevAgentExecutionModeHeaderNames.Simulator, enabled);

        body.EstimatedCostUsdLow.Should().BeNull();
        body.EstimatedCostUsdHigh.Should().BeNull();
        body.EstimatedCostUsd.Should().BeNull();
    }

    private static AgentExecutionCostPreviewResponse GetPreview(int inputLimit, int outputLimit, string mode, bool enabled)
    {
        Mock<IEffectiveAgentExecutionModeAccessor> modeAccessor = new();
        modeAccessor.Setup(accessor => accessor.GetEffectiveMode()).Returns(mode);
        AgentExecutionCostPreviewController controller = new(
            Monitor(new AgentExecutionOptions()),
            modeAccessor.Object,
            Monitor(new AzureOpenAiOptions { MaxCompletionTokens = outputLimit }),
            Monitor(new LlmDailyTenantTokenWindowOptions { AssumedMaxTotalTokensPerRequest = inputLimit }),
            Monitor(new LlmCostEstimationOptions { Enabled = enabled }),
            new FixedRateEstimator());

        OkObjectResult result = controller.GetCostPreview().Result.Should().BeOfType<OkObjectResult>().Subject;
        return result.Value.Should().BeOfType<AgentExecutionCostPreviewResponse>().Subject;
    }

    private static IOptionsMonitor<T> Monitor<T>(T value)
        where T : class
    {
        Mock<IOptionsMonitor<T>> monitor = new();
        monitor.SetupGet(options => options.CurrentValue).Returns(value);
        return monitor.Object;
    }

    private sealed class FixedRateEstimator : ILlmCostEstimator
    {
        public decimal? EstimateUsd(
            int inputTokens,
            int outputTokens,
            int reasoningTokens = 0,
            string? deploymentLabel = null,
            string? modelAliasId = null) =>
            ((inputTokens * 2.5m) + (outputTokens * 15m)) / 1_000_000m;
    }
}
