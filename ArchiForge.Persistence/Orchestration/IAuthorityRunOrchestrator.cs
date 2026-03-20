using ArchiForge.ContextIngestion.Models;
using ArchiForge.Persistence.Models;

namespace ArchiForge.Persistence.Orchestration;

/// <summary>
/// Builds and persists the full authority chain for a run (optionally inside a single SQL transaction).
/// </summary>
public interface IAuthorityRunOrchestrator
{
    Task<RunRecord> ExecuteAsync(
        ContextIngestionRequest request,
        CancellationToken ct);
}
