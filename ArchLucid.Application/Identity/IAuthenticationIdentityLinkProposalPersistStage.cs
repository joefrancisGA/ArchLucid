using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

/// <summary>
///     Persists authentication identity link proposal records.
/// </summary>
public interface IAuthenticationIdentityLinkProposalPersistStage
{
    Task InsertAsync(AuthenticationIdentityLinkProposalRecord proposal, CancellationToken cancellationToken);

    Task<bool> TryUpdateStatusAsync(
        Guid proposalId,
        AuthenticationIdentityLinkProposalStatus status,
        DateTimeOffset statusUtc,
        CancellationToken cancellationToken);

    Task<AuthenticationIdentityLinkProposalRecord?> GetByIdAsync(Guid proposalId, CancellationToken cancellationToken);
}
