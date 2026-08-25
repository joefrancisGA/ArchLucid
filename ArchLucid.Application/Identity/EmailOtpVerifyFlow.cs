using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

/// <summary>
///     Handles email OTP verification: code validation, identity linking, invitation acceptance, and next-step routing.
/// </summary>
public sealed class EmailOtpVerifyFlow(
    EmailOtpAuthOptions options,
    IEmailOtpChallengeRepository challenges,
    IEmailOtpSignInDomainPolicyService domainPolicy,
    IPlatformIdentityService platformIdentity,
    IAuthenticationIdentityRepository authenticationIdentities,
    IWorkspaceMembershipRepository memberships,
    IUserInvitationRepository invitations,
    IAuditService auditService,
    TimeProvider timeProvider)
{
    private readonly EmailOtpAuthOptions _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly IEmailOtpChallengeRepository _challenges =
        challenges ?? throw new ArgumentNullException(nameof(challenges));

    private readonly IEmailOtpSignInDomainPolicyService _domainPolicy =
        domainPolicy ?? throw new ArgumentNullException(nameof(domainPolicy));

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

    public async Task<EmailOtpVerifyResult> ExecuteAsync(
        EmailOtpVerifyRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (!_options.Enabled || request.ChallengeId == Guid.Empty || string.IsNullOrWhiteSpace(request.Code))
        {
            return AuthValidationResultMapper.ToEmailOtpVerifyFailure();
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
            ArchLucidInstrumentation.RecordEmailOtpChallengeVerified("sso_required");

            return await FailWithAuditAsync("sso_required", emailCorrelation: null, cancellationToken)
                .ConfigureAwait(false);
        }

        string emailCorrelation = EmailOtpCorrelationFingerprint.ComputeHexPrefix(challenge.NormalizedEmail);
        DateTimeOffset now = _timeProvider.GetUtcNow();

        if (await AuthRateLimitHelper.IsEmailOtpVerificationRateLimitedAsync(
                    _challenges,
                    _options,
                    challenge.NormalizedEmail,
                    now,
                    emailCorrelation,
                    _auditService,
                    cancellationToken)
                .ConfigureAwait(false))
        {
            ArchLucidInstrumentation.RecordEmailOtpChallengeVerified("rate_limited");

            return AuthValidationResultMapper.ToEmailOtpVerifyFailure();
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
            string reason = AuthValidationResultMapper.MapEmailOtpCompletionFailureReason(completion.Result);

            return await FailWithAuditAsync(reason, emailCorrelation, cancellationToken).ConfigureAwait(false);
        }

        IdentityEmailNormalizer.TryNormalize(
            completion.Challenge.NormalizedEmail,
            out string normalizedEmail,
            out string displayEmail);

        ExternalIdentityKey identityKey = BuildEmailOtpIdentityKey(normalizedEmail);

        PlatformUserRecord? user =
            await _platformIdentity.FindUserByExternalIdentityAsync(identityKey, cancellationToken).ConfigureAwait(false);

        AuthenticationIdentityRecord? reservedIdentity = null;

        if (user is null)
        {
            reservedIdentity =
                await _authenticationIdentities.FindAnyByExternalKeyAsync(identityKey, cancellationToken).ConfigureAwait(false);

            if (reservedIdentity is not null)
            {
                user = await _platformIdentity.FindUserByAnyExternalIdentityAsync(identityKey, cancellationToken)
                    .ConfigureAwait(false);
            }
        }

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

        if (emailIdentity is null
            && reservedIdentity is not null
            && reservedIdentity.UserId == user.Id
            && reservedIdentity.DisabledUtc is not null)
        {
            bool reEnabled = await _authenticationIdentities.ReEnableAsync(reservedIdentity.Id, cancellationToken)
                .ConfigureAwait(false);

            if (reEnabled)
            {
                emailIdentity =
                    await _authenticationIdentities.GetByIdAsync(reservedIdentity.Id, cancellationToken).ConfigureAwait(false);
            }
        }

        if (emailIdentity is not null)
        {
            await _authenticationIdentities.RecordAuthenticationAsync(emailIdentity.Id, now, cancellationToken)
                .ConfigureAwait(false);
        }

        AcceptedEmailOtpInvitation? acceptedInvitation =
            await TryAcceptInvitationAsync(
                user.Id,
                normalizedEmail,
                completion.Challenge.InvitationId,
                request.InvitationToken,
                cancellationToken).ConfigureAwait(false);

        (EmailOtpAuthNextStep nextStep, Guid? tenantId, Guid? workspaceId, Guid? invitationId) =
            await ResolveNextStepAsync(
                    user.Id,
                    normalizedEmail,
                    acceptedInvitation,
                    completion.Challenge.InvitationId,
                    cancellationToken)
                .ConfigureAwait(false);

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.EmailOtpVerificationSucceeded,
                emailCorrelation,
                new
                {
                    emailCorrelation,
                    userId = user.Id,
                    createdUser,
                    nextStep = nextStep.ToString()
                },
                cancellationToken)
            .ConfigureAwait(false);

        ArchLucidInstrumentation.RecordEmailOtpChallengeVerified("success");

        return new EmailOtpVerifyResult
        {
            Succeeded = true,
            PlatformUserId = user.Id,
            DisplayEmail = displayEmail,
            Role = ArchLucidRoles.Reader,
            NextStep = nextStep,
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            InvitationId = invitationId,
            AuthVersion = user.AuthVersion
        };
    }

    private Task<EmailOtpVerifyResult> FailWithAuditAsync(
        string reason,
        string? emailCorrelation,
        CancellationToken cancellationToken)
    {
        ArchLucidInstrumentation.RecordEmailOtpChallengeVerified(
            AuthValidationResultMapper.MapEmailOtpVerifyMetricResult(reason));

        if (!string.IsNullOrWhiteSpace(emailCorrelation))
        {
            return FailWithAuditCoreAsync(reason, emailCorrelation, cancellationToken);
        }

        return Task.FromResult(AuthValidationResultMapper.ToEmailOtpVerifyFailure());
    }

    private async Task<EmailOtpVerifyResult> FailWithAuditCoreAsync(
        string reason,
        string emailCorrelation,
        CancellationToken cancellationToken)
    {
        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.EmailOtpVerificationFailed,
                emailCorrelation,
                new { emailCorrelation, reason },
                cancellationToken)
            .ConfigureAwait(false);

        return AuthValidationResultMapper.ToEmailOtpVerifyFailure();
    }

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

    private async Task<(EmailOtpAuthNextStep NextStep, Guid? TenantId, Guid? WorkspaceId, Guid? InvitationId)>
        ResolveNextStepAsync(
            Guid platformUserId,
            string normalizedEmail,
            AcceptedEmailOtpInvitation? acceptedInvitation,
            Guid? challengeLinkedInvitationId,
            CancellationToken cancellationToken)
    {
        IReadOnlyList<WorkspaceMembershipRecord> memberships =
            await _memberships.ListByUserIdAsync(platformUserId, cancellationToken).ConfigureAwait(false);

        IReadOnlyList<WorkspaceMembershipRecord> activeMemberships =
            memberships.Where(row => row.Status == WorkspaceMembershipStatus.Active).ToList();

        if (acceptedInvitation is not null)
        {
            return (
                EmailOtpAuthNextStep.Complete,
                acceptedInvitation.TenantId,
                acceptedInvitation.WorkspaceId,
                acceptedInvitation.InvitationId);
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

        if (challengeLinkedInvitationId is Guid invitationId)
        {
            UserInvitationRecord? linked =
                await _invitations.GetPendingByIdAsync(invitationId, cancellationToken).ConfigureAwait(false);

            if (linked is not null
                && IdentityEmailNormalizer.TryNormalize(linked.Email, out string normalizedInviteeEmail, out _)
                && string.Equals(normalizedInviteeEmail, normalizedEmail, StringComparison.Ordinal))
            {
                return (EmailOtpAuthNextStep.AcceptInvitation, linked.TenantId, linked.WorkspaceId, linked.Id);
            }
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

    private static ExternalIdentityKey BuildEmailOtpIdentityKey(string normalizedEmail) =>
        new()
        {
            ProviderType = AuthenticationProviderType.EmailOneTimeCode,
            NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.EmailOneTimeCode),
            Subject = normalizedEmail
        };
}
