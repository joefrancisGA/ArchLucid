using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence;

public interface IAzureInventorySnapshotDeleteService
{
    Task<AzureInventorySnapshotDeleteResult> TryDeleteAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default);
}
