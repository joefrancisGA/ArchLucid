using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.InfraEvidence.Mermaid;

public interface IAzureInventorySnapshotGraphResolver
{
    Task<AzureInventorySnapshotGraphResolveResult> TryResolveGraphAsync(
        ScopeContext scope,
        Guid snapshotId,
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
}
