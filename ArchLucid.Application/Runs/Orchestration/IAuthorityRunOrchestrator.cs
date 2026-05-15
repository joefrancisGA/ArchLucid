using ArchLucid.ContextIngestion.Models;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     End-to-end authority pipeline: context ingestion → graph → findings → decision engine → manifest → artifacts →
///     (optional) retrieval indexing.
/// </summary>
/// <remarks>
///     The SQL-backed orchestration body lives in <c>ArchLucid.Persistence.Orchestration.AuthorityRunOrchestrator</c> and is
///     registered against this abstraction in host composition via a forwarding adapter so application code does not depend
///     on persistence orchestration namespaces. Primary caller:
///     <see cref="ArchLucid.Application.Runs.Coordination.ArchitectureRunAuthorityCoordination" />.
/// </remarks>
public interface IAuthorityRunOrchestrator
{
    /// <summary>
    ///     Creates a <see cref="RunRecord" />, ingests context, builds snapshots, runs decisioning, synthesizes artifacts,
    ///     commits the unit of work, audits milestones, then best-effort semantic indexing.
    ///     When the async authority feature is enabled, may persist only the run header and enqueue continuation work;
    ///     <see cref="RunRecord.ContextSnapshotId" /> remains <see langword="null" /> until the worker completes
    ///     <see cref="CompleteQueuedAuthorityPipelineAsync" />.
    /// </summary>
    /// <param name="request">
    ///     Ingestion payload; <see cref="ContextIngestion.Models.ContextIngestionRequest.RunId" /> is set to the new run id.
    /// </param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <param name="evidenceBundleIdForDeferredWork">
    ///     When deferring, serialized into the work outbox so starter tasks reference the same evidence bundle id.
    /// </param>
    /// <returns>
    ///     The persisted run with snapshot and manifest ids populated (or only <see cref="RunRecord.RunId" /> when deferred).
    /// </returns>
    Task<RunRecord> ExecuteAsync(
        ContextIngestionRequest request,
        CancellationToken cancellationToken = default,
        string? evidenceBundleIdForDeferredWork = null);

    /// <summary>
    ///     Worker entry point: completes the pipeline for a run that was started with queued context/graph stages.
    /// </summary>
    Task<RunRecord> CompleteQueuedAuthorityPipelineAsync(
        ContextIngestionRequest request,
        CancellationToken cancellationToken = default);
}
