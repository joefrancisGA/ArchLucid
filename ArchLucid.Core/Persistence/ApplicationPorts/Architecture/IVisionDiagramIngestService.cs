using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Architecture;

public interface IVisionDiagramIngestService
{
    Task<VisionDiagramIngestResult> IngestAsync(
        ScopeContext scope,
        Guid runId,
        VisionDiagramIngestRequest request,
        CancellationToken cancellationToken = default);
}
