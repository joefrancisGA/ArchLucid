using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Startup;

/// <summary>Warns when LLM USD/M rates are zero or negative at startup (Improvement #14).</summary>
public sealed class LlmCostEstimationStartupRateWarningPostConfigure : IPostConfigureOptions<LlmCostEstimationOptions>
{
    /// <inheritdoc />
    public void PostConfigure(string? name, LlmCostEstimationOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        if (HasNonPositiveRate(options.InputUsdPerMillionTokens)
            || HasNonPositiveRate(options.OutputUsdPerMillionTokens)
            || HasNonPositiveRate(options.ReasoningUsdPerMillionTokens))
        {
            ArchLucidInstrumentation.RecordStartupConfigWarning(
                StartupValidationWarningRuleNames.LlmCostEstimationNonPositiveGlobalRate);

            return;
        }

        foreach (KeyValuePair<string, LlmDeploymentUsdRates> deployment in options.Deployments)
        {
            if (deployment.Value is null)
                continue;

            if (HasNonPositiveRate(deployment.Value.InputUsdPerMillionTokens)
                || HasNonPositiveRate(deployment.Value.OutputUsdPerMillionTokens)
                || HasNonPositiveRate(deployment.Value.ReasoningUsdPerMillionTokens))
            {
                ArchLucidInstrumentation.RecordStartupConfigWarning(
                    StartupValidationWarningRuleNames.LlmCostEstimationNonPositiveDeploymentRate);

                return;
            }
        }
    }

    private static bool HasNonPositiveRate(decimal rate) => rate <= 0m;
}
