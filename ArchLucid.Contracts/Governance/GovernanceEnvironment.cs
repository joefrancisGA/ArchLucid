namespace ArchLucid.Contracts.Governance;

public static class GovernanceEnvironment
{
    public const string Dev = "dev";
    public const string Test = "test";
    public const string Prod = "prod";

<<<<<<< HEAD
=======
    /// <summary>
    ///     Trims, lower-cases, and validates <paramref name="environment"/>; throws
    ///     <see cref="ArgumentException"/> when the value is empty or not a known environment.
    /// </summary>
>>>>>>> origin/cursor/api-governance-tenancy-hunt-206-rebase-0dca
    public static string NormalizeAndValidate(string environment, string paramName)
    {
        if (string.IsNullOrWhiteSpace(environment))
            throw new ArgumentException("Environment is required.", paramName);

<<<<<<< HEAD
        string normalized = environment.Trim();

        if (!IsKnown(normalized))
            throw new ArgumentException("Environment must be one of: dev, test, prod.", paramName);

        return normalized.ToLowerInvariant();
    }

    public static bool IsKnown(string environment)
    {
        return string.Equals(environment, Dev, StringComparison.OrdinalIgnoreCase)
               || string.Equals(environment, Test, StringComparison.OrdinalIgnoreCase)
               || string.Equals(environment, Prod, StringComparison.OrdinalIgnoreCase);
=======
        string normalized = environment.Trim().ToLowerInvariant();

        if (normalized != Dev && normalized != Test && normalized != Prod)
            throw new ArgumentException("Environment must be one of: dev, test, prod.", paramName);

        return normalized;
>>>>>>> origin/cursor/api-governance-tenancy-hunt-206-rebase-0dca
    }
}
