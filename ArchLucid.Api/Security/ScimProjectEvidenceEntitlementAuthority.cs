using System.Security.Claims;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scim;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Auth.Services;
using ArchLucid.Persistence.Data.Repositories;

namespace ArchLucid.Api.Security;

/// <summary>
/// FND-010 server-side entitlement authority backed by current SCIM membership
/// and tenant/workspace/project role assignments. No client-provided ACL claims.
/// </summary>
public sealed class ScimProjectEvidenceEntitlementAuthority(
    IScopeContextProvider scopeProvider,
    IScimUserRepository users,
    IProjectRoleAssignmentRepository assignments)
    : IEvidenceEntitlementAuthority
{
    public async Task<bool> HasCurrentReadEntitlementAsync(
        ClaimsPrincipal principal,
        EvidenceReadResource resource,
        CancellationToken cancellationToken)
    {
        if (principal.Identity?.IsAuthenticated != true ||
            resource.TenantId == Guid.Empty || resource.WorkspaceId == Guid.Empty ||
            resource.ProjectId == Guid.Empty || resource.EvidenceId == Guid.Empty)
            return false;

        // Scope must originate from trusted middleware, not request parameters.
        ScopeContext scope = scopeProvider.GetCurrentScope();
        if (scope.TenantId != resource.TenantId ||
            scope.WorkspaceId != resource.WorkspaceId ||
            scope.ProjectId != resource.ProjectId)
            return false;

        string? directoryKey = RoleSyncService.TryDirectoryObjectKey(principal);
        if (string.IsNullOrWhiteSpace(directoryKey))
            return false;

        // No tenant-admin or JWT role bypass: always resolve current project ACL.
        var user = await users.GetByExternalIdAsync(
            resource.TenantId, directoryKey, cancellationToken).ConfigureAwait(false);
        if (user is null || user.DirectoryRemovedUtc is not null || !user.Active)
            return false;

        ProjectScopedEffectiveRole role = await assignments.GetHighestRoleAsync(
            resource.TenantId, resource.WorkspaceId, resource.ProjectId,
            user.Id, cancellationToken).ConfigureAwait(false);

        return role >= ProjectScopedEffectiveRole.Reader;
    }
}
