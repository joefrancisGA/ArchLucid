using ArchLucid.Contracts.Governance;

namespace ArchLucid.Api.Validators;

/// <summary>
///     Shared governance environment name validation for controller request guards.
/// </summary>
internal static class GovernanceEnvironmentValidation
{
    public static bool IsValid(string environment)
    {
        string trimmed = environment.Trim();

        return string.Equals(trimmed, GovernanceEnvironment.Dev, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, GovernanceEnvironment.Test, StringComparison.OrdinalIgnoreCase)
            || string.Equals(trimmed, GovernanceEnvironment.Prod, StringComparison.OrdinalIgnoreCase);
    }
}
