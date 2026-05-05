namespace ArchLucid.ContextIngestion.Interfaces;

/// <summary>
///     Runs connector fetch/normalize (parallel) then delta/summary segments (sequential pipeline order).
/// </summary>
public interface IConnectorPipelineOrchestrator
{
    Task<ArchLucid.ContextIngestion.Models.ConnectorPipelineStagesOutcome> RunStagesAsync(
        ArchLucid.ContextIngestion.Models.ContextIngestionRequest request,
        ArchLucid.ContextIngestion.Models.ContextSnapshot? previousSnapshot,
        CancellationToken ct);
}
