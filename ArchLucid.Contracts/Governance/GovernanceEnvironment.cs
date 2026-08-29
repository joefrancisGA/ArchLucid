namespace ArchLucid.Contracts.Governance;

public static class GovernanceEnvironment
{
    public const string Dev = "dev";
    public const string Test = "test";
    public const string Prod = "prod";

    /// <summary>
    ///     Trims, lower-cases, and validates <paramref name="environment"/>; throws
    ///     <see cref="ArgumentException"/> when the value is empty or not a known environment.
    /// </summary>
    public static string NormalizeAndValidate(string environment, string paramName)
    {
        if (string.IsNullOrWhiteSpace(environment))
            throw new ArgumentException("Environment is required.", paramName);

        string normalized = environment.Trim().ToLowerInvariant();

        if (normalized != Dev && normalized != Test && normalized != Prod)
            throw new ArgumentException("Environment must be one of: dev, test, prod.", paramName);

        return normalized;
    }
}
