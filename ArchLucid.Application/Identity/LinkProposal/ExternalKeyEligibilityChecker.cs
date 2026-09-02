using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity.LinkProposal;

/// <inheritdoc cref="IExternalKeyEligibilityChecker" />
public sealed class ExternalKeyEligibilityChecker(
    IAuthenticationIdentityRepository identities,
    IIdentityMigrationReviewRepository migrationReviews,
    IAuthenticationIdentityLinkProposalAuditNotifier proposalAuditNotifier,
    TimeProvider timeProvider) : IExternalKeyEligibilityChecker
{
    private readonly IAuthenticationIdentityRepository _identities =
        identities ?? throw new ArgumentNullException(nameof(identities));

    private readonly IIdentityMigrationReviewRepository _migrationReviews =
        migrationReviews ?? throw new ArgumentNullException(nameof(migrationReviews));

    private readonly IAuthenticationIdentityLinkProposalAuditNotifier _proposalAuditNotifier =
        proposalAuditNotifier ?? throw new ArgumentNullException(nameof(proposalAuditNotifier));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task EnsureEmailNotAlreadyLinkedToAnotherUserAsync(
        Guid userId,
        ExternalIdentityKey externalKey,
        string? normalizedEmail,
        string actorId,
        CancellationToken cancellationToken)
    {
        await EnsureExternalKeyAvailableAsync(userId, externalKey, actorId, cancellationToken).ConfigureAwait(false);

        _ = userId;
        _ = actorId;
        _ = normalizedEmail;
    }

    public async Task EnsureExternalKeyAvailableAsync(
        Guid userId,
        ExternalIdentityKey externalKey,
        string actorId,
        CancellationToken cancellationToken)
    {
        AuthenticationIdentityRecord? existing =
            await _identities.FindAnyByExternalKeyAsync(externalKey, cancellationToken).ConfigureAwait(false);

        if (existing is null)
            return;

        if (existing.UserId == userId)
            return;

        await _migrationReviews.UpsertAsync(
            "AuthenticationIdentityLinkAttempt",
            existing.Id,
            existing.TenantId,
            IdentityMigrationReviewReason.DuplicateExternalIdentity,
            $"External identity already attached to user {existing.UserId:D}.",
            _timeProvider.GetUtcNow(),
            cancellationToken).ConfigureAwait(false);

        await _proposalAuditNotifier.LogFailedAsync(
                actorId,
                "external_identity_attached_elsewhere",
                externalKey.ProviderType.ToString(),
                cancellationToken)
            .ConfigureAwait(false);

        throw new IdentityAlreadyAttachedToAnotherUserException(externalKey);
    }
}
