using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Caching;

/// <summary>Stable cache key fragments for hot-path repository decorators (tenant-scoped where applicable).</summary>
public static class HotPathCacheKeys
{
    private const string Prefix = "al:hot:";

    /// <summary>Golden manifest by authority scope + manifest id.</summary>
    public static string Manifest(ScopeContext scope, Guid manifestId)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}hm:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{manifestId:N}";
    }

    /// <summary>Authority run row by scope + run id (matches <c>dbo.Runs</c> scope columns).</summary>
    public static string Run(ScopeContext scope, Guid runId)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}run:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{runId:N}";
    }

    /// <summary>Scope revision stamp for run list cache keys (<see cref="RunListByProjectFirstPage" />).</summary>
    public static string RunListScopeRevision(ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}runlist-rev:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}";
    }

    /// <summary>First keyset page lists (project slug + take) — TTL short (<c>15s</c>).</summary>
    public static string RunListByProjectFirstPage(ScopeContext scope, string projectSlug, int take, long revision)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}runlist:proj:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:r{revision}:{take:D}:{projectSlug}";
    }

    /// <summary>First keyset page lists (recent in scope).</summary>
    public static string RunListRecentInScopeFirstPage(ScopeContext scope, int take, long revision)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}runlist:scope:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:r{revision}:{take:D}";
    }

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
}
