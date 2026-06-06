using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Core.Transactions;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Host.Composition.Orchestration;

/// <summary>
///     Durable Task–backed authority pipeline orchestrator port. Forwards to
///     <see cref="AuthorityRunOrchestrator" /> until DTF schedules and resumes work end-to-end; the SQL storage host
///     registers this type as <see cref="IAuthorityRunOrchestrator" /> (InMemory hosts register
///     <see cref="AuthorityRunOrchestrator" /> directly).
/// </summary>
internal sealed class DtfAuthorityRunOrchestrator(AuthorityRunOrchestrator innerOrchestrator) : IAuthorityRunOrchestrator
{
    private readonly AuthorityRunOrchestrator _innerOrchestrator =
        innerOrchestrator ?? throw new ArgumentNullException(nameof(innerOrchestrator));

    /// <inheritdoc />
    public Task<RunRecord> ExecuteAsync(
        ContextIngestionRequest request,
        CancellationToken cancellationToken = default,
        string? evidenceBundleIdForDeferredWork = null,
        IArchLucidUnitOfWork? enlistUnitOfWork = null)
        =>
        _innerOrchestrator.ExecuteAsync(request, cancellationToken, evidenceBundleIdForDeferredWork, enlistUnitOfWork);

    /// <inheritdoc />
    public Task<RunRecord> CompleteQueuedAuthorityPipelineAsync(
        ContextIngestionRequest request,
        CancellationToken cancellationToken = default)
        => _innerOrchestrator.CompleteQueuedAuthorityPipelineAsync(request, cancellationToken);
}
