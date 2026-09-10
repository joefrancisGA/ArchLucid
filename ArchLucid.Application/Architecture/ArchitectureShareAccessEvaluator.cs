using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

namespace ArchLucid.Application.Architecture;

/// <summary>
///     AS-090: intersects ADR 0087 share roles with existing Read/Execute/Admin workspace authority.
///     Share is an additional gate on restricted architectures — not a replacement for ExecuteAuthority.
/// </summary>
public static class ArchitectureShareAccessEvaluator
{
    public static ArchitectureShareAccessEvaluation Evaluate(
        bool restrictToShares,
        string? shareRole,
        bool hasReadAuthority,
        bool hasExecuteAuthority,
        bool hasWorkspaceAdminAuthority)
    {
        if (!restrictToShares)
        {
            return new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true,
                RestrictToShares = false,
                ShareRole = shareRole,
                CanRead = hasReadAuthority,
                CanDecide = hasExecuteAuthority,
                CanAdmin = hasExecuteAuthority,
            };
        }

        if (hasWorkspaceAdminAuthority)
        {
            return new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true,
                RestrictToShares = true,
                ShareRole = shareRole,
                CanRead = hasReadAuthority,
                CanDecide = hasExecuteAuthority,
                CanAdmin = true,
            };
        }

        if (!MeetsMinimumRole(shareRole, ArchitectureShareRoles.View))
        {
            return new ArchitectureShareAccessEvaluation
            {
                ArchitectureFound = true,
                RestrictToShares = true,
                ShareRole = shareRole,
                CanRead = false,
                CanDecide = false,
                CanAdmin = false,
            };
        }

        return new ArchitectureShareAccessEvaluation
        {
            ArchitectureFound = true,
            RestrictToShares = true,
            ShareRole = shareRole,
            CanRead = hasReadAuthority,
            CanDecide = hasExecuteAuthority && MeetsMinimumRole(shareRole, ArchitectureShareRoles.Decide),
            CanAdmin = MeetsMinimumRole(shareRole, ArchitectureShareRoles.Admin),
        };
    }

    public static bool MeetsMinimumRole(string? shareRole, string minimumRole)
    {
        if (string.IsNullOrWhiteSpace(shareRole))
            return false;

        return RoleRank(shareRole) >= RoleRank(minimumRole);
    }

    private static int RoleRank(string role) =>
        role switch
        {
            ArchitectureShareRoles.View => 1,
            ArchitectureShareRoles.Decide => 2,
            ArchitectureShareRoles.Admin => 3,
            _ => 0,
        };
}
