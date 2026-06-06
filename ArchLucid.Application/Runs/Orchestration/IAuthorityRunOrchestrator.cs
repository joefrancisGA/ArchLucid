using ArchLucid.ContextIngestion.Models;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
///     End-to-end authority pipeline: context ingestion → graph → findings → decision engine → manifest → artifacts →
///     (optional) retrieval indexing.
/// </summary>
/// <remarks>
///     Implementation lives in <see cref="AuthorityRunOrchestrator" />; InMemory hosts register it directly as this port;
///     SQL hosts register <c>DtfAuthorityRunOrchestrator</c> as a thin forwarder.
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
    /// <param name="enlistUnitOfWork">
    ///     When set, run header and deferred outbox rows enlist in this unit of work and are not committed by the orchestrator.
    ///     Only valid when async authority queue mode is active.
    /// </param>
    /// <returns>
    ///     The persisted run with snapshot and manifest ids populated (or only <see cref="RunRecord.RunId" /> when deferred).
    /// </returns>
    Task<RunRecord> ExecuteAsync(
        ContextIngestionRequest request,
        CancellationToken cancellationToken = default,
        string? evidenceBundleIdForDeferredWork = null,
        IArchLucidUnitOfWork? enlistUnitOfWork = null);

    /// <summary>
    ///     Worker entry point: completes the pipeline for a run that was started with queued context/graph stages.
    /// </summary>
    Task<RunRecord> CompleteQueuedAuthorityPipelineAsync(
        ContextIngestionRequest request,
        CancellationToken cancellationToken = default);
}
