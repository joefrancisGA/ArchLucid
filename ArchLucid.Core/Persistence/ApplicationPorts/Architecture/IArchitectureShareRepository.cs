using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public interface IArchitectureShareRepository
{
    Task<IReadOnlyList<ArchitectureShareRecord>> ListByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task<ArchitectureShareRecord?> TryGetAsync(
        ScopeContext scope,
        Guid architectureId,
        string actorOid,
        CancellationToken cancellationToken = default);

    Task UpsertAsync(ArchitectureShareRecord record, CancellationToken cancellationToken = default);

    Task<bool> TryDeleteAsync(
        ScopeContext scope,
        Guid architectureId,
        string actorOid,
        CancellationToken cancellationToken = default);

    Task<int> CountByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);
}
