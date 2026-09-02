using System.Collections.Concurrent;

using ArchLucid.Core.Identity;

namespace ArchLucid.Persistence.Identity;

public sealed class InMemoryAuthenticationIdentityLinkProposalRepository : IAuthenticationIdentityLinkProposalRepository
{
    private readonly ConcurrentDictionary<Guid, AuthenticationIdentityLinkProposalRecord> _byId = new();

    public Task<AuthenticationIdentityLinkProposalRecord> InsertAsync(
        AuthenticationIdentityLinkProposalRecord record,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _byId[record.Id] = record;

        return Task.FromResult(record);
    }

    public Task<AuthenticationIdentityLinkProposalRecord?> GetByIdAsync(Guid proposalId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        _byId.TryGetValue(proposalId, out AuthenticationIdentityLinkProposalRecord? record);

        return Task.FromResult(record);
    }

    public Task<bool> TryUpdateStatusAsync(
        Guid proposalId,
        AuthenticationIdentityLinkProposalStatus status,
        DateTimeOffset statusUtc,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        if (!_byId.TryGetValue(proposalId, out AuthenticationIdentityLinkProposalRecord? existing))
        {
            return Task.FromResult(false);
        }

        if (existing.Status != AuthenticationIdentityLinkProposalStatus.PendingConfirmation)
        {
            return Task.FromResult(false);
        }

        bool updated = _byId.TryUpdate(proposalId, existing with
        {
            Status = status,
            ConfirmedUtc = status == AuthenticationIdentityLinkProposalStatus.Confirmed ? statusUtc : existing.ConfirmedUtc,
            CancelledUtc = status == AuthenticationIdentityLinkProposalStatus.Cancelled ? statusUtc : existing.CancelledUtc
        }, existing);

        return Task.FromResult(updated);
    }
}
