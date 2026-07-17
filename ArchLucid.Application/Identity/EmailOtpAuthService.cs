using System.Text.Json;

using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Identity;

public enum EmailOtpAuthNextStep
{
    SelectWorkspace = 0,
    AcceptInvitation = 1,
    CreateWorkspace = 2,
    Complete = 3
}

public sealed class EmailOtpChallengeRequest
{
    public string Email
    {
        get;
        init;
    } = string.Empty;

    public string? InvitationToken
    {
        get;
        init;
    }

    public string? ClientIp
    {
        get;
        init;
    }

    public string? UserAgent
    {
        get;
        init;
    }
}

public sealed class EmailOtpChallengeRequestResult
{
    public string Message
    {
        get;
        init;
    } = "If that address can receive email, we sent a sign-in code.";

    public Guid? ChallengeId
    {
        get;
        init;
    }

    public bool SsoRequired
    {
        get;
        init;
    }

    public string? SsoMessage
    {
        get;
        init;
    }
}

public sealed class EmailOtpVerifyRequest
{
    public Guid ChallengeId
    {
        get;
        init;
    }

    public string Code
    {
        get;
        init;
    } = string.Empty;

    public string? InvitationToken
    {
        get;
        init;
    }
}

public sealed class EmailOtpVerifyResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public Guid? PlatformUserId
    {
        get;
        init;
    }

    public string? DisplayEmail
    {
        get;
        init;
    }

    public string Role
    {
        get;
        init;
    } = ArchLucidRoles.Reader;

    public EmailOtpAuthNextStep NextStep
    {
        get;
        init;
    }

    public Guid? TenantId
    {
        get;
        init;
    }

    public Guid? WorkspaceId
    {
        get;
        init;
    }

    public Guid? InvitationId
    {
        get;
        init;
    }

    public string FailureMessage
    {
        get;
        init;
    } = "Invalid or expired sign-in code.";
}

public interface IEmailOtpAuthService
{
    Task<EmailOtpChallengeRequestResult> RequestCodeAsync(
        EmailOtpChallengeRequest request,
        CancellationToken cancellationToken);

    Task<EmailOtpVerifyResult> VerifyCodeAsync(
        EmailOtpVerifyRequest request,
        CancellationToken cancellationToken);
}

