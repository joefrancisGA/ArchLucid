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

    /// <summary>Scope revision stamp for audit list cache keys (TB-581).</summary>
    public static string AuditListScopeRevision(ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}auditlist-rev:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}";
    }

    /// <summary>First-page scoped audit list (no keyset cursor).</summary>
    public static string AuditListByScopeFirstPage(ScopeContext scope, int take, long revision)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}auditlist:scope:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:r{revision}:{take:D}";
    }

    /// <summary>First-page filtered audit list (no keyset cursor; fingerprint from <see cref="Audit.AuditFilterCacheFingerprint" />).</summary>
    public static string AuditListFilteredFirstPage(ScopeContext scope, string filterFingerprint, int take, long revision)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(filterFingerprint);

        return $"{Prefix}auditlist:filter:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:r{revision}:{take:D}:{filterFingerprint}";
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
}
