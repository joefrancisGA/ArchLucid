using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.DecisionTraces;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Orchestration;

/// <summary>
///     Commits retrieval outbox rows, integration events, audit, and chat-ops notifications after authority artifacts exist.
/// </summary>
public interface IAuthorityCommittedPipelineFinalizer
{
    /// <summary>
    ///     Finalizes the pipeline for a run whose FK chain is already populated on <paramref name="run" />.
    /// </summary>
    Task<RunRecord> FinalizeAsync(
        RunRecord run,
        ContextSnapshot contextSnapshot,
        FindingsSnapshot findingsSnapshot,
        ManifestDocument manifest,
        DecisionTrace trace,
        ScopeContext scope,
        IArchLucidUnitOfWork unitOfWork,
        CancellationToken cancellationToken);
}
