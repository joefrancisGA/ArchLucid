using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public interface IArchitectureWorkLeaseRepository
{
    Task<ArchitectureWorkLeaseRecord?> TryGetByDraftIdAsync(
        ScopeContext scope,
        Guid draftId,
        CancellationToken cancellationToken = default);

    Task UpsertAsync(
        ScopeContext scope,
        ArchitectureWorkLeaseRecord record,
        CancellationToken cancellationToken = default);

    Task<bool> TryDeleteByDraftIdForHolderAsync(
        ScopeContext scope,
        Guid draftId,
        Guid holderUserId,
        CancellationToken cancellationToken = default);
}
