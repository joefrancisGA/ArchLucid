using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public interface IArchitectureInventoryBindingRepository
{
    Task<ArchitectureInventoryBindingRecord?> TryGetByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task UpsertAsync(ArchitectureInventoryBindingRecord record, CancellationToken cancellationToken = default);

    Task<bool> TryDeleteByArchitectureIdAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);
}
