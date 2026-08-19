using ArchLucid.Core.Admin;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public enum AuthSignInRoutingDecision
{
    AllowEmailCode = 0,
    RequireEnterpriseSso = 1
}

public sealed class AuthSignInRoutingEvaluation
{
    public AuthSignInRoutingDecision Decision
    {
        get;
        init;
    }

    public bool AllowEmailCode => Decision == AuthSignInRoutingDecision.AllowEmailCode;

    public bool SsoRequired => Decision == AuthSignInRoutingDecision.RequireEnterpriseSso;

    public string CustomerMessage
    {
        get;
        init;
    } = string.Empty;

    public string? SafeReturnPath
    {
        get;
        init;
    }

    public AuthSignInRoutingBypassKind BypassKind
    {
        get;
        init;
    }
}

public sealed class AuthSignInRoutingRequest
{
    public string NormalizedEmail
    {
        get;
        init;
    } = string.Empty;

    public string? InvitationToken
    {
        get;
        init;
    }

    public string? ReturnPath
    {
        get;
        init;
    }
}

public interface IAuthSignInRoutingService
{
    Task<AuthSignInRoutingEvaluation> EvaluateAsync(
        AuthSignInRoutingRequest request,
        CancellationToken cancellationToken);

    Task<AuthSignInRoutingEvaluation> EvaluateEnforcementPreviewAsync(
        AuthSignInRoutingRequest request,
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken);
}

