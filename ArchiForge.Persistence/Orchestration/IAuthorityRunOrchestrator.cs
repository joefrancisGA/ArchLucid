using ArchiForge.ContextIngestion.Models;
using ArchiForge.Persistence.Models;

namespace ArchiForge.Persistence.Orchestration;

/// <summary>
/// End-to-end authority pipeline: context ingestion → graph → findings → decision engine → manifest → artifacts → (optional) retrieval indexing.
/// </summary>
/// <remarks>
/// Implementation: <see cref="AuthorityRunOrchestrator"/>. Primary caller: <c>ArchiForge.Coordinator.Services.CoordinatorService</c>. Registered scoped in API storage extensions.
/// Uses <see cref="ArchiForge.Persistence.Transactions.IArchiForgeUnitOfWork"/> when the factory supports transactional persistence; rolls back on failure.
/// </remarks>
public interface IAuthorityRunOrchestrator
{
    /// <summary>
    /// Creates a <see cref="RunRecord"/>, ingests context, builds snapshots, runs <see cref="Decisioning.Interfaces.IDecisionEngine.DecideAsync"/>, synthesizes artifacts, commits the unit of work, audits milestones, then best-effort semantic indexing.
    /// </summary>
    /// <param name="request">Ingestion payload; <see cref="ContextIngestion.Models.ContextIngestionRequest.RunId"/> is set to the new run id.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>The persisted run with snapshot and manifest ids populated.</returns>
    /// <remarks>
    /// Scope comes from <see cref="ArchiForge.Core.Scoping.IScopeContextProvider.GetCurrentScope"/>. Retrieval indexing runs after commit; failures are logged and do not fail the run.
    /// </remarks>
    Task<RunRecord> ExecuteAsync(
        ContextIngestionRequest request,
        CancellationToken ct);
}
