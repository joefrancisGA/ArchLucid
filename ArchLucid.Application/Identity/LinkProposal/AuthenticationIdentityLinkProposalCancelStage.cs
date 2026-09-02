using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity.LinkProposal;

/// <inheritdoc cref="IAuthenticationIdentityLinkProposalCancelStage" />
public sealed class AuthenticationIdentityLinkProposalCancelStage(
    IAuthenticationIdentityLinkProposalPersistStage proposalPersistStage,
    IAuthenticationIdentityLinkProposalAuditNotifier proposalAuditNotifier,
    TimeProvider timeProvider) : IAuthenticationIdentityLinkProposalCancelStage
{
    private readonly IAuthenticationIdentityLinkProposalPersistStage _proposalPersistStage =
        proposalPersistStage ?? throw new ArgumentNullException(nameof(proposalPersistStage));

    private readonly IAuthenticationIdentityLinkProposalAuditNotifier _proposalAuditNotifier =
        proposalAuditNotifier ?? throw new ArgumentNullException(nameof(proposalAuditNotifier));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    public async Task CancelLinkProposalAsync(
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

        await AuthenticationIdentityLinkProposalLifecycleCore.UpdatePendingProposalStatusAsync(
                _proposalPersistStage,
                _timeProvider,
                proposal.Id,
                AuthenticationIdentityLinkProposalStatus.Cancelled,
                _timeProvider.GetUtcNow(),
                cancellationToken)
            .ConfigureAwait(false);

        await _proposalAuditNotifier.LogCancelledAsync(actorId, proposalId, cancellationToken).ConfigureAwait(false);
    }
}
