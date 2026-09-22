using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration.Pipeline;

public interface IBoundArchitectureInventoryGraphOverlayApplicator
{
    Task<GraphSnapshot> ApplyAsync(
        ScopeContext scope,
        RunRecord run,
        GraphSnapshot graphSnapshot,
        CancellationToken cancellationToken);
}
