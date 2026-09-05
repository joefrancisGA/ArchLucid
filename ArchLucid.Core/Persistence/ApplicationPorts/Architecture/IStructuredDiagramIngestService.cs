using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public interface IStructuredDiagramIngestService
{
    Task<StructuredDiagramIngestResult> IngestAsync(
        ScopeContext scope,
        Guid runId,
        StructuredDiagramIngestRequest request,
        CancellationToken cancellationToken = default);

    Task<ArchitectureDiagramModelRecord?> TryGetModelAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken = default);
}
