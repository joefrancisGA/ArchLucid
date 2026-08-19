namespace ArchLucid.Contracts.Governance.PolicyPacks;

/// <summary>Derives and enforces <see cref="PolicyPack.DistributionScope" /> invariants for V1.</summary>
public static class PolicyPackDistributionScopeRules
{
    /// <summary>Scopes that may be stored but have no V1 distribution API.</summary>
    public static readonly HashSet<string> ReservedUnimplementedScopes = new(StringComparer.OrdinalIgnoreCase)
    {
        PolicyPackDistributionScope.OrganizationShared,
        PolicyPackDistributionScope.Marketplace,
    };

    /// <summary>Maps pack authorship type to the default distribution scope at create time.</summary>
    public static string ResolveForPackType(string packType)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(packType);

        if (string.Equals(packType, PolicyPackType.BuiltIn, StringComparison.OrdinalIgnoreCase)
            || string.Equals(packType, PolicyPackType.PlatformDefault, StringComparison.OrdinalIgnoreCase))
            return PolicyPackDistributionScope.Platform;

        if (string.Equals(packType, PolicyPackType.TenantCustom, StringComparison.OrdinalIgnoreCase)
            || string.Equals(packType, PolicyPackType.WorkspaceCustom, StringComparison.OrdinalIgnoreCase)
            || string.Equals(packType, PolicyPackType.ProjectCustom, StringComparison.OrdinalIgnoreCase))
            return PolicyPackDistributionScope.OrganizationPrivate;

        throw new ArgumentException($"Unknown policy pack type '{packType}'.", nameof(packType));
    }

    /// <summary>Rejects reserved scopes that are not implemented in V1.</summary>
    public static void RejectReservedScope(string? distributionScope)
    {
        if (string.IsNullOrWhiteSpace(distributionScope))
            return;

        if (ReservedUnimplementedScopes.Contains(distributionScope.Trim()))
            throw new ArgumentException(
                $"Distribution scope '{distributionScope}' is reserved and not available in V1.",
                nameof(distributionScope));
    }

    /// <summary>Returns whether the pack may be snapshotted into the global promoted catalog.</summary>
    public static bool CanPromoteToGlobalCatalog(PolicyPack pack)
    {
        ArgumentNullException.ThrowIfNull(pack);

        if (!string.Equals(
                pack.DistributionScope,
                PolicyPackDistributionScope.Platform,
                StringComparison.OrdinalIgnoreCase))
            return false;

        return string.Equals(pack.PackType, PolicyPackType.BuiltIn, StringComparison.OrdinalIgnoreCase)
               || string.Equals(pack.PackType, PolicyPackType.PlatformDefault, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>Throws when <paramref name="pack" /> cannot leave the owning organization via catalog promotion.</summary>
    public static void EnsureCanPromoteToGlobalCatalog(PolicyPack pack)
    {
        if (CanPromoteToGlobalCatalog(pack))
            return;

        throw new PolicyPackCrossTenantDistributionBlockedException(pack.DistributionScope);
    }

    /// <summary>V1 immutability: customer private scope cannot widen; platform scope stays platform.</summary>
    public static void EnsureDistributionScopeUnchanged(PolicyPack persisted, PolicyPack proposed)
    {
        ArgumentNullException.ThrowIfNull(persisted);
        ArgumentNullException.ThrowIfNull(proposed);

        if (string.Equals(persisted.DistributionScope, proposed.DistributionScope, StringComparison.OrdinalIgnoreCase))
            return;

        throw new InvalidOperationException(
            $"Policy pack distribution scope cannot change from '{persisted.DistributionScope}' to '{proposed.DistributionScope}'.");
    }
}
