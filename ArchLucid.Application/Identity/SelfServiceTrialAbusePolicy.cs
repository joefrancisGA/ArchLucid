using ArchLucid.Core.Admin;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Identity;

public interface ISelfServiceTrialAbusePolicy
{
    Task<SelfServiceTrialAbuseEvaluation> EvaluateAsync(
        SelfServiceTrialAbuseEvaluationRequest request,
        CancellationToken cancellationToken);

    Task RecordSuccessfulClaimAsync(
        string normalizedEmail,
        Guid? platformUserId,
        Guid? tenantId,
        string claimSource,
        CancellationToken cancellationToken);
}

public sealed class SelfServiceTrialAbusePolicy(
    IOptions<SelfServiceAbuseOptions> options,
    IOptions<PublicSignupOptions> publicSignupOptions,
    ISelfServiceTrialAbuseRepository repository,
    IUserInvitationRepository invitations,
    TimeProvider timeProvider) : ISelfServiceTrialAbusePolicy
{
    private const string InviteOnlyMessage =
        "Registration is by invitation. Request access to join an evaluation workspace.";

    private const string EmailCapMessage =
        "This email address already started an evaluation workspace. Sign in to continue or request access for another organization.";

    private const string DomainVelocityMessage =
        "Too many evaluation workspaces were recently created for this email domain. Try again later or request access.";

    private readonly SelfServiceAbuseOptions _options =
        options?.Value ?? throw new ArgumentNullException(nameof(options));

    private readonly PublicSignupOptions _publicSignupOptions =
        publicSignupOptions?.Value ?? throw new ArgumentNullException(nameof(publicSignupOptions));

    private readonly ISelfServiceTrialAbuseRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    private readonly IUserInvitationRepository _invitations =
        invitations ?? throw new ArgumentNullException(nameof(invitations));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<SelfServiceTrialAbuseEvaluation> EvaluateAsync(
        SelfServiceTrialAbuseEvaluationRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (_publicSignupOptions.IsInviteOnly() && !await HasValidInvitationBypassAsync(request, cancellationToken).ConfigureAwait(false))
        {
            return SelfServiceTrialAbuseEvaluation.Deny("invite_only", InviteOnlyMessage);
        }

        if (!_options.Enabled)
        {
            return SelfServiceTrialAbuseEvaluation.Allow();
        }

        if (await HasValidInvitationBypassAsync(request, cancellationToken).ConfigureAwait(false))
        {
            return SelfServiceTrialAbuseEvaluation.Allow();
        }

        if (string.IsNullOrWhiteSpace(request.NormalizedEmail))
        {
            return SelfServiceTrialAbuseEvaluation.Deny("invalid_email", InviteOnlyMessage);
        }

        if (await _repository.HasEmailClaimAsync(request.NormalizedEmail, cancellationToken).ConfigureAwait(false))
        {
            return SelfServiceTrialAbuseEvaluation.Deny("email_lifetime_cap", EmailCapMessage);
        }

        string? domain = ExtractDomain(request.NormalizedEmail);

        if (domain is not null)
        {
            DateTimeOffset since = _timeProvider.GetUtcNow().AddHours(-_options.DomainVelocityWindowHours);

            int domainCount =
                await _repository.CountDomainClaimsSinceAsync(domain, since, cancellationToken).ConfigureAwait(false);

            if (domainCount >= _options.MaxTrialsPerDomainPerWindow)
            {
                return SelfServiceTrialAbuseEvaluation.Deny("domain_velocity", DomainVelocityMessage);
            }
        }

        return SelfServiceTrialAbuseEvaluation.Allow();
    }

    public async Task RecordSuccessfulClaimAsync(
        string normalizedEmail,
        Guid? platformUserId,
        Guid? tenantId,
        string claimSource,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return;
        }

        // Callers should pass IdentityEmailNormalizer output; re-normalize so mixed-case slips still key Ordinal lookups.

        if (!IdentityEmailNormalizer.TryNormalize(normalizedEmail, out string emailKey, out _))
        {
            return;
        }

        DateTimeOffset now = _timeProvider.GetUtcNow();

        await _repository.TryInsertEmailClaimAsync(
            new SelfServiceTrialEmailClaimInsert
            {
                NormalizedEmail = emailKey,
                PlatformUserId = platformUserId,
                TenantId = tenantId,
                ClaimSource = claimSource,
                ClaimedUtc = now
            },
            cancellationToken).ConfigureAwait(false);

        string? domain = ExtractDomain(emailKey);

        if (domain is not null)
        {
            await _repository.InsertDomainClaimAsync(domain, now, cancellationToken).ConfigureAwait(false);
        }
    }

    private async Task<bool> HasValidInvitationBypassAsync(
        SelfServiceTrialAbuseEvaluationRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.InvitationToken))
        {
            return false;
        }

        byte[] tokenHash = EmailOtpInvitationTokenHasher.Hash(request.InvitationToken);

        UserInvitationRecord? invitation =
            await _invitations.GetPendingByTokenHashAsync(tokenHash, cancellationToken).ConfigureAwait(false);

        if (invitation is null || invitation.ExpiresUtc <= _timeProvider.GetUtcNow())
        {
            return false;
        }

        if (!IdentityEmailNormalizer.TryNormalize(invitation.Email, out string normalizedInviteeEmail, out _))
        {
            return false;
        }

        if (!string.Equals(normalizedInviteeEmail, request.NormalizedEmail, StringComparison.Ordinal))
        {
            return false;
        }

        return true;
    }

    private static string? ExtractDomain(string normalizedEmail)
    {
        int at = normalizedEmail.LastIndexOf('@');

        if (at < 0 || at >= normalizedEmail.Length - 1)
        {
            return null;
        }

        return normalizedEmail[(at + 1)..].ToLowerInvariant();
    }
}
