using ArchLucid.Api.Validators;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

using FluentValidation.Results;

namespace ArchLucid.Api.Tests;

/// <summary>Unit coverage for <see cref="LlmCostTuningRequestValidator" />.</summary>
[Trait("Suite", "Core")]
public sealed class LlmCostTuningRequestValidatorTests
{
    private readonly LlmCostTuningRequestValidator _validator = new();

    [Fact]
    public void Valid_request_passes()
    {
        LlmCostTuningRequest req = new()
        {
            InputUsdPerMillionTokens = 2.5m,
            OutputUsdPerMillionTokens = 10m
        };

        ValidationResult result = _validator.Validate(req);

        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public void Zero_input_fails()
    {
        LlmCostTuningRequest req = new() { InputUsdPerMillionTokens = 0m, OutputUsdPerMillionTokens = 1m };

        ValidationResult result = _validator.Validate(req);

        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public void Above_max_fails()
    {
        decimal over = LlmCostTuningRequestValidator.MaxUsdPerMillionTokens + 0.0001m;
        LlmCostTuningRequest req = new() { InputUsdPerMillionTokens = 1m, OutputUsdPerMillionTokens = over };

        ValidationResult result = _validator.Validate(req);

        result.IsValid.Should().BeFalse();
    }
}
