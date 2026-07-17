using System.Text.Json;

using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Identity;

public sealed class SignInMethodSummary
{
    public Guid IdentityId
    {
        get;
        init;
    }

    public string ProviderType
    {
        get;
        init;
    } = string.Empty;

    public string ProviderLabel
    {
        get;
        init;
    } = string.Empty;

    public string? MaskedIdentifier
    {
        get;
        init;
    }

    public DateTimeOffset AddedUtc
    {
        get;
        init;
    }

    public DateTimeOffset? LastUsedUtc
    {
        get;
        init;
    }

    public bool IsActive
    {
        get;
        init;
    }

    public bool CanRemove
    {
        get;
        init;
    }
}

public sealed class AuthenticationIdentityLinkProposalView
{
    public Guid ProposalId
    {
        get;
        init;
    }

    public string ProviderType
    {
        get;
        init;
    } = string.Empty;

    public string ProviderLabel
    {
        get;
        init;
    } = string.Empty;

    public string? MaskedIdentifier
    {
        get;
        init;
    }

    public bool RequiresExplicitConfirmation
    {
        get;
        init;
    }

    public string ConfirmationMessage
    {
        get;
        init;
    } = string.Empty;

    public DateTimeOffset ExpiresUtc
    {
        get;
        init;
    }
}

public interface IAuthenticationIdentityLinkingService
{
    Task<IReadOnlyList<SignInMethodSummary>> ListSignInMethodsAsync(
        Guid userId,
        CancellationToken cancellationToken);

    Task<Guid> RequestEmailLinkChallengeAsync(
        Guid userId,
        string email,
        string actorId,
        CancellationToken cancellationToken);

    Task<AuthenticationIdentityLinkProposalView> VerifyEmailLinkChallengeAsync(
        Guid userId,
        Guid challengeId,
        string code,
        string actorId,
        CancellationToken cancellationToken);

    Task<AuthenticationIdentityLinkProposalView> CreateExternalLinkProposalAsync(
        Guid userId,
        VerifiedExternalIdentityCreateRequest verifiedIdentity,
        string actorId,
        CancellationToken cancellationToken);

    Task<AuthenticationIdentityRecord> ConfirmLinkProposalAsync(
        Guid userId,
        Guid proposalId,
        string actorId,
        CancellationToken cancellationToken);

    Task CancelLinkProposalAsync(
        Guid userId,
        Guid proposalId,
        string actorId,
        CancellationToken cancellationToken);

    Task RemoveSignInMethodAsync(
        Guid userId,
        Guid identityId,
        string actorId,
        CancellationToken cancellationToken);
}

