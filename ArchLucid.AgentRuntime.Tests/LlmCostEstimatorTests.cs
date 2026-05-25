using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;

namespace ArchLucid.AgentRuntime.Tests;

[Trait("Category", "Unit")]
public sealed class LlmCostEstimatorTests
{
    [SkippableFact]
    public void EstimateUsd_returns_null_when_disabled()
    {
        LlmCostEstimator sut = new(Options.Create(new LlmCostEstimationOptions { Enabled = false }),
            NoOpLlmCostEstimationUsdRateOverride.Instance);

        sut.EstimateUsd(100, 100).Should().BeNull();
    }

    [SkippableFact]
    public void EstimateUsd_computes_when_enabled()
    {
        LlmCostEstimator sut = new(
            Options.Create(
                new LlmCostEstimationOptions
                {
                    Enabled = true, InputUsdPerMillionTokens = 3m, OutputUsdPerMillionTokens = 15m
                }),
            NoOpLlmCostEstimationUsdRateOverride.Instance);

        decimal? usd = sut.EstimateUsd(2_000_000, 1_000_000);

        usd.Should().Be(21m);
    }

    [SkippableFact]
    public void EstimateUsd_uses_persisted_override_base_rates_before_deployment_specific()
    {
        LlmCostEstimator sut = new(
            Options.Create(
                new LlmCostEstimationOptions
                {
                    Enabled = true,
                    InputUsdPerMillionTokens = 1m,
                    OutputUsdPerMillionTokens = 1m,
                    Deployments = new Dictionary<string, LlmDeploymentUsdRates>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["dep-a"] = new LlmDeploymentUsdRates
                        {
                            InputUsdPerMillionTokens = 99m,
                            OutputUsdPerMillionTokens = 99m
                        }
                    }
                }),
            new FixedUsdRateOverride(10m, 20m));

        decimal? noLabel = sut.EstimateUsd(1_000_000, 1_000_000);
        noLabel.Should().Be(30m);

        decimal? withDep = sut.EstimateUsd(1_000_000, 1_000_000, 0, "dep-a");
        withDep.Should().Be(99m + 99m);
    }

    [SkippableFact]
    public void EstimateUsd_returns_null_when_persisted_override_rate_is_negative()
    {
        LlmCostEstimator sut = new(
            Options.Create(
                new LlmCostEstimationOptions
                {
                    Enabled = true,
                    InputUsdPerMillionTokens = 3m,
                    OutputUsdPerMillionTokens = 15m,
                }),
            new FixedUsdRateOverride(-1m, 15m));

        sut.EstimateUsd(1_000_000, 0).Should().BeNull();
    }

    [SkippableFact]
    public void EstimateUsd_ignores_negative_deployment_override_rates()
    {
        LlmCostEstimator sut = new(
            Options.Create(
                new LlmCostEstimationOptions
                {
                    Enabled = true,
                    InputUsdPerMillionTokens = 2m,
                    OutputUsdPerMillionTokens = 4m,
                    Deployments = new Dictionary<string, LlmDeploymentUsdRates>(StringComparer.OrdinalIgnoreCase)
                    {
                        ["dep-a"] = new LlmDeploymentUsdRates { InputUsdPerMillionTokens = -9m },
                    },
                }),
            NoOpLlmCostEstimationUsdRateOverride.Instance);

        decimal? usd = sut.EstimateUsd(1_000_000, 0, 0, "dep-a");

        usd.Should().Be(2m);
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
