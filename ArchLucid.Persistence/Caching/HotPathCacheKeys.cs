using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Tenancy;

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

    /// <summary>
    ///     Whether the scoped tenant completed at least one committed golden-manifest review (<c>GET /api/auth/me</c>).
    /// </summary>
    public static string CommittedArchitectureReviewFlag(ScopeContext scope, long runListScopeRevision)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}committed-arch-review:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:r{runListScopeRevision}";
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

    /// <summary>Findings snapshot by authority scope + snapshot id (TB-593).</summary>
    public static string FindingsSnapshot(ScopeContext scope, Guid findingsSnapshotId)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}fs:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:{findingsSnapshotId:N}";
    }

    /// <summary>Tenant revision stamp for custom-role assignment / role list caches.</summary>
    public static string CustomRoleTenantRevision(Guid tenantId)
    {
        return $"{Prefix}cr-rev:{tenantId:N}";
    }

    /// <summary>Custom-role assignments joined with role metadata for one SCIM user.</summary>
    public static string CustomRoleAssignmentsForUser(Guid tenantId, Guid userId, long revision)
    {
        return $"{Prefix}cr-assign:{tenantId:N}:{userId:N}:r{revision}";
    }

    /// <summary>Custom role by tenant + role id at a tenant revision.</summary>
    public static string CustomRoleById(Guid tenantId, Guid roleId, long revision)
    {
        return $"{Prefix}cr:{tenantId:N}:{roleId:N}:r{revision}";
    }

    /// <summary>All custom roles for a tenant at a tenant revision.</summary>
    public static string CustomRoleListByTenant(Guid tenantId, long revision)
    {
        return $"{Prefix}cr-list:{tenantId:N}:r{revision}";
    }

    /// <summary>SCIM user by tenant + directory external id (claims transform hot path).</summary>
    public static string ScimUserByExternalId(Guid tenantId, string externalId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(externalId);

        return $"{Prefix}scim-ext:{tenantId:N}:{externalId.Trim()}";
    }

    /// <summary>SCIM user by tenant + surrogate id.</summary>
    public static string ScimUserById(Guid tenantId, Guid userId)
    {
        return $"{Prefix}scim:{tenantId:N}:{userId:N}";
    }

    /// <summary>Tenant catalog row by id (erasure quarantine middleware hot path).</summary>
    public static string TenantById(Guid tenantId)
    {
        return $"{Prefix}tenant:{tenantId:N}";
    }

    /// <summary>Tenant settings key/value by tenant + setting key.</summary>
    public static string TenantSetting(Guid tenantId, string settingKey)
    {
        string normalizedKey = TenantSettingKeyNormalizer.Normalize(settingKey);

        return $"{Prefix}tset:{tenantId:N}:{normalizedKey}";
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

    /// <summary>Scope revision stamp for alert-rule list caches.</summary>
    public static string AlertRuleListScopeRevision(ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}ar-rev:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}";
    }

    /// <summary>All alert rules in scope at a scope revision.</summary>
    public static string AlertRuleListByScope(ScopeContext scope, long revision)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}ar-list:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:r{revision}";
    }

    /// <summary>Enabled alert rules in scope at a scope revision.</summary>
    public static string AlertRuleEnabledListByScope(ScopeContext scope, long revision)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}ar-en:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:r{revision}";
    }

    /// <summary>Single alert rule by id.</summary>
    public static string AlertRuleById(Guid ruleId)
    {
        return $"{Prefix}ar:{ruleId:N}";
    }

    /// <summary>Scope revision stamp for composite alert-rule list caches.</summary>
    public static string CompositeAlertRuleListScopeRevision(ScopeContext scope)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}car-rev:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}";
    }

    /// <summary>All composite alert rules in scope at a scope revision.</summary>
    public static string CompositeAlertRuleListByScope(ScopeContext scope, long revision)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}car-list:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:r{revision}";
    }

    /// <summary>Enabled composite alert rules in scope at a scope revision.</summary>
    public static string CompositeAlertRuleEnabledListByScope(ScopeContext scope, long revision)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return $"{Prefix}car-en:{scope.TenantId:N}:{scope.WorkspaceId:N}:{scope.ProjectId:N}:r{revision}";
    }

    /// <summary>Single composite alert rule by id.</summary>
    public static string CompositeAlertRuleById(Guid compositeRuleId)
    {
        return $"{Prefix}car:{compositeRuleId:N}";
    }

    /// <summary>Tenant AI budget policy override row.</summary>
    public static string TenantAiBudgetPolicy(Guid tenantId)
    {
        return $"{Prefix}aibudget:{tenantId:N}";
    }

    /// <summary>Tenant ROI cost settings row.</summary>
    public static string TenantCostSettings(Guid tenantId)
    {
        return $"{Prefix}tcost:{tenantId:N}";
    }

    /// <summary>Tenant identity provider configuration row.</summary>
    public static string TenantIdentityProviderConfiguration(Guid tenantId)
    {
        return $"{Prefix}tidp:{tenantId:N}";
    }

    /// <summary>Sign-in email domain routing lookup by normalized domain.</summary>
    public static string TenantSignInEmailDomainByNormalized(string normalizedDomain)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedDomain);

        return $"{Prefix}tsignin-dom:{normalizedDomain.Trim().ToUpperInvariant()}";
    }

    /// <summary>Sign-in email domains listed for one tenant.</summary>
    public static string TenantSignInEmailDomainListByTenant(Guid tenantId)
    {
        return $"{Prefix}tsignin-list:{tenantId:N}";
    }

    /// <summary>Sign-in email domain by tenant + normalized domain.</summary>
    public static string TenantSignInEmailDomainByTenantAndNormalized(Guid tenantId, string normalizedDomain)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedDomain);

        return $"{Prefix}tsignin:{tenantId:N}:{normalizedDomain.Trim().ToUpperInvariant()}";
    }
}
