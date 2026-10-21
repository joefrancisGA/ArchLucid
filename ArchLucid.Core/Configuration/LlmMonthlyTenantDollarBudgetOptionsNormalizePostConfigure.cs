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
        Dictionary<string, LlmMonthlyTenantPlanBudgetOptions>? byPlan = options.ByPlan;

        if (byPlan is not { Count: > 0 })
            return;

        Dictionary<string, LlmMonthlyTenantPlanBudgetOptions> normalized =
            new(StringComparer.OrdinalIgnoreCase);

        foreach (KeyValuePair<string, LlmMonthlyTenantPlanBudgetOptions> entry in byPlan)
        {

            if (string.IsNullOrWhiteSpace(entry.Key))
                continue;

            normalized[entry.Key.Trim()] = entry.Value;
        }

        options.ByPlan = normalized;
    }
}
