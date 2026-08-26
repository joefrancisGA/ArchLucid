using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Identity;

public sealed partial class PostAuthWorkspaceBootstrapService
{
    public async Task<PostAuthBootstrapSessionResult?> SelectWorkspaceAsync(
        Guid platformUserId,
        PostAuthSelectWorkspaceRequest request,
        string? safeReturnPath,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<WorkspaceMembershipRecord> membershipsForUser =
            await _memberships.ListByUserAndTenantAsync(platformUserId, request.TenantId, cancellationToken)
                .ConfigureAwait(false);

        WorkspaceMembershipRecord? membership = membershipsForUser.FirstOrDefault(row =>
            row.WorkspaceId == request.WorkspaceId && row.Status == WorkspaceMembershipStatus.Active);

        if (membership is null)
        {
            return null;
        }

        IReadOnlyList<TenantWorkspaceListItem> workspaces =
            await _tenantRepository.ListWorkspacesAsync(request.TenantId, cancellationToken).ConfigureAwait(false);

        TenantWorkspaceListItem? workspace = workspaces.FirstOrDefault(row => row.WorkspaceId == request.WorkspaceId);

        if (workspace is null)
        {
            return null;
        }

        return new PostAuthBootstrapSessionResult
        {
            TenantId = request.TenantId,
            WorkspaceId = request.WorkspaceId,
            ProjectId = workspace.DefaultProjectId,
            Role = membership.Role,
            RedirectPath = PostAuthBootstrapSupport.IsResumePath(safeReturnPath) ? safeReturnPath! : "/"
        };
    }

    private async Task AuditDeniedAsync(
        Guid platformUserId,
        string displayEmail,
        string reason,
        CancellationToken cancellationToken)
    {
        await AuthAuditEmitter.LogAsync(
                _auditService,
                AuditEventTypes.PostAuthWorkspaceCreationDenied,
                displayEmail,
                new { reason },
                cancellationToken)
            .ConfigureAwait(false);
    }
}
