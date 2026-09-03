namespace ArchLucid.Core.Hosting;

/// <summary>
///     Shared interpretation of environment names that should be treated as production-like for bypass-auth guards
///     and operational startup hints (see <see cref="ProductionLikeHostingMisconfigurationAdvisor" />).
/// </summary>
public static class HostingEnvironmentNamePatterns
{
    /// <summary>
    ///     Treats names containing a production-like <c>prod</c> token (case-insensitive) as production-like so
    ///     misnamed hosts (for example <c>PreProduction</c>, <c>staging-prod</c>) cannot rely on Development-only
    ///     behavior. Excludes <c>non-production</c> / <c>nonproduction</c>, <c>reproduction</c>, and embedded
    ///     <c>prod</c> substrings inside unrelated words (for example <c>reproduce</c>, <c>product</c>).
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

        return ContainsProductionLikeProdReference(trimmed);
    }

    private static bool ContainsProductionLikeProdReference(string trimmed)
    {
        if (IsReproductionLikeEnvironmentName(trimmed))
            return false;

        if (trimmed.Contains("production", StringComparison.OrdinalIgnoreCase))
            return true;

        return ContainsStandaloneProdDelimiterToken(trimmed);
    }

    private static bool IsReproductionLikeEnvironmentName(string trimmed)
    {
        if (string.Equals(trimmed, "reproduction", StringComparison.OrdinalIgnoreCase))
            return true;

        return trimmed.StartsWith("reproduction-", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("reproduction_", StringComparison.OrdinalIgnoreCase);
    }

    private static bool ContainsStandaloneProdDelimiterToken(string trimmed)
    {
        if (string.Equals(trimmed, "prod", StringComparison.OrdinalIgnoreCase))
            return true;

        int index = 0;

        while (index < trimmed.Length)
        {
            index = trimmed.IndexOf("prod", index, StringComparison.OrdinalIgnoreCase);

            if (index < 0)
                return false;

            if (IsStandaloneProdToken(trimmed, index))
                return true;

            index += 4;
        }

        return false;
    }

    private static bool IsStandaloneProdToken(string trimmed, int prodIndex)
    {
        int before = prodIndex - 1;
        int afterProd = prodIndex + 4;

        bool okBefore = prodIndex == 0
            || !char.IsLetterOrDigit(trimmed[before])
            || trimmed[before] is '-' or '_';

        bool okAfter = afterProd >= trimmed.Length
            || !char.IsLetter(trimmed[afterProd])
            || trimmed[afterProd] is '-' or '_';

        return okBefore && okAfter;
    }
}
