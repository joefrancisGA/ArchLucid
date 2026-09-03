using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity.LinkProposal;

/// <inheritdoc cref="IAuthenticationIdentityLinkProposalCreateStage" />
public sealed class AuthenticationIdentityLinkProposalCreateStage(
    IPlatformUserRepository users,
    IAuthenticationIdentityLinkProposalPersistStage proposalPersistStage,
    IAuthenticationIdentityLinkProposalAuditNotifier proposalAuditNotifier,
    IExternalKeyEligibilityChecker externalKeyEligibilityChecker,
    TimeProvider timeProvider) : IAuthenticationIdentityLinkProposalCreateStage
{
    private readonly IPlatformUserRepository _users =
        users ?? throw new ArgumentNullException(nameof(users));

    private readonly IAuthenticationIdentityLinkProposalPersistStage _proposalPersistStage =
        proposalPersistStage ?? throw new ArgumentNullException(nameof(proposalPersistStage));

    private readonly IAuthenticationIdentityLinkProposalAuditNotifier _proposalAuditNotifier =
        proposalAuditNotifier ?? throw new ArgumentNullException(nameof(proposalAuditNotifier));

    private readonly IExternalKeyEligibilityChecker _externalKeyEligibilityChecker =
        externalKeyEligibilityChecker ?? throw new ArgumentNullException(nameof(externalKeyEligibilityChecker));

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

        ExternalIdentityKey normalizedKey =
            AuthenticationIdentityLinkingSupport.NormalizeExternalKey(verifiedIdentity.ExternalKey);

        return CreateProposalFromVerifiedExternalAsync(
            userId,
            verifiedIdentity,
            normalizedKey,
            actorId,
            cancellationToken);
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

        await _proposalPersistStage.InsertAsync(proposal, cancellationToken).ConfigureAwait(false);

        await _proposalAuditNotifier.LogProposedAsync(
                actorId,
                proposal.Id,
                externalKey.ProviderType.ToString(),
                requiresExplicitConfirmation,
                cancellationToken)
            .ConfigureAwait(false);

        return AuthenticationIdentityLinkingSupport.ToProposalView(proposal);
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

        await _externalKeyEligibilityChecker.EnsureEmailNotAlreadyLinkedToAnotherUserAsync(
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
}
