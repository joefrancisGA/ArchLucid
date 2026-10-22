namespace ArchLucid.Application.Identity.LinkProposal;

public interface IAuthenticationIdentityLinkProposalCancelStage
{
    Task CancelLinkProposalAsync(
        Guid userId,
        Guid proposalId,
        string actorId,
        CancellationToken cancellationToken);
}
