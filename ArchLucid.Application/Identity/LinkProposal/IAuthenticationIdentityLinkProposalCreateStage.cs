using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity.LinkProposal;

public interface IAuthenticationIdentityLinkProposalCreateStage
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
}
