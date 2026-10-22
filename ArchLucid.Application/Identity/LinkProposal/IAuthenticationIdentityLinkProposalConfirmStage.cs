using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity.LinkProposal;

public interface IAuthenticationIdentityLinkProposalConfirmStage
{
    Task<AuthenticationIdentityRecord> ConfirmLinkProposalAsync(
        Guid userId,
        Guid proposalId,
        string actorId,
        CancellationToken cancellationToken);
}
