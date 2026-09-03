using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Caching;

public static partial class HotPathCacheKeys
{
    /// <summary>Policy pack metadata by surrogate key.</summary>
    public static string PolicyPack(Guid policyPackId)
    {
        return $"{Prefix}pp:{policyPackId:N}";
    }

    /// <summary>Tenant revision stamp for <see cref="EffectivePolicyPackSet" /> cache keys.</summary>
    public static string PolicyPackResolverTenantRevision(Guid tenantId)
    {
        return $"{Prefix}epps-rev:{tenantId:N}";
    }

    /// <summary>Cached effective policy pack set for one scope at a tenant revision.</summary>
    public static string EffectivePolicyPackSet(Guid tenantId, Guid workspaceId, Guid projectId, long revision)
    {
        return $"{Prefix}epps:{tenantId:N}:{workspaceId:N}:{projectId:N}:r{revision}";
    }

    /// <summary>Scope revision stamp for policy-pack list cache keys (TB-581).</summary>
    public static string PolicyPackListScopeRevision(ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}pplist-rev:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}";
    }

    /// <summary>Policy packs authored in the current tenant/workspace/project scope.</summary>
    public static string PolicyPackListByScope(ScopeContext scope, long revision)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}pplist:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:r{revision}";
    }

    /// <summary>Governance dashboard aggregate for one authority scope and list caps (TB-581).</summary>
    public static string GovernanceDashboard(
        ScopeContext scope,
        Guid tenantId,
        int maxPending,
        int maxDecisions,
        int maxChanges)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return
            $"{Prefix}govdash:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{tenantId:N}:{maxPending:D}:{maxDecisions:D}:{maxChanges:D}";
    }

    /// <summary>Policy pack version row (includes ContentJson) by pack + version label.</summary>
    public static string PolicyPackVersion(Guid policyPackId, string version)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(version);

        return $"{Prefix}ppv:{policyPackId:N}:{version.Trim()}";
    }

    /// <summary>All versions for one policy pack.</summary>
    public static string PolicyPackVersionList(Guid policyPackId)
    {
        return $"{Prefix}ppv-list:{policyPackId:N}";
    }

    /// <summary>Platform-promoted policy pack catalog list.</summary>
    public static string PolicyPackCatalogPromotedList()
    {
        return $"{Prefix}ppc-list";
    }

    /// <summary>Platform-promoted policy pack catalog detail by entry id.</summary>
    public static string PolicyPackCatalogPromotedDetail(Guid policyPackCatalogEntryId)
    {
        return $"{Prefix}ppc:{policyPackCatalogEntryId:N}";
    }
}