public sealed class AuthenticationIdentityLinkingService(
    IPlatformIdentityService platformIdentity,
    IPlatformUserRepository users,
    IAuthenticationIdentityRepository identities,
    IAuthenticationIdentityLinkProposalRepository proposals,
    IIdentityMigrationReviewRepository migrationReviews,
    IEmailOtpChallengeRepository challenges,
    IEmailOtpEmailNotifier emailNotifier,
    ISignInMethodRemovalPolicyService removalPolicy,
    IAuditService auditService,
    IOptions<EmailOtpAuthOptions> emailOtpOptions,
    TimeProvider timeProvider) : IAuthenticationIdentityLinkingService
{
    private const int LinkProposalLifetimeMinutes = 15;

    private readonly IPlatformIdentityService _platformIdentity =
        platformIdentity ?? throw new ArgumentNullException(nameof(platformIdentity));

    private readonly IPlatformUserRepository _users =
        users ?? throw new ArgumentNullException(nameof(users));

    private readonly IAuthenticationIdentityRepository _identities =
        identities ?? throw new ArgumentNullException(nameof(identities));

    private readonly IAuthenticationIdentityLinkProposalRepository _proposals =
        proposals ?? throw new ArgumentNullException(nameof(proposals));

    private readonly IIdentityMigrationReviewRepository _migrationReviews =
        migrationReviews ?? throw new ArgumentNullException(nameof(migrationReviews));

    private readonly IEmailOtpChallengeRepository _challenges =
        challenges ?? throw new ArgumentNullException(nameof(challenges));

    private readonly IEmailOtpEmailNotifier _emailNotifier =
        emailNotifier ?? throw new ArgumentNullException(nameof(emailNotifier));

    private readonly ISignInMethodRemovalPolicyService _removalPolicy =
        removalPolicy ?? throw new ArgumentNullException(nameof(removalPolicy));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly EmailOtpAuthOptions _emailOtpOptions =
        emailOtpOptions?.Value ?? throw new ArgumentNullException(nameof(emailOtpOptions));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<IReadOnlyList<SignInMethodSummary>> ListSignInMethodsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<AuthenticationIdentityRecord> rows =
            await _platformIdentity.GetIdentitiesForUserAsync(userId, cancellationToken).ConfigureAwait(false);

        List<SignInMethodSummary> summaries = new();

        foreach (AuthenticationIdentityRecord row in rows)
        {
            SignInMethodRemovalEvaluation removal =
                row.IsActive
                    ? await _removalPolicy.EvaluateAsync(userId, row, cancellationToken).ConfigureAwait(false)
                    : new SignInMethodRemovalEvaluation { Allowed = false };

            summaries.Add(
                new SignInMethodSummary
                {
                    IdentityId = row.Id,
                    ProviderType = row.ProviderType.ToString(),
                    ProviderLabel = ResolveProviderLabel(row.ProviderType),
                    MaskedIdentifier = MaskIdentifier(row),
                    AddedUtc = row.CreatedUtc,
                    LastUsedUtc = row.LastAuthenticatedUtc,
                    IsActive = row.IsActive,
                    CanRemove = row.IsActive && removal.Allowed
                });
        }

        return summaries;
    }

    public async Task<Guid> RequestEmailLinkChallengeAsync(
        Guid userId,
        string email,
        string actorId,
        CancellationToken cancellationToken)
    {
        EnsureEmailOtpEnabled();

        if (!IdentityEmailNormalizer.TryNormalize(email, out string normalizedEmail, out string displayEmail))
        {
            throw new ArgumentException("Enter a valid email address.", nameof(email));
        }

        await EnsureEmailNotAlreadyLinkedToAnotherUserAsync(
                userId,
                BuildEmailOtpKey(normalizedEmail),
                normalizedEmail,
                actorId,
                cancellationToken)
            .ConfigureAwait(false);

        DateTimeOffset now = _timeProvider.GetUtcNow();
        Guid challengeId = Guid.NewGuid();
        string rawCode = EmailOtpCodeGenerator.GenerateNumericCode(_emailOtpOptions.CodeLength);
        string codeHash = EmailOtpCodeHasher.Hash(challengeId, rawCode, _emailOtpOptions.HashPepper);

        await _challenges.InsertAsync(
            new EmailOtpChallengeInsert
            {
                Id = challengeId,
                NormalizedEmail = normalizedEmail,
                CodeHash = codeHash,
                ExpiresUtc = now.AddMinutes(_emailOtpOptions.CodeLifetimeMinutes)
            },
            cancellationToken).ConfigureAwait(false);

        await _emailNotifier.TrySendSignInCodeAsync(
                displayEmail,
                rawCode,
                _emailOtpOptions.CodeLifetimeMinutes,
                cancellationToken)
            .ConfigureAwait(false);

        await _auditService.LogAsync(
            BuildAudit(
                AuditEventTypes.AuthenticationIdentityLinkChallengeRequested,
                actorId,
                userId,
                new { channel = "email_otp_link", emailCorrelation = EmailOtpCorrelationFingerprint.ComputeHexPrefix(normalizedEmail) }),
            cancellationToken).ConfigureAwait(false);

        return challengeId;
    }

    public async Task<AuthenticationIdentityLinkProposalView> VerifyEmailLinkChallengeAsync(
        Guid userId,
        Guid challengeId,
        string code,
        string actorId,
        CancellationToken cancellationToken)
    {
        EnsureEmailOtpEnabled();

        EmailOtpChallengeRecord? challenge =
            await _challenges.GetByIdAsync(challengeId, cancellationToken).ConfigureAwait(false);

        if (challenge is null)
        {
            throw new ArgumentException("Verification challenge was not found.");
        }

        DateTimeOffset now = _timeProvider.GetUtcNow();
        string codeHash = EmailOtpCodeHasher.Hash(challengeId, code, _emailOtpOptions.HashPepper);

        EmailOtpChallengeCompletionOutcome completion = await _challenges.TryCompleteAsync(
            challengeId,
            codeHash,
            now,
            _emailOtpOptions.MaxVerificationAttemptsPerChallenge,
            cancellationToken).ConfigureAwait(false);

        if (completion.Result != EmailOtpChallengeCompletionResult.Completed || completion.Challenge is null)
        {
            await _auditService.LogAsync(
                BuildAudit(
                    AuditEventTypes.AuthenticationIdentityLinkFailed,
                    actorId,
                    userId,
                    new { reason = completion.Result.ToString() }),
                cancellationToken).ConfigureAwait(false);

            throw new ArgumentException("The verification code is invalid or expired.");
        }

        IdentityEmailNormalizer.TryNormalize(
            completion.Challenge.NormalizedEmail,
            out string normalizedEmail,
            out string displayEmail);

        ExternalIdentityKey externalKey = BuildEmailOtpKey(normalizedEmail);

        await EnsureEmailNotAlreadyLinkedToAnotherUserAsync(
                userId,
                externalKey,
                normalizedEmail,
                actorId,
                cancellationToken)
            .ConfigureAwait(false);

        AuthenticationIdentityRecord? existingForUser =
            (await _identities.ListByUserIdAsync(userId, cancellationToken).ConfigureAwait(false))
            .FirstOrDefault(row => row.IsActive && row.ProviderType == externalKey.ProviderType
                && string.Equals(row.Subject, externalKey.Subject, StringComparison.Ordinal));

        if (existingForUser is not null)
        {
            throw new InvalidOperationException("This sign-in method is already linked to your account.");
        }

        return await CreateProposalAsync(
                userId,
                externalKey,
                normalizedEmail,
                displayEmail,
                emailVerified: true,
                actorId,
                cancellationToken)
            .ConfigureAwait(false);
    }

    public Task<AuthenticationIdentityLinkProposalView> CreateExternalLinkProposalAsync(
        Guid userId,
        VerifiedExternalIdentityCreateRequest verifiedIdentity,
        string actorId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(verifiedIdentity);
        ArgumentNullException.ThrowIfNull(verifiedIdentity.ExternalKey);

        ExternalIdentityKey normalizedKey = NormalizeExternalKey(verifiedIdentity.ExternalKey);

        return CreateProposalFromVerifiedExternalAsync(userId, verifiedIdentity, normalizedKey, actorId, cancellationToken);
    }

    public async Task<AuthenticationIdentityRecord> ConfirmLinkProposalAsync(
        Guid userId,
        Guid proposalId,
        string actorId,
        CancellationToken cancellationToken)
    {
        AuthenticationIdentityLinkProposalRecord proposal =
            await RequirePendingProposalAsync(userId, proposalId, cancellationToken).ConfigureAwait(false);

        await EnsureExternalKeyAvailableAsync(userId, proposal.ToExternalKey(), actorId, cancellationToken)
            .ConfigureAwait(false);

        VerifiedExternalIdentityCreateRequest attachRequest = new()
        {
            ExternalKey = proposal.ToExternalKey(),
            DisplayEmail = proposal.DisplayEmail,
            EmailVerified = proposal.EmailVerified,
            ActorId = actorId
        };

        AuthenticationIdentityRecord attached = await _platformIdentity
            .AttachIdentityToExistingUserAsync(userId, attachRequest, cancellationToken)
            .ConfigureAwait(false);

        DateTimeOffset now = _timeProvider.GetUtcNow();

        await _proposals
            .UpdateStatusAsync(proposalId, AuthenticationIdentityLinkProposalStatus.Confirmed, now, cancellationToken)
            .ConfigureAwait(false);

        await _auditService.LogAsync(
            BuildAudit(
                AuditEventTypes.AuthenticationIdentityLinkConfirmed,
                actorId,
                userId,
                new
                {
                    proposalId,
                    identityId = attached.Id,
                    providerType = attached.ProviderType.ToString()
                }),
            cancellationToken).ConfigureAwait(false);

        return attached;
    }

    public async Task CancelLinkProposalAsync(
        Guid userId,
        Guid proposalId,
        string actorId,
        CancellationToken cancellationToken)
    {
        AuthenticationIdentityLinkProposalRecord proposal =
            await RequirePendingProposalAsync(userId, proposalId, cancellationToken).ConfigureAwait(false);

        await _proposals
            .UpdateStatusAsync(
                proposal.Id,
                AuthenticationIdentityLinkProposalStatus.Cancelled,
                _timeProvider.GetUtcNow(),
                cancellationToken)
            .ConfigureAwait(false);

        await _auditService.LogAsync(
            BuildAudit(
                AuditEventTypes.AuthenticationIdentityLinkCancelled,
                actorId,
                userId,
                new { proposalId }),
            cancellationToken).ConfigureAwait(false);
    }

    public async Task RemoveSignInMethodAsync(
        Guid userId,
        Guid identityId,
        string actorId,
        CancellationToken cancellationToken)
    {
        AuthenticationIdentityRecord? identity =
            await _identities.GetByIdAsync(identityId, cancellationToken).ConfigureAwait(false);

        if (identity is null || identity.UserId != userId)
        {
            throw new ArgumentException("Sign-in method was not found.");
        }

        SignInMethodRemovalEvaluation removal =
            await _removalPolicy.EvaluateAsync(userId, identity, cancellationToken).ConfigureAwait(false);

        if (!removal.Allowed)
        {
            throw new SignInMethodRemovalBlockedException(
                removal.CustomerMessage ?? "This sign-in method cannot be removed.");
        }

        await _platformIdentity.DisableIdentityAsync(identityId, actorId, cancellationToken).ConfigureAwait(false);

        await _auditService.LogAsync(
            BuildAudit(
                AuditEventTypes.AuthenticationIdentityRemovalRequested,
                actorId,
                userId,
                new { identityId, providerType = identity.ProviderType.ToString() }),
            cancellationToken).ConfigureAwait(false);
    }

    private async Task<AuthenticationIdentityLinkProposalView> CreateProposalFromVerifiedExternalAsync(
        Guid userId,
        VerifiedExternalIdentityCreateRequest verifiedIdentity,
        ExternalIdentityKey normalizedKey,
        string actorId,
        CancellationToken cancellationToken)
    {
        string? normalizedEmail = null;
        string? displayEmail = null;

        if (!string.IsNullOrWhiteSpace(verifiedIdentity.DisplayEmail))
        {
            IdentityEmailNormalizer.TryNormalize(
                verifiedIdentity.DisplayEmail,
                out normalizedEmail,
                out displayEmail);
        }

        await EnsureEmailNotAlreadyLinkedToAnotherUserAsync(
                userId,
                normalizedKey,
                normalizedEmail,
                actorId,
                cancellationToken)
            .ConfigureAwait(false);

        return await CreateProposalAsync(
                userId,
                normalizedKey,
                normalizedEmail,
                displayEmail,
                verifiedIdentity.EmailVerified,
                actorId,
                cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<AuthenticationIdentityLinkProposalView> CreateProposalAsync(
        Guid userId,
        ExternalIdentityKey externalKey,
        string? normalizedEmail,
        string? displayEmail,
        bool emailVerified,
        string actorId,
        CancellationToken cancellationToken)
    {
        PlatformUserRecord? user = await _users.GetByIdAsync(userId, cancellationToken).ConfigureAwait(false)
            ?? throw new PlatformUserNotFoundException(userId);

        bool requiresExplicitConfirmation = RequiresExplicitConfirmation(user, normalizedEmail);

        DateTimeOffset now = _timeProvider.GetUtcNow();

        AuthenticationIdentityLinkProposalRecord proposal = new()
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ProviderType = externalKey.ProviderType,
            NormalizedIssuer = externalKey.NormalizedIssuer,
            Subject = externalKey.Subject,
            TenantId = externalKey.TenantId,
            TenantIdentityProviderId = externalKey.TenantIdentityProviderId,
            NormalizedEmail = normalizedEmail,
            DisplayEmail = displayEmail,
            EmailVerified = emailVerified,
            RequiresExplicitConfirmation = requiresExplicitConfirmation,
            Status = AuthenticationIdentityLinkProposalStatus.PendingConfirmation,
            CreatedUtc = now,
            ExpiresUtc = now.AddMinutes(LinkProposalLifetimeMinutes)
        };

        await _proposals.InsertAsync(proposal, cancellationToken).ConfigureAwait(false);

        await _auditService.LogAsync(
            BuildAudit(
                AuditEventTypes.AuthenticationIdentityLinkProposed,
                actorId,
                userId,
                new
                {
                    proposalId = proposal.Id,
                    providerType = externalKey.ProviderType.ToString(),
                    requiresExplicitConfirmation
                }),
            cancellationToken).ConfigureAwait(false);

        return ToProposalView(proposal);
    }

    private async Task EnsureEmailNotAlreadyLinkedToAnotherUserAsync(
        Guid userId,
        ExternalIdentityKey externalKey,
        string? normalizedEmail,
        string actorId,
        CancellationToken cancellationToken)
    {
        await EnsureExternalKeyAvailableAsync(userId, externalKey, actorId, cancellationToken).ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return;
        }

        _ = userId;
        _ = actorId;

        // Email match is guidance only — never authorize linking from email alone.
    }

    private async Task EnsureExternalKeyAvailableAsync(
        Guid userId,
        ExternalIdentityKey externalKey,
        string actorId,
        CancellationToken cancellationToken)
    {
        AuthenticationIdentityRecord? existing =
            await _identities.FindAnyByExternalKeyAsync(externalKey, cancellationToken).ConfigureAwait(false);

        if (existing is null)
        {
            return;
        }

        if (existing.UserId == userId)
        {
            return;
        }

        await _migrationReviews.UpsertAsync(
            "AuthenticationIdentityLinkAttempt",
            existing.Id,
            existing.TenantId,
            IdentityMigrationReviewReason.DuplicateExternalIdentity,
            $"External identity already attached to user {existing.UserId:D}.",
            _timeProvider.GetUtcNow(),
            cancellationToken).ConfigureAwait(false);

        await _auditService.LogAsync(
            BuildAudit(
                AuditEventTypes.AuthenticationIdentityLinkFailed,
                actorId,
                userId,
                new
                {
                    reason = "external_identity_attached_elsewhere",
                    providerType = externalKey.ProviderType.ToString()
                }),
            cancellationToken).ConfigureAwait(false);

        throw new IdentityAlreadyAttachedToAnotherUserException(externalKey);
    }

    private async Task<AuthenticationIdentityLinkProposalRecord> RequirePendingProposalAsync(
        Guid userId,
        Guid proposalId,
        CancellationToken cancellationToken)
    {
        AuthenticationIdentityLinkProposalRecord? proposal =
            await _proposals.GetByIdAsync(proposalId, cancellationToken).ConfigureAwait(false);

        if (proposal is null || proposal.UserId != userId)
        {
            throw new AuthenticationIdentityLinkProposalNotFoundException(proposalId);
        }

        if (proposal.Status != AuthenticationIdentityLinkProposalStatus.PendingConfirmation)
        {
            throw new AuthenticationIdentityLinkProposalNotFoundException(proposalId);
        }

        if (proposal.ExpiresUtc <= _timeProvider.GetUtcNow())
        {
            await _proposals
                .UpdateStatusAsync(
                    proposalId,
                    AuthenticationIdentityLinkProposalStatus.Expired,
                    _timeProvider.GetUtcNow(),
                    cancellationToken)
                .ConfigureAwait(false);

            throw new AuthenticationIdentityLinkProposalExpiredException(proposalId);
        }

        return proposal;
    }

    private static bool RequiresExplicitConfirmation(PlatformUserRecord user, string? normalizedEmail)
    {
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(user.NormalizedPrimaryEmail))
        {
            return false;
        }

        return !string.Equals(user.NormalizedPrimaryEmail, normalizedEmail, StringComparison.Ordinal);
    }

    private void EnsureEmailOtpEnabled()
    {
        if (!_emailOtpOptions.Enabled)
        {
            throw new InvalidOperationException("Email one-time-code linking is not enabled.");
        }
    }

    private static ExternalIdentityKey BuildEmailOtpKey(string normalizedEmail) =>
        new()
        {
            ProviderType = AuthenticationProviderType.EmailOneTimeCode,
            NormalizedIssuer = IdentityIssuerNormalizer.Normalize(IdentityIssuerConstants.EmailOneTimeCode),
            Subject = normalizedEmail
        };

    private static ExternalIdentityKey NormalizeExternalKey(ExternalIdentityKey key) =>
        new()
        {
            ProviderType = key.ProviderType,
            NormalizedIssuer = IdentityIssuerNormalizer.Normalize(key.NormalizedIssuer),
            Subject = key.Subject.Trim(),
            TenantId = key.TenantId,
            TenantIdentityProviderId = key.TenantIdentityProviderId
        };

    private static AuthenticationIdentityLinkProposalView ToProposalView(AuthenticationIdentityLinkProposalRecord proposal)
    {
        string confirmationMessage = proposal.RequiresExplicitConfirmation
            ? "Confirm linking this sign-in method. The verified email differs from your account primary email; your primary email will not change automatically."
            : "Confirm linking this sign-in method to your account.";

        return new AuthenticationIdentityLinkProposalView
        {
            ProposalId = proposal.Id,
            ProviderType = proposal.ProviderType.ToString(),
            ProviderLabel = ResolveProviderLabel(proposal.ProviderType),
            MaskedIdentifier = MaskEmail(proposal.DisplayEmail),
            RequiresExplicitConfirmation = proposal.RequiresExplicitConfirmation,
            ConfirmationMessage = confirmationMessage,
            ExpiresUtc = proposal.ExpiresUtc
        };
    }

    private static string ResolveProviderLabel(AuthenticationProviderType providerType) =>
        providerType switch
        {
            AuthenticationProviderType.EmailOneTimeCode => "Email code",
            AuthenticationProviderType.MicrosoftIdentity => "Microsoft",
            AuthenticationProviderType.GoogleIdentity => "Google",
            AuthenticationProviderType.TenantOidc => "Organization OIDC",
            AuthenticationProviderType.TenantSaml => "Organization SAML",
            AuthenticationProviderType.TrialLocalPassword => "Local password",
            _ => providerType.ToString()
        };

    private static string? MaskIdentifier(AuthenticationIdentityRecord identity)
    {
        if (!string.IsNullOrWhiteSpace(identity.DisplayEmail))
        {
            return MaskEmail(identity.DisplayEmail);
        }

        return "Linked identity";
    }

    private static string? MaskEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        int at = email.IndexOf('@');

        if (at <= 1)
        {
            return email;
        }

        return $"{email[0]}***{email[at..]}";
    }

    private static AuditEvent BuildAudit(string eventType, string actorId, Guid userId, object payload) =>
        new()
        {
            EventType = eventType,
            ActorUserId = actorId,
            ActorUserName = actorId,
            ExplicitActor = true,
            TenantId = Guid.Empty,
            DataJson = JsonSerializer.Serialize(payload)
        };
}
