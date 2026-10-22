using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Architecture;

public interface IArchitectureInventoryBindingService
{
    Task<ArchitectureInventoryBindingResponse?> TryGetBindingAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);

    Task<ArchitectureInventoryBindingAttachResult> AttachAsync(
        ScopeContext scope,
        Guid architectureId,
        Guid snapshotId,
        string boundBy,
        CancellationToken cancellationToken = default);

    Task<bool> TryDetachAsync(
        ScopeContext scope,
        Guid architectureId,
        CancellationToken cancellationToken = default);
}
