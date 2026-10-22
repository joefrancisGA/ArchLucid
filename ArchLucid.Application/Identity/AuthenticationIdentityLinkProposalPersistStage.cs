using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

/// <inheritdoc cref="IAuthenticationIdentityLinkProposalPersistStage" />
public sealed class AuthenticationIdentityLinkProposalPersistStage(
    IAuthenticationIdentityLinkProposalRepository proposals) : IAuthenticationIdentityLinkProposalPersistStage
{
    private readonly IAuthenticationIdentityLinkProposalRepository _proposals =
        proposals ?? throw new ArgumentNullException(nameof(proposals));

    public Task InsertAsync(AuthenticationIdentityLinkProposalRecord proposal, CancellationToken cancellationToken) =>
        _proposals.InsertAsync(proposal, cancellationToken);

    public Task<bool> TryUpdateStatusAsync(
        Guid proposalId,
        AuthenticationIdentityLinkProposalStatus status,
        DateTimeOffset statusUtc,
        CancellationToken cancellationToken) =>
        _proposals.TryUpdateStatusAsync(proposalId, status, statusUtc, cancellationToken);

    public Task<AuthenticationIdentityLinkProposalRecord?> GetByIdAsync(
        Guid proposalId,
        CancellationToken cancellationToken) =>
        _proposals.GetByIdAsync(proposalId, cancellationToken);
}
