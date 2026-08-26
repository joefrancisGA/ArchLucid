using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public sealed partial class EmailOtpVerifyFlow
{
    private async Task<AcceptedEmailOtpInvitation?> TryAcceptInvitationAsync(
        Guid platformUserId,
        string normalizedEmail,
        Guid? challengeInvitationId,
        string? invitationToken,
        CancellationToken cancellationToken)
    {
        UserInvitationRecord? invitation = null;

        if (challengeInvitationId is Guid linkedId)
        {
            invitation = await FindInvitationByIdAsync(linkedId, normalizedEmail, cancellationToken).ConfigureAwait(false);
        }

        if (invitation is null && !string.IsNullOrWhiteSpace(invitationToken))
        {
            byte[] tokenHash = EmailOtpInvitationTokenHasher.Hash(invitationToken);

            invitation = await _invitations.GetPendingByTokenHashAsync(tokenHash, cancellationToken).ConfigureAwait(false);
        }

        if (invitation is null
            || invitation.ExpiresUtc <= _timeProvider.GetUtcNow()
            || !InvitationEmailMatchesVerifiedEmail(invitation.Email, normalizedEmail))
        {
            return null;
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

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.AdminUserInvitationAccepted,
                $"invitation:{invitation.Id:D}",
                new
                {
                    invitationId = invitation.Id,
                    tenantId = invitation.TenantId,
                    workspaceId = invitation.WorkspaceId,
                    userId = platformUserId
                },
                cancellationToken,
                invitation.TenantId)
            .ConfigureAwait(false);

        return new AcceptedEmailOtpInvitation
        {
            InvitationId = invitation.Id,
            TenantId = invitation.TenantId,
            WorkspaceId = invitation.WorkspaceId
        };
    }

    private async Task<UserInvitationRecord?> FindInvitationByIdAsync(
        Guid invitationId,
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        UserInvitationRecord? invitation =
            await _invitations.GetPendingByIdAsync(invitationId, cancellationToken).ConfigureAwait(false);

        if (invitation is null || !InvitationEmailMatchesVerifiedEmail(invitation.Email, normalizedEmail))
            return null;

        return invitation;
    }

    private static bool InvitationEmailMatchesVerifiedEmail(string invitationEmail, string normalizedEmail) =>
        IdentityEmailNormalizer.TryNormalize(invitationEmail, out string normalizedInviteeEmail, out _)
        && string.Equals(normalizedInviteeEmail, normalizedEmail, StringComparison.Ordinal);
}
