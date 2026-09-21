using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

public sealed class AzureInventorySnapshotDeleteService(
    IAzureInventorySnapshotRepository snapshotRepository) : IAzureInventorySnapshotDeleteService
{
    private readonly IAzureInventorySnapshotRepository _snapshotRepository =
        snapshotRepository ?? throw new ArgumentNullException(nameof(snapshotRepository));

    public Task<AzureInventorySnapshotDeleteResult> TryDeleteAsync(
        ScopeContext scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        return _snapshotRepository.TryDeleteSnapshotAsync(scope, snapshotId, cancellationToken);
    }
}
