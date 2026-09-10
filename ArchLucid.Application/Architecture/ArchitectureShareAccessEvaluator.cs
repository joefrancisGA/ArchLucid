using ArchLucid.Application.Common;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

namespace ArchLucid.Application.Architecture;

/// <summary>AS-090: View / Decide / Admin share roles intersect existing authority — no parallel kernel.</summary>
public static class ArchitectureShareAccessEvaluator
{
    public static bool CanView(ArchitectureIdentityRecord architecture, ArchitectureShareRecord? shareForActor)
    {
        ArgumentNullException.ThrowIfNull(architecture);

        if (!architecture.RestrictToShares)
            return true;

        return shareForActor is not null;
    }

    public static bool CanAdmin(ArchitectureIdentityRecord architecture, ArchitectureShareRecord? shareForActor)
    {
        ArgumentNullException.ThrowIfNull(architecture);

        if (!architecture.RestrictToShares)
            return true;

        return shareForActor is not null
            && string.Equals(shareForActor.Role, ArchitectureShareRoles.Admin, StringComparison.Ordinal);
    }

    public static bool CanDecide(
        ArchitectureIdentityRecord architecture,
        ArchitectureShareRecord? shareForActor,
        bool hasExecuteAuthority)
    {
        ArgumentNullException.ThrowIfNull(architecture);

        if (!hasExecuteAuthority)
            return false;

        if (!architecture.RestrictToShares)
            return true;

        if (shareForActor is null)
            return false;

        return string.Equals(shareForActor.Role, ArchitectureShareRoles.Decide, StringComparison.Ordinal)
            || string.Equals(shareForActor.Role, ArchitectureShareRoles.Admin, StringComparison.Ordinal);
    }

    public static bool RoleAllowsDecide(string role) =>
        string.Equals(role, ArchitectureShareRoles.Decide, StringComparison.Ordinal)
        || string.Equals(role, ArchitectureShareRoles.Admin, StringComparison.Ordinal);

    public static bool RoleAllowsAdmin(string role) =>
        string.Equals(role, ArchitectureShareRoles.Admin, StringComparison.Ordinal);
}
