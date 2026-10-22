using ArchLucid.Contracts.Requests;

using FluentValidation;

namespace ArchLucid.Api.Validators;

/// <summary>FluentValidation for <see cref="LlmCostTuningRequest" /> (<c>POST /v1/admin/llm-cost-tuning</c>).</summary>
public sealed class LlmCostTuningRequestValidator : AbstractValidator<LlmCostTuningRequest>
{
    /// <summary>Maximum USD per 1M tokens (input or output) the API accepts — guards typos and abuse without constraining real pricing bands.</summary>
    public const decimal MaxUsdPerMillionTokens = 500_000m;

    /// <summary>Requires strictly positive rates within <see cref="MaxUsdPerMillionTokens" />.</summary>
    public LlmCostTuningRequestValidator()
    {
        RuleFor(x => x.InputUsdPerMillionTokens)
            .GreaterThan(0m)
            .LessThanOrEqualTo(MaxUsdPerMillionTokens);

        RuleFor(x => x.OutputUsdPerMillionTokens)
            .GreaterThan(0m)
            .LessThanOrEqualTo(MaxUsdPerMillionTokens);
    }
}
