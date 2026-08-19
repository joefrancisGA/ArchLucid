using ArchLucid.Core.Configuration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Configuration")]
public sealed class LlmCostEstimationEffectiveRatesTests
{
    [Fact]
    public void TryResolve_negative_persisted_override_falls_back_to_global_rates()
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
            out decimal inputRate,
            out decimal outputRate,
            out _);

        ok.Should().BeTrue();
        inputRate.Should().Be(3m);
        outputRate.Should().Be(20m);
    }

    [Fact]
    public void TryResolve_negative_global_rate_falls_back_to_hardcoded_defaults()
    {
        LlmCostEstimationOptions options = new()
        {
            InputUsdPerMillionTokens = -1.5m,
            OutputUsdPerMillionTokens = 15m,
        };

        bool ok = LlmCostEstimationEffectiveRates.TryResolve(
            options,
            NoOpLlmCostEstimationUsdRateOverride.Instance,
            deploymentLabel: null,
            out decimal inputRate,
            out decimal outputRate,
            out _);

        ok.Should().BeTrue();
        inputRate.Should().Be(LlmCostEstimationEffectiveRates.DefaultInputUsdPerMillionTokens);
        outputRate.Should().Be(15m);
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
