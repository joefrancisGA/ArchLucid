using ArchLucid.Contracts.Governance;

namespace ArchLucid.Api.Validators;

/// <summary>
///     Shared governance environment name validation for controller request guards.
/// </summary>
internal static class GovernanceEnvironmentValidation
{
    public static bool IsValid(string environment)
    {
        return string.Equals(environment, GovernanceEnvironment.Dev, StringComparison.OrdinalIgnoreCase)
            || string.Equals(environment, GovernanceEnvironment.Test, StringComparison.OrdinalIgnoreCase)
            || string.Equals(environment, GovernanceEnvironment.Prod, StringComparison.OrdinalIgnoreCase);
    }
}
