using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Identity;

public interface IPostAuthInvitationBootstrapService
{
    Task<PostAuthBootstrapStatusResult?> TryResolveInvitationStatusAsync(
        Guid platformUserId,
        string normalizedEmail,
        string? invitationToken,
        IReadOnlyList<WorkspaceMembershipRecord> activeMemberships,
        CancellationToken cancellationToken);

    Task<PostAuthBootstrapSessionResult?> AcceptInvitationAsync(
        Guid platformUserId,
        string normalizedEmail,
        PostAuthAcceptInvitationRequest request,
        string? safeReturnPath,
        CancellationToken cancellationToken);
}

public sealed class PostAuthInvitationBootstrapService(
    IWorkspaceMembershipRepository memberships,
    IUserInvitationRepository invitations,
    IUserInvitationFlowService invitationFlow,
    ITenantRepository tenantRepository,
    IAuditService auditService,
    TimeProvider timeProvider) : IPostAuthInvitationBootstrapService
{
    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly IUserInvitationRepository _invitations =
        invitations ?? throw new ArgumentNullException(nameof(invitations));

    private readonly IUserInvitationFlowService _invitationFlow =
        invitationFlow ?? throw new ArgumentNullException(nameof(invitationFlow));

    private readonly IWorkspaceMembershipRepository _memberships =
        memberships ?? throw new ArgumentNullException(nameof(memberships));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<PostAuthBootstrapStatusResult?> TryResolveInvitationStatusAsync(
        Guid platformUserId,
        string normalizedEmail,
        string? invitationToken,
        IReadOnlyList<WorkspaceMembershipRecord> activeMemberships,
        CancellationToken cancellationToken)
    {
        UserInvitationRecord? tokenInvitation = null;

        if (!string.IsNullOrWhiteSpace(invitationToken))
        {
            tokenInvitation =
                await _invitationFlow.ResolvePendingByTokenAsync(invitationToken, cancellationToken).ConfigureAwait(false);
        }

        if (tokenInvitation is not null)
        {
            WorkspaceMembershipRecord? existingMembership = activeMemberships.FirstOrDefault(row =>
                row.TenantId == tokenInvitation.TenantId && row.WorkspaceId == tokenInvitation.WorkspaceId);

            if (existingMembership is not null)
            {
                return new PostAuthBootstrapStatusResult
                {
                    Destination = PostAuthBootstrapDestination.Complete,
                    Workspaces = await PostAuthBootstrapSupport.BuildWorkspaceSummariesAsync(
                            _tenantRepository,
                            activeMemberships,
                            cancellationToken)
                        .ConfigureAwait(false),
                    CanCreateWorkspace = false
                };
            }

            bool emailMismatch = !string.Equals(tokenInvitation.Email, normalizedEmail, StringComparison.Ordinal);

            return new PostAuthBootstrapStatusResult
            {
                Destination = PostAuthBootstrapDestination.AcceptInvitation,
                PendingInvitations =
                [
                    PostAuthBootstrapSupport.BuildInvitationSummary(tokenInvitation, normalizedEmail, emailMismatch)
                ],
                CanCreateWorkspace = false
            };
        }

        IReadOnlyList<UserInvitationRecord> pendingInvitations =
            await _invitations.ListPendingByNormalizedEmailAsync(normalizedEmail, cancellationToken).ConfigureAwait(false);

        if (pendingInvitations.Count == 0)
        {
            return null;
        }

        List<PostAuthBootstrapInvitationSummary> invitationSummaries = pendingInvitations
            .Select(row => PostAuthBootstrapSupport.BuildInvitationSummary(row, normalizedEmail, emailMismatch: false))
            .ToList();

        return new PostAuthBootstrapStatusResult
        {
            Destination = PostAuthBootstrapDestination.AcceptInvitation,
            PendingInvitations = invitationSummaries,
            CanCreateWorkspace = false
        };
    }

    public async Task<PostAuthBootstrapSessionResult?> AcceptInvitationAsync(
        Guid platformUserId,
        string normalizedEmail,
        PostAuthAcceptInvitationRequest request,
        string? safeReturnPath,
        CancellationToken cancellationToken)
    {
        UserInvitationRecord? invitation = await ResolveInvitationForAcceptanceAsync(
                request,
                normalizedEmail,
                cancellationToken)
            .ConfigureAwait(false);

        if (invitation is null)
        {
            return null;
        }

        if (!string.Equals(invitation.Email, normalizedEmail, StringComparison.Ordinal)
            && !request.ConfirmEmailMismatch)
        {
            return null;
        }

        IReadOnlyList<WorkspaceMembershipRecord> activeMemberships =
            await PostAuthBootstrapSupport.ListActiveMembershipsAsync(_memberships, platformUserId, cancellationToken)
                .ConfigureAwait(false);

        WorkspaceMembershipRecord? existingMembership = activeMemberships.FirstOrDefault(row =>
            row.TenantId == invitation.TenantId && row.WorkspaceId == invitation.WorkspaceId);

        if (existingMembership is not null)
        {
            await _invitations.MarkAcceptedAsync(invitation.Id, _timeProvider.GetUtcNow(), cancellationToken)
                .ConfigureAwait(false);

            TenantWorkspaceLink? existingLink =
                await _tenantRepository.GetFirstWorkspaceAsync(invitation.TenantId, cancellationToken).ConfigureAwait(false);

            return new PostAuthBootstrapSessionResult
            {
                TenantId = invitation.TenantId,
                WorkspaceId = invitation.WorkspaceId,
                ProjectId = existingLink?.DefaultProjectId ?? Guid.Empty,
                Role = existingMembership.Role,
                RedirectPath = PostAuthBootstrapSupport.IsResumePath(safeReturnPath) ? safeReturnPath! : "/"
            };
        }

        DateTimeOffset now = _timeProvider.GetUtcNow();
        bool accepted = await _invitations.MarkAcceptedAsync(invitation.Id, now, cancellationToken).ConfigureAwait(false);

        if (!accepted)
        {
            return null;
        }

        await _memberships.UpsertAsync(
            new WorkspaceMembershipInsert
            {
                UserId = platformUserId,
                TenantId = invitation.TenantId,
                WorkspaceId = invitation.WorkspaceId,
                Role = invitation.AppRole,
                Status = WorkspaceMembershipStatus.Active
            },
            now,
            cancellationToken).ConfigureAwait(false);

        await AuthAuditEmitter.LogAsync(
                _auditService,
                AuditEventTypes.AdminUserInvitationAccepted,
                normalizedEmail,
                new
                {
                    invitationId = invitation.Id,
                    userId = platformUserId,
                    emailMismatch = !string.Equals(invitation.Email, normalizedEmail, StringComparison.Ordinal)
                },
                cancellationToken,
                invitation.TenantId,
                invitation.WorkspaceId)
            .ConfigureAwait(false);

        TenantWorkspaceLink? link =
            await _tenantRepository.GetFirstWorkspaceAsync(invitation.TenantId, cancellationToken).ConfigureAwait(false);

        Guid projectId = link?.DefaultProjectId ?? Guid.Empty;

        return new PostAuthBootstrapSessionResult
        {
            TenantId = invitation.TenantId,
            WorkspaceId = invitation.WorkspaceId,
            ProjectId = projectId,
            Role = invitation.AppRole,
            RedirectPath = PostAuthBootstrapSupport.IsResumePath(safeReturnPath)
                ? safeReturnPath!
                : PostAuthOperatorRoutes.InvitationAcceptedPath
        };
    }

    private async Task<UserInvitationRecord?> ResolveInvitationForAcceptanceAsync(
        PostAuthAcceptInvitationRequest request,
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        UserInvitationRecord? invitation = null;

        if (!string.IsNullOrWhiteSpace(request.InvitationToken))
        {
            invitation = await _invitationFlow.ResolvePendingByTokenAsync(request.InvitationToken, cancellationToken)
                .ConfigureAwait(false);
        }

        if (invitation is null || invitation.Id != request.InvitationId)
        {
            IReadOnlyList<UserInvitationRecord> pending =
                await _invitations.ListPendingByNormalizedEmailAsync(normalizedEmail, cancellationToken).ConfigureAwait(false);

            invitation = pending.FirstOrDefault(row => row.Id == request.InvitationId);
        }

        if (invitation is null || invitation.ExpiresUtc <= _timeProvider.GetUtcNow())
        {
            return null;
        }

        return invitation;
    }
}
