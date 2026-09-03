using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Caching;

public static partial class HotPathCacheKeys
{
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

    /// <summary>
    ///     Whether the scoped tenant completed at least one committed golden-manifest review (<c>GET /api/auth/me</c>).
    /// </summary>
    public static string CommittedArchitectureReviewFlag(ScopeContext scope, long runListScopeRevision)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}committed-arch-review:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:r{runListScopeRevision}";
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

    /// <summary>Findings snapshot by authority scope + snapshot id (TB-593).</summary>
    public static string FindingsSnapshot(ScopeContext scope, Guid findingsSnapshotId)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}fs:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{findingsSnapshotId:N}";
    }

    /// <summary>Architecture intake draft GET snapshot.</summary>
    public static string DraftRequest(ScopeContext scope, Guid draftId)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}draft:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{draftId:N}";
    }
}
