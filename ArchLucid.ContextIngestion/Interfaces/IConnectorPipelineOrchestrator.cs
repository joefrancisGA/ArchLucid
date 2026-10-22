using ArchLucid.ContextIngestion.Models;

namespace ArchLucid.ContextIngestion.Interfaces;

/// <summary>
///     Runs connector fetch/normalize (parallel) then delta/summary segments (sequential pipeline order).
/// </summary>
public interface IConnectorPipelineOrchestrator
{
    Task<ConnectorPipelineStagesOutcome> RunStagesAsync(
        ContextIngestionRequest request,
        ContextSnapshot? previousSnapshot,
        CancellationToken ct);
}
