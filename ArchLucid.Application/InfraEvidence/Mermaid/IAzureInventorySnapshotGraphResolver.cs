using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

public interface IAzureInventorySnapshotGraphResolver
{
    Task<AzureInventorySnapshotGraphResolveResult> TryResolveGraphAsync(
        ScopeContext scope,
        Guid snapshotId,
        bool includeNeverShowArmTypes = false,
        bool retainIdentityDiagramArmTypes = false,
        CancellationToken cancellationToken = default);
}

public sealed class AzureInventorySnapshotGraphResolveResult
{
    public bool Succeeded
    {
        get;
        init;
    }

    public GraphSnapshot? Graph
    {
        get;
        init;
    }

    public string? ErrorMessage
    {
        get;
        init;
    }

    public AzureInventorySnapshotDetailReadModel? Snapshot
    {
        get;
        init;
    }
}
