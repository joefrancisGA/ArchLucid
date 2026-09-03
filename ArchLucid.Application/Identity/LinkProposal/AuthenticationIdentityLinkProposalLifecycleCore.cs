using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity.LinkProposal;

/// <summary>Shared pending-proposal lifecycle helpers for confirm and cancel stages.</summary>
internal static class AuthenticationIdentityLinkProposalLifecycleCore
{
    public static async Task<AuthenticationIdentityLinkProposalRecord> RequirePendingProposalAsync(
        IAuthenticationIdentityLinkProposalPersistStage proposalPersistStage,
        TimeProvider timeProvider,
        Guid userId,
        Guid proposalId,
        CancellationToken cancellationToken)
    {
        AuthenticationIdentityLinkProposalRecord? proposal =
            await proposalPersistStage.GetByIdAsync(proposalId, cancellationToken).ConfigureAwait(false);

        if (proposal is null || proposal.UserId != userId)
            throw new AuthenticationIdentityLinkProposalNotFoundException(proposalId);

        if (proposal.Status != AuthenticationIdentityLinkProposalStatus.PendingConfirmation)
            throw new AuthenticationIdentityLinkProposalNotFoundException(proposalId);

        if (proposal.ExpiresUtc <= timeProvider.GetUtcNow())
        {
            _ = await proposalPersistStage
                .TryUpdateStatusAsync(
                    proposalId,
                    AuthenticationIdentityLinkProposalStatus.Expired,
                    timeProvider.GetUtcNow(),
                    cancellationToken)
                .ConfigureAwait(false);

            throw new AuthenticationIdentityLinkProposalExpiredException(proposalId);
        }

        return proposal;
    }

    public static async Task UpdatePendingProposalStatusAsync(
        IAuthenticationIdentityLinkProposalPersistStage proposalPersistStage,
        TimeProvider timeProvider,
        Guid proposalId,
        AuthenticationIdentityLinkProposalStatus status,
        DateTimeOffset statusUtc,
        CancellationToken cancellationToken)
    {
        bool updated = await proposalPersistStage
            .TryUpdateStatusAsync(proposalId, status, statusUtc, cancellationToken)
            .ConfigureAwait(false);

        if (updated)
            return;

        AuthenticationIdentityLinkProposalRecord? current =
            await proposalPersistStage.GetByIdAsync(proposalId, cancellationToken).ConfigureAwait(false);

        if (current?.Status == AuthenticationIdentityLinkProposalStatus.Expired
            || (current?.Status == AuthenticationIdentityLinkProposalStatus.PendingConfirmation
                && current.ExpiresUtc <= timeProvider.GetUtcNow()))
        {
            throw new AuthenticationIdentityLinkProposalExpiredException(proposalId);
        }

        throw new AuthenticationIdentityLinkProposalNotFoundException(proposalId);
    }
}
