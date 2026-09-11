using System.Security.Claims;

using ArchLucid.Core.Authorization;

namespace ArchLucid.Api.Support;

/// <summary>Maps HTTP principal claims to workspace authority flags for AS-090 share intersection.</summary>
public static class ArchitectureShareAuthorityProbe
{
    public static bool HasReadAuthority(ClaimsPrincipal principal) =>
        principal.IsInRole(ArchLucidRoles.Reader)
        || principal.IsInRole(ArchLucidRoles.Operator)
        || principal.IsInRole(ArchLucidRoles.Architect)
        || principal.IsInRole(ArchLucidRoles.Reviewer)
        || principal.IsInRole(ArchLucidRoles.Sponsor)
        || HasWorkspaceAdminAuthority(principal);

    public static bool HasExecuteAuthority(ClaimsPrincipal principal) =>
        principal.IsInRole(ArchLucidRoles.Operator)
        || principal.IsInRole(ArchLucidRoles.Architect)
        || principal.IsInRole(ArchLucidRoles.Sponsor)
        || HasWorkspaceAdminAuthority(principal);

    public static bool HasWorkspaceAdminAuthority(ClaimsPrincipal principal) =>
        principal.IsInRole(ArchLucidRoles.Admin)
        || principal.IsInRole(ArchLucidRoles.WorkspaceAdmin)
        || principal.IsInRole(ArchLucidRoles.ProjectAdmin);
}
