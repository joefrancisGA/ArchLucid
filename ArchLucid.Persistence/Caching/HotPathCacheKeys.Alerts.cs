using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Caching;

public static partial class HotPathCacheKeys
{
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
}
