using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity.LinkProposal;

/// <inheritdoc cref="IAuthenticationIdentityLinkProposalConfirmStage" />
public sealed class AuthenticationIdentityLinkProposalConfirmStage(
    IPlatformIdentityService platformIdentity,
    IAuthenticationIdentityLinkProposalPersistStage proposalPersistStage,
    IAuthenticationIdentityLinkProposalAuditNotifier proposalAuditNotifier,
    IExternalKeyEligibilityChecker externalKeyEligibilityChecker,
    TimeProvider timeProvider) : IAuthenticationIdentityLinkProposalConfirmStage
{
    private readonly IPlatformIdentityService _platformIdentity =
        platformIdentity ?? throw new ArgumentNullException(nameof(platformIdentity));

    private readonly IAuthenticationIdentityLinkProposalPersistStage _proposalPersistStage =
        proposalPersistStage ?? throw new ArgumentNullException(nameof(proposalPersistStage));

    private readonly IAuthenticationIdentityLinkProposalAuditNotifier _proposalAuditNotifier =
        proposalAuditNotifier ?? throw new ArgumentNullException(nameof(proposalAuditNotifier));

    private readonly IExternalKeyEligibilityChecker _externalKeyEligibilityChecker =
        externalKeyEligibilityChecker ?? throw new ArgumentNullException(nameof(externalKeyEligibilityChecker));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task<AuthenticationIdentityRecord> ConfirmLinkProposalAsync(
        Guid userId,
        Guid proposalId,
        string actorId,
        CancellationToken cancellationToken)
    {
        AuthenticationIdentityLinkProposalRecord proposal =
            await AuthenticationIdentityLinkProposalLifecycleCore.RequirePendingProposalAsync(
                _proposalPersistStage,
                _timeProvider,
                userId,
                proposalId,
                cancellationToken).ConfigureAwait(false);

        await _externalKeyEligibilityChecker.EnsureExternalKeyAvailableAsync(
                userId,
                proposal.ToExternalKey(),
                actorId,
                cancellationToken)
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

        bool confirmed = await _proposalPersistStage
            .TryUpdateStatusAsync(
                proposalId,
                AuthenticationIdentityLinkProposalStatus.Confirmed,
                _timeProvider.GetUtcNow(),
                cancellationToken)
            .ConfigureAwait(false);

        if (!confirmed)
        {
            AuthenticationIdentityLinkProposalRecord? current =
                await _proposalPersistStage.GetByIdAsync(proposalId, cancellationToken).ConfigureAwait(false);

            if (current?.Status == AuthenticationIdentityLinkProposalStatus.Confirmed)
                return attached;

            if (current?.Status == AuthenticationIdentityLinkProposalStatus.Expired
                || (current?.Status == AuthenticationIdentityLinkProposalStatus.PendingConfirmation
                    && current.ExpiresUtc <= _timeProvider.GetUtcNow()))
            {
                throw new AuthenticationIdentityLinkProposalExpiredException(proposalId);
            }

            throw new AuthenticationIdentityLinkProposalNotFoundException(proposalId);
        }

        await _proposalAuditNotifier.LogConfirmedAsync(
                actorId,
                proposalId,
                attached.Id,
                attached.ProviderType.ToString(),
                cancellationToken)
            .ConfigureAwait(false);

        return attached;
    }
}
