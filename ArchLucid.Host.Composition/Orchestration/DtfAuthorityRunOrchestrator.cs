using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration;

namespace ArchLucid.Host.Composition.Orchestration;

/// <summary>
///     Durable Task–backed authority pipeline orchestrator port. Forwards to
///     <see cref="AuthorityRunOrchestrator" /> until DTF schedules and resumes work end-to-end; the SQL storage host
///     registers this type as <see cref="IAuthorityRunOrchestrator" /> (InMemory hosts use
///     <see cref="AuthorityRunOrchestratorApplicationAdapter" />).
/// </summary>
internal sealed class DtfAuthorityRunOrchestrator(AuthorityRunOrchestrator innerOrchestrator) : IAuthorityRunOrchestrator
{
    private readonly AuthorityRunOrchestrator _innerOrchestrator =
        innerOrchestrator ?? throw new ArgumentNullException(nameof(innerOrchestrator));

    /// <inheritdoc />
    public Task<RunRecord> ExecuteAsync(
        ContextIngestionRequest request,
        CancellationToken cancellationToken = default,
        string? evidenceBundleIdForDeferredWork = null)
        =>
        _innerOrchestrator.ExecuteAsync(request, cancellationToken, evidenceBundleIdForDeferredWork);

    /// <inheritdoc />
    public Task<RunRecord> CompleteQueuedAuthorityPipelineAsync(
        ContextIngestionRequest request,
        CancellationToken cancellationToken = default)
        => _innerOrchestrator.CompleteQueuedAuthorityPipelineAsync(request, cancellationToken);
}
