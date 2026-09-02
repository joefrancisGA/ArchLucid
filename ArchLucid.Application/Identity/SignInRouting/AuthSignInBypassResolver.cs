using ArchLucid.Core.Admin;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity.SignInRouting;

/// <inheritdoc cref="IAuthSignInBypassResolver" />
public sealed class AuthSignInBypassResolver(
    ITenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins,
    IUserInvitationRepository invitations,
    IPlatformTenantAuthRecoveryGrantRepository platformRecoveryGrants,
    TimeProvider timeProvider) : IAuthSignInBypassResolver
{
    private readonly ITenantSignInEmailDomainRecoveryAdminRepository _recoveryAdmins =
        recoveryAdmins ?? throw new ArgumentNullException(nameof(recoveryAdmins));

    private readonly IUserInvitationRepository _invitations =
        invitations ?? throw new ArgumentNullException(nameof(invitations));

    private readonly IPlatformTenantAuthRecoveryGrantRepository _platformRecoveryGrants =
        platformRecoveryGrants ?? throw new ArgumentNullException(nameof(platformRecoveryGrants));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<AuthSignInRoutingBypassKind> ResolveBypassKindAsync(
        AuthSignInRoutingRequest request,
        TenantSignInEmailDomainRecord policy,
        CancellationToken cancellationToken)
    {
        if (await HasValidInvitationRecoveryAsync(
                    request.NormalizedEmail,
                    request.InvitationToken,
                    policy.TenantId,
                    cancellationToken)
                .ConfigureAwait(false))
        {
            return AuthSignInRoutingBypassKind.Invitation;
        }

        if (policy.EnforcementMode != AuthDomainEnforcementMode.SsoRequiredWithRecoveryException
            || !policy.AllowEmailOtpRecovery)
        {
            return AuthSignInRoutingBypassKind.None;
        }

        bool isRecoveryAdmin = await _recoveryAdmins
            .IsRecoveryAdminAsync(
                policy.TenantId,
                policy.NormalizedDomain,
                request.NormalizedEmail,
                cancellationToken)
            .ConfigureAwait(false);

        return isRecoveryAdmin ? AuthSignInRoutingBypassKind.RecoveryAdmin : AuthSignInRoutingBypassKind.None;
    }

    public async Task<bool> HasActivePlatformRecoveryGrantAsync(
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        PlatformTenantAuthRecoveryGrantRecord? grant =
            await _platformRecoveryGrants
                .GetActiveByTenantAndDomainAsync(tenantId, normalizedDomain, _timeProvider.GetUtcNow(), cancellationToken)
                .ConfigureAwait(false);

        return grant is not null;
    }

    private async Task<bool> HasValidInvitationRecoveryAsync(
        string normalizedEmail,
        string? invitationToken,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(invitationToken))
        {
            byte[] tokenHash = EmailOtpInvitationTokenHasher.Hash(invitationToken);

            UserInvitationRecord? invitation =
                await _invitations.GetPendingByTokenHashAsync(tokenHash, cancellationToken).ConfigureAwait(false);

            if (invitation is not null
                && invitation.TenantId == tenantId
                && invitation.ExpiresUtc > _timeProvider.GetUtcNow()
                && InvitationEmailMatches(normalizedEmail, invitation.Email))
            {
                return true;
            }
        }

        UserInvitationRecord? pending =
            await _invitations.GetPendingByEmailAsync(tenantId, normalizedEmail, cancellationToken)
                .ConfigureAwait(false);

        return pending is not null && pending.ExpiresUtc > _timeProvider.GetUtcNow();
    }

    private static bool InvitationEmailMatches(string normalizedEmail, string invitationEmail)
    {
        if (!IdentityEmailNormalizer.TryNormalize(invitationEmail, out string normalizedInviteeEmail, out _))
        {
            return false;
        }

        return string.Equals(normalizedInviteeEmail, normalizedEmail, StringComparison.Ordinal);
    }
}
