using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Configuration;

/// <summary>
///     Rejects negative USD/M rates in <see cref="LlmCostEstimationOptions" /> at host startup (TB-026).
/// </summary>
public sealed class LlmCostEstimationOptionsValidator : IValidateOptions<LlmCostEstimationOptions>
{
    /// <inheritdoc />
    public ValidateOptionsResult Validate(string? name, LlmCostEstimationOptions options)
    {
        if (options is null)
            throw new ArgumentNullException(nameof(options));

        List<string> failures = [];

        AppendRateFailure(failures, nameof(options.InputUsdPerMillionTokens), options.InputUsdPerMillionTokens);
        AppendRateFailure(failures, nameof(options.OutputUsdPerMillionTokens), options.OutputUsdPerMillionTokens);
        AppendRateFailure(failures, nameof(options.ReasoningUsdPerMillionTokens), options.ReasoningUsdPerMillionTokens);

        foreach (KeyValuePair<string, LlmDeploymentUsdRates> deployment in options.Deployments)
        {
            if (deployment.Value is null)
            {
                failures.Add(
                    $"{LlmCostEstimationOptions.SectionPath}: Deployments['{deployment.Key}'] must not be null.");

                continue;
            }

            string prefix = $"{LlmCostEstimationOptions.SectionPath}: Deployments['{deployment.Key}'].";

            AppendRateFailure(
                failures,
                prefix + nameof(LlmDeploymentUsdRates.InputUsdPerMillionTokens),
                deployment.Value.InputUsdPerMillionTokens);
            AppendRateFailure(
                failures,
                prefix + nameof(LlmDeploymentUsdRates.OutputUsdPerMillionTokens),
                deployment.Value.OutputUsdPerMillionTokens);
            AppendRateFailure(
                failures,
                prefix + nameof(LlmDeploymentUsdRates.ReasoningUsdPerMillionTokens),
                deployment.Value.ReasoningUsdPerMillionTokens);
        }

        if (failures.Count > 0)
            return ValidateOptionsResult.Fail(failures);

        return ValidateOptionsResult.Success;
    }

    private static void AppendRateFailure(List<string> failures, string fieldName, decimal rate)
    {
        if (rate < 0m)
            failures.Add($"{LlmCostEstimationOptions.SectionPath}: {fieldName} must be greater than or equal to zero.");
    }
}