public sealed class AuthSignInRoutingService(
    ITenantSignInEmailDomainRepository signInDomains,
    ITenantSignInEmailDomainRecoveryAdminRepository recoveryAdmins,
    ITenantIdentityProviderConfigurationRepository identityProviders,
    IUserInvitationRepository invitations,
    IPlatformTenantAuthRecoveryGrantRepository platformRecoveryGrants,
    TimeProvider timeProvider) : IAuthSignInRoutingService
{
    private const string SsoRequiredMessage =
        "This email domain uses your organization's identity provider. Continue sign-in through your organization's SSO portal.";

    private readonly ITenantSignInEmailDomainRepository _signInDomains =
        signInDomains ?? throw new ArgumentNullException(nameof(signInDomains));

    private readonly ITenantSignInEmailDomainRecoveryAdminRepository _recoveryAdmins =
        recoveryAdmins ?? throw new ArgumentNullException(nameof(recoveryAdmins));

    private readonly ITenantIdentityProviderConfigurationRepository _identityProviders =
        identityProviders ?? throw new ArgumentNullException(nameof(identityProviders));

    private readonly IUserInvitationRepository _invitations =
        invitations ?? throw new ArgumentNullException(nameof(invitations));

    private readonly IPlatformTenantAuthRecoveryGrantRepository _platformRecoveryGrants =
        platformRecoveryGrants ?? throw new ArgumentNullException(nameof(platformRecoveryGrants));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<AuthSignInRoutingEvaluation> EvaluateAsync(
        AuthSignInRoutingRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.NormalizedEmail);

        string? safeReturnPath = AuthSignInReturnPathGuard.TryNormalize(request.ReturnPath);
        string? domain = ExtractDomain(request.NormalizedEmail);

        if (domain is null)
        {
            return Allow(safeReturnPath);
        }

        TenantSignInEmailDomainRecord? policy =
            await _signInDomains.FindByNormalizedDomainAsync(domain, cancellationToken).ConfigureAwait(false);

        if (policy is null || policy.VerificationStatus != AuthDomainVerificationStatus.Verified || !policy.IsEnforcementActive)
        {
            return Allow(safeReturnPath);
        }

        AuthSignInRoutingBypassKind bypassKind =
            await ResolveBypassKindAsync(request, policy, cancellationToken).ConfigureAwait(false);

        if (bypassKind != AuthSignInRoutingBypassKind.None)
        {
            return Allow(safeReturnPath, bypassKind);
        }

        if (await HasActivePlatformRecoveryGrantAsync(policy.TenantId, policy.NormalizedDomain, cancellationToken)
                .ConfigureAwait(false))
        {
            return Allow(safeReturnPath, AuthSignInRoutingBypassKind.PlatformGrant);
        }

        TenantIdentityProviderConfigurationRecord? idp =
            await _identityProviders.TryGetAsync(policy.TenantId, cancellationToken).ConfigureAwait(false);

        if (idp is null || !idp.IsActive)
        {
            return new AuthSignInRoutingEvaluation
            {
                Decision = AuthSignInRoutingDecision.RequireEnterpriseSso,
                CustomerMessage = SsoRequiredMessage,
                SafeReturnPath = safeReturnPath
            };
        }

        return new AuthSignInRoutingEvaluation
        {
            Decision = AuthSignInRoutingDecision.RequireEnterpriseSso,
            CustomerMessage = SsoRequiredMessage,
            SafeReturnPath = safeReturnPath
        };
    }

    public async Task<AuthSignInRoutingEvaluation> EvaluateEnforcementPreviewAsync(
        AuthSignInRoutingRequest request,
        Guid tenantId,
        string normalizedDomain,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(request.NormalizedEmail);

        string? safeReturnPath = AuthSignInReturnPathGuard.TryNormalize(request.ReturnPath);
        TenantSignInEmailDomainRecord? policy =
            await _signInDomains.TryGetAsync(tenantId, normalizedDomain, cancellationToken).ConfigureAwait(false);

        if (policy is null || policy.VerificationStatus != AuthDomainVerificationStatus.Verified)
        {
            return Allow(safeReturnPath);
        }

        if (policy.EnforcementMode == AuthDomainEnforcementMode.SsoOptional)
        {
            return Allow(safeReturnPath);
        }

        AuthSignInRoutingBypassKind bypassKind =
            await ResolveBypassKindAsync(request, policy, cancellationToken).ConfigureAwait(false);

        if (bypassKind != AuthSignInRoutingBypassKind.None)
        {
            return Allow(safeReturnPath, bypassKind);
        }

        if (await HasActivePlatformRecoveryGrantAsync(policy.TenantId, policy.NormalizedDomain, cancellationToken)
                .ConfigureAwait(false))
        {
            return Allow(safeReturnPath, AuthSignInRoutingBypassKind.PlatformGrant);
        }

        TenantIdentityProviderConfigurationRecord? idp =
            await _identityProviders.TryGetAsync(policy.TenantId, cancellationToken).ConfigureAwait(false);

        if (idp is null || !idp.IsActive)
        {
            return new AuthSignInRoutingEvaluation
            {
                Decision = AuthSignInRoutingDecision.RequireEnterpriseSso,
                CustomerMessage = SsoRequiredMessage,
                SafeReturnPath = safeReturnPath
            };
        }

        return new AuthSignInRoutingEvaluation
        {
            Decision = AuthSignInRoutingDecision.RequireEnterpriseSso,
            CustomerMessage = SsoRequiredMessage,
            SafeReturnPath = safeReturnPath
        };
    }

    private async Task<AuthSignInRoutingBypassKind> ResolveBypassKindAsync(
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

    private async Task<bool> HasActivePlatformRecoveryGrantAsync(
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

    private static AuthSignInRoutingEvaluation Allow(
        string? safeReturnPath,
        AuthSignInRoutingBypassKind bypassKind = AuthSignInRoutingBypassKind.None) =>
        new()
        {
            Decision = AuthSignInRoutingDecision.AllowEmailCode,
            SafeReturnPath = safeReturnPath,
            BypassKind = bypassKind
        };

    private static string? ExtractDomain(string normalizedEmail)
    {
        int at = normalizedEmail.LastIndexOf('@');

        if (at < 0 || at >= normalizedEmail.Length - 1)
        {
            return null;
        }

        return normalizedEmail[(at + 1)..];
    }
}
