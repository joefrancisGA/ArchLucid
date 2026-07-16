using ArchLucid.Core.Admin;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public enum EmailOtpSignInDomainDecision
{
    AllowEmailOtp = 0,
    RequireEnterpriseSso = 1
}

public sealed class EmailOtpSignInDomainEvaluation
{
    public EmailOtpSignInDomainDecision Decision
    {
        get;
        init;
    }

    public string CustomerMessage
    {
        get;
        init;
    } = string.Empty;
}

public interface IEmailOtpSignInDomainPolicyService
{
    Task<EmailOtpSignInDomainEvaluation> EvaluateAsync(
        string normalizedEmail,
        string? invitationToken,
        CancellationToken cancellationToken);
}

public sealed class EmailOtpSignInDomainPolicyService(
    ITenantSignInEmailDomainRepository signInDomains,
    ITenantIdentityProviderConfigurationRepository identityProviders,
    IUserInvitationRepository invitations,
    TimeProvider timeProvider) : IEmailOtpSignInDomainPolicyService
{
    private const string SsoRequiredMessage =
        "This email domain uses your organization's identity provider. Continue sign-in through your organization's SSO portal.";

    private readonly ITenantSignInEmailDomainRepository _signInDomains =
        signInDomains ?? throw new ArgumentNullException(nameof(signInDomains));

    private readonly ITenantIdentityProviderConfigurationRepository _identityProviders =
        identityProviders ?? throw new ArgumentNullException(nameof(identityProviders));

    private readonly IUserInvitationRepository _invitations =
        invitations ?? throw new ArgumentNullException(nameof(invitations));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<EmailOtpSignInDomainEvaluation> EvaluateAsync(
        string normalizedEmail,
        string? invitationToken,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedEmail);

        string? domain = ExtractDomain(normalizedEmail);

        if (domain is null)
        {
            return Allow();
        }

        TenantSignInEmailDomainRecord? policy =
            await _signInDomains.FindByNormalizedDomainAsync(domain, cancellationToken).ConfigureAwait(false);

        if (policy is null || !policy.RequireEnterpriseSso)
        {
            return Allow();
        }

        if (policy.AllowEmailOtpRecovery)
        {
            return Allow();
        }

        if (await HasValidInvitationRecoveryAsync(normalizedEmail, invitationToken, policy.TenantId, cancellationToken)
                .ConfigureAwait(false))
        {
            return Allow();
        }

        TenantIdentityProviderConfigurationRecord? idp =
            await _identityProviders.TryGetAsync(policy.TenantId, cancellationToken).ConfigureAwait(false);

        if (idp is null || !idp.IsActive)
        {
            return Allow();
        }

        return new EmailOtpSignInDomainEvaluation
        {
            Decision = EmailOtpSignInDomainDecision.RequireEnterpriseSso,
            CustomerMessage = SsoRequiredMessage
        };
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
                && string.Equals(invitation.Email, normalizedEmail, StringComparison.Ordinal)
                && invitation.ExpiresUtc > _timeProvider.GetUtcNow())
            {
                return true;
            }
        }

        UserInvitationRecord? pending =
            await _invitations.GetPendingByEmailAsync(tenantId, normalizedEmail, cancellationToken)
                .ConfigureAwait(false);

        return pending is not null && pending.ExpiresUtc > _timeProvider.GetUtcNow();
    }

    private static EmailOtpSignInDomainEvaluation Allow() =>
        new() { Decision = EmailOtpSignInDomainDecision.AllowEmailOtp };

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
