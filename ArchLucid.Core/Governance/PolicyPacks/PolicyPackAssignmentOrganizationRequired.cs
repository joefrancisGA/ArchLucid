using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Core.Governance.PolicyPacks;

/// <summary>
///     Distinguishes organization-required assignments from merge-precedence <see cref="PolicyPackAssignment.IsPinned" />.
/// </summary>
public static class PolicyPackAssignmentOrganizationRequired
{
    /// <summary>
    ///     True when the assignment is locked as organization-required for coverage and focused-review scope.
    ///     <see cref="PolicyPackAssignment.IsPinned" /> affects merge precedence only.
    /// </summary>
    public static bool IsOrganizationRequired(PolicyPackAssignment? assignment)
    {
        if (assignment is null)
            return false;

        return assignment.IsOrganizationRequired;
    }
}
