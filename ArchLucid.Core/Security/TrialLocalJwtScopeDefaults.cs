using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Security;

/// <summary>
///     Fixed JWT scope for trial local identity tokens. Anonymous token requests must not embed caller-chosen tenant scope (TB-274).
/// </summary>
public static class TrialLocalJwtScopeDefaults
{
    public static (Guid TenantId, Guid WorkspaceId, Guid ProjectId) Resolve() =>
        (ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);
}
