namespace ArchLucid.Core.Identity;

public interface IAuthenticationIdentityLinkProposalRepository
{
    Task<AuthenticationIdentityLinkProposalRecord> InsertAsync(
        AuthenticationIdentityLinkProposalRecord record,
        CancellationToken cancellationToken);

    Task<AuthenticationIdentityLinkProposalRecord?> GetByIdAsync(Guid proposalId, CancellationToken cancellationToken);

    Task UpdateStatusAsync(
        Guid proposalId,
        AuthenticationIdentityLinkProposalStatus status,
        DateTimeOffset statusUtc,
        CancellationToken cancellationToken);
}
