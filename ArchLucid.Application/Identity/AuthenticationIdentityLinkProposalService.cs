using ArchLucid.Core.Audit;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

public interface IAuthenticationIdentityLinkProposalService
{
    Task<AuthenticationIdentityLinkProposalView> CreateExternalLinkProposalAsync(
        Guid userId,
        VerifiedExternalIdentityCreateRequest verifiedIdentity,
        string actorId,
        CancellationToken cancellationToken);

    Task<AuthenticationIdentityLinkProposalView> CreateProposalAsync(
        Guid userId,
        ExternalIdentityKey externalKey,
        string? normalizedEmail,
        string? displayEmail,
        bool emailVerified,
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

    Task EnsureEmailNotAlreadyLinkedToAnotherUserAsync(
        Guid userId,
        ExternalIdentityKey externalKey,
        string? normalizedEmail,
        string actorId,
        CancellationToken cancellationToken);
}

public sealed class AuthenticationIdentityLinkProposalService(
    IPlatformIdentityService platformIdentity,
    IPlatformUserRepository users,
    IAuthenticationIdentityRepository identities,
    IAuthenticationIdentityLinkProposalRepository proposals,
    IIdentityMigrationReviewRepository migrationReviews,
    IAuditService auditService,
    TimeProvider timeProvider) : IAuthenticationIdentityLinkProposalService
{
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

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public Task<AuthenticationIdentityLinkProposalView> CreateExternalLinkProposalAsync(
        Guid userId,
        VerifiedExternalIdentityCreateRequest verifiedIdentity,
        string actorId,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(verifiedIdentity);
        ArgumentNullException.ThrowIfNull(verifiedIdentity.ExternalKey);

        ExternalIdentityKey normalizedKey = AuthenticationIdentityLinkingSupport.NormalizeExternalKey(verifiedIdentity.ExternalKey);

        return CreateProposalFromVerifiedExternalAsync(userId, verifiedIdentity, normalizedKey, actorId, cancellationToken);
    }

    public async Task<AuthenticationIdentityLinkProposalView> CreateProposalAsync(
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

        bool requiresExplicitConfirmation =
            AuthenticationIdentityLinkingSupport.RequiresExplicitConfirmation(user, normalizedEmail);

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
            ExpiresUtc = now.AddMinutes(AuthenticationIdentityLinkingSupport.LinkProposalLifetimeMinutes)
        };

        await _proposals.InsertAsync(proposal, cancellationToken).ConfigureAwait(false);

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.AuthenticationIdentityLinkProposed,
                actorId,
                new
                {
                    proposalId = proposal.Id,
                    providerType = externalKey.ProviderType.ToString(),
                    requiresExplicitConfirmation
                },
                cancellationToken)
            .ConfigureAwait(false);

        return AuthenticationIdentityLinkingSupport.ToProposalView(proposal);
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

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.AuthenticationIdentityLinkConfirmed,
                actorId,
                new
                {
                    proposalId,
                    identityId = attached.Id,
                    providerType = attached.ProviderType.ToString()
                },
                cancellationToken)
            .ConfigureAwait(false);

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

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.AuthenticationIdentityLinkCancelled,
                actorId,
                new { proposalId },
                cancellationToken)
            .ConfigureAwait(false);
    }

    public async Task EnsureEmailNotAlreadyLinkedToAnotherUserAsync(
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

        await AuthAuditEmitter.LogIdentityEventAsync(
                _auditService,
                AuditEventTypes.AuthenticationIdentityLinkFailed,
                actorId,
                new
                {
                    reason = "external_identity_attached_elsewhere",
                    providerType = externalKey.ProviderType.ToString()
                },
                cancellationToken)
            .ConfigureAwait(false);

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
}