public sealed class EmailOtpAuthService(
    IOptions<EmailOtpAuthOptions> options,
    IEmailOtpChallengeRepository challenges,
    IEmailOtpSignInDomainPolicyService domainPolicy,
    IEmailOtpEmailNotifier emailNotifier,
    IPlatformIdentityService platformIdentity,
    IAuthenticationIdentityRepository authenticationIdentities,
    IWorkspaceMembershipRepository memberships,
    IUserInvitationRepository invitations,
    IAuditService auditService,
    TimeProvider timeProvider) : IEmailOtpAuthService
{
    private const string NeutralSentMessage = "If that address can receive email, we sent a sign-in code.";

    private readonly EmailOtpAuthOptions _options =
        options?.Value ?? throw new ArgumentNullException(nameof(options));

    private readonly IEmailOtpChallengeRepository _challenges =
        challenges ?? throw new ArgumentNullException(nameof(challenges));

    private readonly IEmailOtpSignInDomainPolicyService _domainPolicy =
        domainPolicy ?? throw new ArgumentNullException(nameof(domainPolicy));

    private readonly IEmailOtpEmailNotifier _emailNotifier =
        emailNotifier ?? throw new ArgumentNullException(nameof(emailNotifier));

    private readonly IPlatformIdentityService _platformIdentity =
        platformIdentity ?? throw new ArgumentNullException(nameof(platformIdentity));

    private readonly IAuthenticationIdentityRepository _authenticationIdentities =
        authenticationIdentities ?? throw new ArgumentNullException(nameof(authenticationIdentities));

    private readonly IWorkspaceMembershipRepository _memberships =
        memberships ?? throw new ArgumentNullException(nameof(memberships));

    private readonly IUserInvitationRepository _invitations =
        invitations ?? throw new ArgumentNullException(nameof(invitations));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<EmailOtpChallengeRequestResult> RequestCodeAsync(
        EmailOtpChallengeRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!_options.Enabled)
        {
            return NeutralResult();
        }

        if (!IdentityEmailNormalizer.TryNormalize(request.Email, out string normalizedEmail, out string displayEmail))
        {
            return NeutralResult();
        }

        string emailCorrelation = EmailOtpCorrelationFingerprint.ComputeHexPrefix(normalizedEmail);

        await _auditService.LogAsync(
            BuildAudit(
                AuditEventTypes.EmailOtpCodeRequested,
                emailCorrelation,
                new { emailCorrelation }),
            cancellationToken).ConfigureAwait(false);

        EmailOtpSignInDomainEvaluation domainEvaluation =
            await _domainPolicy.EvaluateAsync(normalizedEmail, request.InvitationToken, cancellationToken)
                .ConfigureAwait(false);

        if (domainEvaluation.Decision == EmailOtpSignInDomainDecision.RequireEnterpriseSso)
        {
            await _auditService.LogAsync(
                BuildAudit(
                    AuditEventTypes.EmailOtpSsoRedirectRequired,
                    emailCorrelation,
                    new { emailCorrelation }),
                cancellationToken).ConfigureAwait(false);

            return new EmailOtpChallengeRequestResult
            {
                Message = domainEvaluation.CustomerMessage,
                SsoRequired = true,
                SsoMessage = domainEvaluation.CustomerMessage
            };
        }

        DateTimeOffset now = _timeProvider.GetUtcNow();

        if (await IsRateLimitedForRequestAsync(normalizedEmail, request.ClientIp, now, emailCorrelation, cancellationToken)
                .ConfigureAwait(false))
        {
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

        if (sent)
        {
            await _auditService.LogAsync(
                BuildAudit(
                    AuditEventTypes.EmailOtpCodeSent,
                    emailCorrelation,
                    new { emailCorrelation, challengeId }),
                cancellationToken).ConfigureAwait(false);
        }
        else
        {
            await _auditService.LogAsync(
                BuildAudit(
                    AuditEventTypes.EmailOtpSuspiciousBehaviorDetected,
                    emailCorrelation,
                    new { emailCorrelation, reason = "email_delivery_failed" }),
                cancellationToken).ConfigureAwait(false);
        }

        return new EmailOtpChallengeRequestResult
        {
            Message = NeutralSentMessage,
            ChallengeId = challengeId
        };
    }

    public async Task<EmailOtpVerifyResult> VerifyCodeAsync(
        EmailOtpVerifyRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!_options.Enabled || request.ChallengeId == Guid.Empty || string.IsNullOrWhiteSpace(request.Code))
        {
            return Failed();
        }

        EmailOtpChallengeRecord? challenge =
            await _challenges.GetByIdAsync(request.ChallengeId, cancellationToken).ConfigureAwait(false);

        if (challenge is null)
        {
            return await FailWithAuditAsync("unknown_challenge", null, cancellationToken).ConfigureAwait(false);
        }

        EmailOtpSignInDomainEvaluation verifyDomainEvaluation =
            await _domainPolicy.EvaluateAsync(challenge.NormalizedEmail, request.InvitationToken, cancellationToken)
                .ConfigureAwait(false);

        if (verifyDomainEvaluation.Decision == EmailOtpSignInDomainDecision.RequireEnterpriseSso)
        {
            return await FailWithAuditAsync("sso_required", emailCorrelation: null, cancellationToken)
                .ConfigureAwait(false);
        }

        string emailCorrelation = EmailOtpCorrelationFingerprint.ComputeHexPrefix(challenge.NormalizedEmail);
        DateTimeOffset now = _timeProvider.GetUtcNow();
        DateTimeOffset since = now.AddHours(-1);

        int recentFailures =
            await _challenges.CountRecentFailedVerificationsByEmailAsync(challenge.NormalizedEmail, since, cancellationToken)
                .ConfigureAwait(false);

        if (recentFailures >= _options.MaxVerificationAttemptsPerEmailPerHour)
        {
            await _auditService.LogAsync(
                BuildAudit(
                    AuditEventTypes.EmailOtpRateLimitTriggered,
                    emailCorrelation,
                    new { emailCorrelation, scope = "email_verification_hourly" }),
                cancellationToken).ConfigureAwait(false);

            return Failed();
        }

        string codeHash = EmailOtpCodeHasher.Hash(request.ChallengeId, request.Code, _options.HashPepper);

        EmailOtpChallengeCompletionOutcome completion =
            await _challenges.TryCompleteAsync(
                request.ChallengeId,
                codeHash,
                now,
                _options.MaxVerificationAttemptsPerChallenge,
                cancellationToken).ConfigureAwait(false);

        if (completion.Result != EmailOtpChallengeCompletionResult.Completed || completion.Challenge is null)
        {
            string reason = completion.Result switch
            {
                EmailOtpChallengeCompletionResult.Expired => "expired",
                EmailOtpChallengeCompletionResult.TooManyAttempts => "too_many_attempts",
                EmailOtpChallengeCompletionResult.AlreadyCompleted => "reused",
                EmailOtpChallengeCompletionResult.InvalidCode => "invalid_code",
                _ => "invalid"
            };

            return await FailWithAuditAsync(reason, emailCorrelation, cancellationToken).ConfigureAwait(false);
        }

        IdentityEmailNormalizer.TryNormalize(
            completion.Challenge.NormalizedEmail,
            out string normalizedEmail,
            out string displayEmail);

        ExternalIdentityKey identityKey = BuildEmailOtpIdentityKey(normalizedEmail);

        PlatformUserRecord? user =
            await _platformIdentity.FindUserByExternalIdentityAsync(identityKey, cancellationToken).ConfigureAwait(false);

        bool createdUser = false;

        if (user is null)
        {
            user = await _platformIdentity.CreateUserFromVerifiedIdentityAsync(
                new VerifiedExternalIdentityCreateRequest
                {
                    ExternalKey = identityKey,
                    DisplayEmail = displayEmail,
                    EmailVerified = true,
                    DisplayName = displayEmail,
                    ActorId = $"email-otp:{emailCorrelation}"
                },
                cancellationToken).ConfigureAwait(false);

            createdUser = true;
        }

        IReadOnlyList<AuthenticationIdentityRecord> identities =
            await _platformIdentity.GetIdentitiesForUserAsync(user.Id, cancellationToken).ConfigureAwait(false);

        AuthenticationIdentityRecord? emailIdentity = identities.FirstOrDefault(row =>
            row.ProviderType == AuthenticationProviderType.EmailOneTimeCode && row.DisabledUtc is null);

        if (emailIdentity is not null)
        {
            await _authenticationIdentities.RecordAuthenticationAsync(emailIdentity.Id, now, cancellationToken)
                .ConfigureAwait(false);
        }

        Guid? acceptedInvitationId =
            await TryAcceptInvitationAsync(
                user.Id,
                normalizedEmail,
                completion.Challenge.InvitationId,
                request.InvitationToken,
                cancellationToken).ConfigureAwait(false);

        (EmailOtpAuthNextStep nextStep, Guid? tenantId, Guid? workspaceId, Guid? invitationId) =
            await ResolveNextStepAsync(user.Id, normalizedEmail, acceptedInvitationId, cancellationToken)
                .ConfigureAwait(false);

        await _auditService.LogAsync(
            BuildAudit(
                AuditEventTypes.EmailOtpVerificationSucceeded,
                emailCorrelation,
                new
                {
                    emailCorrelation,
                    userId = user.Id,
                    createdUser,
                    nextStep = nextStep.ToString()
                }),
            cancellationToken).ConfigureAwait(false);

        return new EmailOtpVerifyResult
        {
            Succeeded = true,
            PlatformUserId = user.Id,
            DisplayEmail = displayEmail,
            Role = ArchLucidRoles.Reader,
            NextStep = nextStep,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            InvitationId = invitationId
        };
    }

    private async Task<bool> IsRateLimitedForRequestAsync(
        string normalizedEmail,
        string? clientIp,
        DateTimeOffset now,
        string emailCorrelation,
        CancellationToken cancellationToken)
    {
        DateTimeOffset since = now.AddHours(-1);

        int emailCount =
            await _challenges.CountRecentRequestsByEmailAsync(normalizedEmail, since, cancellationToken)
                .ConfigureAwait(false);

        if (emailCount >= _options.MaxCodeRequestsPerEmailPerHour)
        {
            await LogRateLimitAsync(emailCorrelation, "email_request_hourly", cancellationToken).ConfigureAwait(false);

            return true;
        }

        string? clientIpHash = EmailOtpRequestMetadataHasher.HashOptional(clientIp);

        if (clientIpHash is null)
        {
            return false;
        }

        int ipCount =
            await _challenges.CountRecentRequestsByClientIpHashAsync(clientIpHash, since, cancellationToken)
                .ConfigureAwait(false);

        if (ipCount >= _options.MaxCodeRequestsPerIpPerHour)
        {
            await LogRateLimitAsync(emailCorrelation, "ip_request_hourly", cancellationToken).ConfigureAwait(false);

            return true;
        }

        return false;
    }

    private async Task LogRateLimitAsync(string emailCorrelation, string scope, CancellationToken cancellationToken)
    {
        await _auditService.LogAsync(
            BuildAudit(
                AuditEventTypes.EmailOtpRateLimitTriggered,
                emailCorrelation,
                new { emailCorrelation, scope }),
            cancellationToken).ConfigureAwait(false);
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
            || !string.Equals(invitation.Email, normalizedEmail, StringComparison.Ordinal)
            || invitation.ExpiresUtc <= _timeProvider.GetUtcNow())
        {
            return null;
        }

        return invitation.Id;
    }

    private async Task<Guid?> TryAcceptInvitationAsync(
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
            || !string.Equals(invitation.Email, normalizedEmail, StringComparison.Ordinal)
            || invitation.ExpiresUtc <= _timeProvider.GetUtcNow())
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

        await _auditService.LogAsync(
            BuildAudit(
                AuditEventTypes.AdminUserInvitationAccepted,
                $"invitation:{invitation.Id:D}",
                new
                {
                    invitationId = invitation.Id,
                    tenantId = invitation.TenantId,
                    workspaceId = invitation.WorkspaceId,
                    userId = platformUserId
                },
                invitation.TenantId),
            cancellationToken).ConfigureAwait(false);

        return invitation.Id;
    }

    private async Task<UserInvitationRecord?> FindInvitationByIdAsync(
        Guid invitationId,
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<UserInvitationRecord> pending =
            await _invitations.ListPendingByNormalizedEmailAsync(normalizedEmail, cancellationToken).ConfigureAwait(false);

        return pending.FirstOrDefault(row => row.Id == invitationId);
    }

    private async Task<(EmailOtpAuthNextStep NextStep, Guid? TenantId, Guid? WorkspaceId, Guid? InvitationId)>
        ResolveNextStepAsync(
            Guid platformUserId,
            string normalizedEmail,
            Guid? acceptedInvitationId,
            CancellationToken cancellationToken)
    {
        IReadOnlyList<WorkspaceMembershipRecord> memberships =
            await _memberships.ListByUserIdAsync(platformUserId, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<WorkspaceMembershipRecord> activeMemberships =
            memberships.Where(row => row.Status == WorkspaceMembershipStatus.Active).ToList();

        if (acceptedInvitationId is Guid invitationId && activeMemberships.Count > 0)
        {
            WorkspaceMembershipRecord membership = activeMemberships[^1];

            return (EmailOtpAuthNextStep.Complete, membership.TenantId, membership.WorkspaceId, invitationId);
        }

        if (activeMemberships.Count == 1)
        {
            WorkspaceMembershipRecord only = activeMemberships[0];

            return (EmailOtpAuthNextStep.Complete, only.TenantId, only.WorkspaceId, null);
        }

        if (activeMemberships.Count > 1)
        {
            return (EmailOtpAuthNextStep.SelectWorkspace, null, null, null);
        }

        IReadOnlyList<UserInvitationRecord> openInvitations =
            await _invitations.ListPendingByNormalizedEmailAsync(normalizedEmail, cancellationToken).ConfigureAwait(false);

        if (openInvitations.Count > 0)
        {
            UserInvitationRecord first = openInvitations[0];

            return (EmailOtpAuthNextStep.AcceptInvitation, first.TenantId, first.WorkspaceId, first.Id);
        }

        return (EmailOtpAuthNextStep.CreateWorkspace, null, null, null);
    }

    private async Task<EmailOtpVerifyResult> FailWithAuditAsync(
        string reason,
        string? emailCorrelation,
        CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(emailCorrelation))
        {
            await _auditService.LogAsync(
                BuildAudit(
                    AuditEventTypes.EmailOtpVerificationFailed,
                    emailCorrelation,
                    new { emailCorrelation, reason }),
                cancellationToken).ConfigureAwait(false);
        }

        return Failed();
    }

    private static ExternalIdentityKey BuildEmailOtpIdentityKey(string normalizedEmail) =>
        new()
        {
            ProviderType = AuthenticationProviderType.EmailOneTimeCode,
            NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.EmailOneTimeCode),
            Subject = normalizedEmail
        };

    private static EmailOtpChallengeRequestResult NeutralResult() =>
        new() { Message = NeutralSentMessage };

    private static EmailOtpVerifyResult Failed() =>
        new() { Succeeded = false };

    private static AuditEvent BuildAudit(string eventType, string actorId, object payload, Guid? tenantId = null) =>
        new()
        {
            EventType = eventType,
            ActorUserId = actorId,
            ActorUserName = actorId,
            ExplicitActor = true,
            TenantId = tenantId ?? Guid.Empty,
            DataJson = JsonSerializer.Serialize(payload)
        };
}
