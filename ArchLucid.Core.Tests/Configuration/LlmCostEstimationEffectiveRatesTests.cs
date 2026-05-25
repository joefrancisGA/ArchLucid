using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Configuration")]
public sealed class LlmCostEstimationEffectiveRatesTests
{
    [Fact]
    public void TryResolve_negative_persisted_override_returns_false()
    {
        LlmCostEstimationOptions options = new()
        {
            InputUsdPerMillionTokens = 3m,
            OutputUsdPerMillionTokens = 15m,
        };

        bool ok = LlmCostEstimationEffectiveRates.TryResolve(
            options,
            new FixedUsdRateOverride(-1m, 20m),
            deploymentLabel: null,
            out _,
            out _,
            out _);

        ok.Should().BeFalse();
    }

    [Fact]
    public void TryResolve_negative_deployment_rate_is_ignored_in_favor_of_global_rate()
    {
        LlmCostEstimationOptions options = new()
        {
            InputUsdPerMillionTokens = 3m,
            OutputUsdPerMillionTokens = 15m,
            Deployments = new Dictionary<string, LlmDeploymentUsdRates>(StringComparer.OrdinalIgnoreCase)
            {
                ["dep-a"] = new LlmDeploymentUsdRates { InputUsdPerMillionTokens = -5m },
            },
        };

        bool ok = LlmCostEstimationEffectiveRates.TryResolve(
            options,
            NoOpLlmCostEstimationUsdRateOverride.Instance,
            "dep-a",
            out decimal inputRate,
            out _,
            out _);

        ok.Should().BeTrue();
        inputRate.Should().Be(3m);
    }

    private sealed class FixedUsdRateOverride(decimal input, decimal output) : ILlmCostEstimationUsdRateOverride
    {
        public bool TryGetUsdPerMillionRates(out decimal inputUsdPerMillionTokens, out decimal outputUsdPerMillionTokens)
        {
            inputUsdPerMillionTokens = input;
            outputUsdPerMillionTokens = output;

            return true;
        }
    }
}
