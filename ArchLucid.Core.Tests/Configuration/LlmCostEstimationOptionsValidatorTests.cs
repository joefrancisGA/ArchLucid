using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Suite", "Configuration")]
public sealed class LlmCostEstimationOptionsValidatorTests
{
    private readonly LlmCostEstimationOptionsValidator _sut = new();

    [Fact]
    public void Validate_negative_global_input_rate_fails()
    {
        LlmCostEstimationOptions options = new() { InputUsdPerMillionTokens = -1m };

        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, options);

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(f => f.Contains(nameof(LlmCostEstimationOptions.InputUsdPerMillionTokens), StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_negative_deployment_rate_fails()
    {
        LlmCostEstimationOptions options = new()
        {
            Deployments = new Dictionary<string, LlmDeploymentUsdRates>(StringComparer.OrdinalIgnoreCase)
            {
                ["dep-a"] = new LlmDeploymentUsdRates { OutputUsdPerMillionTokens = -0.01m },
            },
        };

        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, options);

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(f => f.Contains("Deployments['dep-a']", StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_zero_rates_succeeds()
    {
        LlmCostEstimationOptions options = new()
        {
            InputUsdPerMillionTokens = 0m,
            OutputUsdPerMillionTokens = 0m,
            ReasoningUsdPerMillionTokens = 0m,
        };

        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, options);

        result.Succeeded.Should().BeTrue();
    }
}
