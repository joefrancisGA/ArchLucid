using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Persistence.Graph;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Runs finding engines and assembles a findings snapshot for a run.</summary>
public interface IFindingsOrchestrator
{
    Task<FindingsSnapshot> GenerateFindingsSnapshotAsync(
        Guid runId,
        Guid contextSnapshotId,
        GraphSnapshot graphSnapshot,
        CancellationToken ct);
}
