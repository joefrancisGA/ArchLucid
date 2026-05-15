using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration;

namespace ArchLucid.Host.Composition.Orchestration;

/// <summary>
///     Forwards <see cref="IAuthorityRunOrchestrator" /> calls to <see cref="AuthorityRunOrchestrator" /> so the application
///     layer stays on this port without a Persistence → Application project reference cycle.
/// </summary>
internal sealed class AuthorityRunOrchestratorApplicationAdapter(
    AuthorityRunOrchestrator innerOrchestrator) : IAuthorityRunOrchestrator
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
