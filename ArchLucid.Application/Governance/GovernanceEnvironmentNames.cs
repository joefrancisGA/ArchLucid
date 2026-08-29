using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>
///     Normalizes governance environment names for workflow and preview reads.
/// </summary>
internal static class GovernanceEnvironmentNames
{
public static string NormalizeOrThrow(string environment, string paramName)
{
    if (string.IsNullOrWhiteSpace(environment))
        throw new ArgumentException("Environment is required.", paramName);

    string trimmed = environment.Trim();

    if (!IsKnown(trimmed))
    {
        throw new ArgumentException(
            "Environment must be one of: dev, test, prod.",
            paramName);
    }

    return trimmed.ToLowerInvariant();
}

    private static bool IsKnown(string value)
    {
        return string.Equals(value, GovernanceEnvironment.Dev, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GovernanceEnvironment.Test, StringComparison.OrdinalIgnoreCase)
            || string.Equals(value, GovernanceEnvironment.Prod, StringComparison.OrdinalIgnoreCase);
    }
}
