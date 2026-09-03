namespace ArchLucid.Core.Hosting;

/// <summary>
///     Shared interpretation of environment names that should be treated as production-like for bypass-auth guards
///     and operational startup hints (see <see cref="ProductionLikeHostingMisconfigurationAdvisor" />).
/// </summary>
public static class HostingEnvironmentNamePatterns
{
    /// <summary>
    ///     Treats names containing <c>prod</c> (case-insensitive) as production-like so misnamed hosts
    ///     (for example <c>PreProduction</c>, <c>staging-prod</c>) cannot rely on Development-only behavior.
    ///     Excludes <c>non-production</c> / <c>nonproduction</c>.
    /// </summary>
    public static bool EnvironmentNameImpliesProductionLike(string? environmentName)
    {
        if (string.IsNullOrWhiteSpace(environmentName))
            return false;

        string trimmed = environmentName.Trim();

        if (trimmed.Contains("non-production", StringComparison.OrdinalIgnoreCase))
            return false;

        if (trimmed.Contains("nonproduction", StringComparison.OrdinalIgnoreCase))
            return false;

        if (IsProdSubstringFalsePositiveEnvironmentName(trimmed))
            return false;

        return trimmed.Contains("prod", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsProdSubstringFalsePositiveEnvironmentName(string trimmed)
    {
        if (string.Equals(trimmed, "reproduce", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("reproduce-", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("reproduce_", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (string.Equals(trimmed, "product", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("product-", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("product_", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return false;
    }
}
