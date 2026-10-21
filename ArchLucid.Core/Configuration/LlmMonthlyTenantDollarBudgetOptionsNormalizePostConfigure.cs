using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Configuration;

/// <summary>Normalizes <see cref="LlmMonthlyTenantDollarBudgetOptions" /> after configuration binding.</summary>
public sealed class LlmMonthlyTenantDollarBudgetOptionsNormalizePostConfigure
    : IPostConfigureOptions<LlmMonthlyTenantDollarBudgetOptions>
{
    /// <inheritdoc />
    public void PostConfigure(string? name, LlmMonthlyTenantDollarBudgetOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);

        NormalizeByPlanKeys(options);
    }

    private static void NormalizeByPlanKeys(LlmMonthlyTenantDollarBudgetOptions options)
    {
        options.ByPlan = ConfigurationDictionaryBindingKeyNormalizer.NormalizeTrimmedKeys(options.ByPlan)
            ?? options.ByPlan;
    }
}
