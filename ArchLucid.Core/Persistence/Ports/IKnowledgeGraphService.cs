using ArchLucid.Contracts.Persistence.Context;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.Persistence.Ports;

public interface IKnowledgeGraphService
{
    Task<GraphSnapshot> BuildSnapshotAsync(
        ContextSnapshot contextSnapshot,
        CancellationToken ct);
}

