using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

/// <summary>
///     Handles email OTP challenge request: domain policy, rate limits, challenge creation, and delivery.
/// </summary>
public sealed class EmailOtpRequestFlow(
    EmailOtpAuthOptions options,
    IEmailOtpChallengeRepository challenges,
    IEmailOtpSignInDomainPolicyService domainPolicy,
    IEmailOtpEmailNotifier emailNotifier,
    IUserInvitationRepository invitations,
    IEmailOtpBotChallengeVerifier botChallengeVerifier,
    IAuditService auditService,
    TimeProvider timeProvider)
{
    private const string NeutralSentMessage = "If that address can receive email, we sent a sign-in code.";

    private readonly EmailOtpAuthOptions _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly IEmailOtpChallengeRepository _challenges =
        challenges ?? throw new ArgumentNullException(nameof(challenges));

    private readonly IEmailOtpSignInDomainPolicyService _domainPolicy =
        domainPolicy ?? throw new ArgumentNullException(nameof(domainPolicy));

    private readonly IEmailOtpEmailNotifier _emailNotifier =
        emailNotifier ?? throw new ArgumentNullException(nameof(emailNotifier));

    private readonly IUserInvitationRepository _invitations =
        invitations ?? throw new ArgumentNullException(nameof(invitations));

    private readonly IEmailOtpBotChallengeVerifier _botChallengeVerifier =
        botChallengeVerifier ?? throw new ArgumentNullException(nameof(botChallengeVerifier));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<EmailOtpChallengeRequestResult> ExecuteAsync(
        EmailOtpChallengeRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!_options.Enabled)
        {
            ArchLucidInstrumentation.RecordEmailOtpChallengeRequested("disabled");

            return NeutralResult();
        }

        if (!IdentityEmailNormalizer.TryNormalize(request.Email, out string normalizedEmail, out string displayEmail))
        {
            ArchLucidInstrumentation.RecordEmailOtpChallengeRequested("invalid_email");

            return NeutralResult();
        }

        string emailCorrelation = EmailOtpCorrelationFingerprint.ComputeHexPrefix(normalizedEmail);

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.EmailOtpCodeRequested,
                emailCorrelation,
                new { emailCorrelation },
                cancellationToken)
            .ConfigureAwait(false);

        EmailOtpSignInDomainEvaluation domainEvaluation =
            await _domainPolicy.EvaluateAsync(normalizedEmail, request.InvitationToken, cancellationToken)
                .ConfigureAwait(false);

        if (domainEvaluation.Decision == EmailOtpSignInDomainDecision.RequireEnterpriseSso)
        {
            await AuthAuditEmitter.LogIdentityEventAsync(
                    _auditService,
                    AuditEventTypes.EmailOtpSsoRedirectRequired,
                    emailCorrelation,
                    new { emailCorrelation },
                    cancellationToken)
                .ConfigureAwait(false);

            ArchLucidInstrumentation.RecordEmailOtpChallengeRequested("sso_required");

            return new EmailOtpChallengeRequestResult
            {
                Message = domainEvaluation.CustomerMessage,
                SsoRequired = true,
                SsoMessage = domainEvaluation.CustomerMessage
            };
        }

        if (domainEvaluation.BypassKind == AuthSignInRoutingBypassKind.RecoveryAdmin
            || domainEvaluation.BypassKind == AuthSignInRoutingBypassKind.PlatformGrant)
        {
            await AuthAuditEmitter.LogIdentityEventAsync(
                    _auditService,
                    AuditEventTypes.AuthDomainRecoveryBypassUsed,
                    emailCorrelation,
                    new
                    {
                        emailCorrelation,
                        bypassKind = domainEvaluation.BypassKind.ToString()
                    },
                    cancellationToken)
                .ConfigureAwait(false);
        }

        DateTimeOffset now = _timeProvider.GetUtcNow();

        if (await AuthRateLimitHelper.IsEmailOtpRequestRateLimitedAsync(
                    _challenges,
                    _options,
                    normalizedEmail,
                    request.ClientIp,
                    now,
                    emailCorrelation,
                    _auditService,
                    cancellationToken)
                .ConfigureAwait(false))
        {
            ArchLucidInstrumentation.RecordEmailOtpChallengeRequested("rate_limited");

            return NeutralResult();
        }

        if (!await _botChallengeVerifier.VerifyAsync(request.BotChallengeToken, cancellationToken).ConfigureAwait(false))
        {
            ArchLucidInstrumentation.RecordEmailOtpChallengeRequested("bot_challenge_failed");

            return NeutralResult();
        }

        DateTimeOffset? latestRequest =
            await _challenges.GetLatestRequestUtcByEmailAsync(normalizedEmail, cancellationToken).ConfigureAwait(false);

        if (latestRequest is DateTimeOffset lastUtc
            && now - lastUtc < TimeSpan.FromSeconds(_options.ResendCooldownSeconds))
        {
            return NeutralResult();
        }

        Guid? invitationId = await ResolveInvitationIdAsync(
                normalizedEmail,
                request.InvitationToken,
                cancellationToken)
            .ConfigureAwait(false);

        Guid challengeId = Guid.NewGuid();
        string rawCode = EmailOtpCodeGenerator.GenerateNumericCode(_options.CodeLength);
        string codeHash = EmailOtpCodeHasher.Hash(challengeId, rawCode, _options.HashPepper);
        DateTimeOffset expiresUtc = now.AddMinutes(_options.CodeLifetimeMinutes);

        await _challenges.InvalidateActiveChallengesForEmailAsync(normalizedEmail, now, cancellationToken)
            .ConfigureAwait(false);

        await _challenges.InsertAsync(
            new EmailOtpChallengeInsert
            {
                Id = challengeId,
                NormalizedEmail = normalizedEmail,
                CodeHash = codeHash,
                ExpiresUtc = expiresUtc,
                ClientIpHash = EmailOtpRequestMetadataHasher.HashOptional(request.ClientIp),
                UserAgentHash = EmailOtpRequestMetadataHasher.HashOptional(request.UserAgent),
                InvitationId = invitationId
            },
            cancellationToken).ConfigureAwait(false);

        bool sent = await _emailNotifier.TrySendSignInCodeAsync(
            displayEmail,
            rawCode,
            _options.CodeLifetimeMinutes,
            cancellationToken).ConfigureAwait(false);

        if (!sent)
        {
            await _challenges.InvalidateActiveChallengesForEmailAsync(normalizedEmail, now, cancellationToken)
                .ConfigureAwait(false);

            ArchLucidInstrumentation.RecordEmailOtpDeliveryFailed();

            await AuthAuditEmitter.LogIdentityEventAsync(
                    _auditService,
                    AuditEventTypes.EmailOtpSuspiciousBehaviorDetected,
                    emailCorrelation,
                    new { emailCorrelation, reason = "email_delivery_failed" },
                    cancellationToken)
                .ConfigureAwait(false);

            ArchLucidInstrumentation.RecordEmailOtpChallengeRequested("delivery_failed");

            return NeutralResult();
        }

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.EmailOtpCodeSent,
                emailCorrelation,
                new { emailCorrelation, challengeId },
                cancellationToken)
            .ConfigureAwait(false);

        ArchLucidInstrumentation.RecordEmailOtpChallengeRequested("accepted");

        return new EmailOtpChallengeRequestResult
        {
            Message = NeutralSentMessage,
            ChallengeId = challengeId,
            EmailDeliverySucceeded = true
        };
    }

    private async Task<Guid?> ResolveInvitationIdAsync(
        string normalizedEmail,
        string? invitationToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(invitationToken))
        {
            return null;
        }

        byte[] tokenHash = EmailOtpInvitationTokenHasher.Hash(invitationToken);

        UserInvitationRecord? invitation =
            await _invitations.GetPendingByTokenHashAsync(tokenHash, cancellationToken).ConfigureAwait(false);

        if (invitation is null
            || invitation.ExpiresUtc <= _timeProvider.GetUtcNow())
        {
            return null;
        }

        if (!IdentityEmailNormalizer.TryNormalize(invitation.Email, out string normalizedInviteeEmail, out _)
            || !string.Equals(normalizedInviteeEmail, normalizedEmail, StringComparison.Ordinal))
        {
            return null;
        }

        return invitation.Id;
    }

    private static EmailOtpChallengeRequestResult NeutralResult() =>
        new() { Message = NeutralSentMessage };
}
