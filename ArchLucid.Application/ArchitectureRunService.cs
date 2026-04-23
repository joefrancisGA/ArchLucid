using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Application;

/// <summary>
/// Facade over create, execute, and commit orchestrators for the three-phase architecture run workflow.
/// </summary>
/// <remarks>
/// Implementation types: <see cref="ArchitectureRunCreateOrchestrator"/>, <see cref="ArchitectureRunExecuteOrchestrator"/>, <see cref="AuthorityDrivenArchitectureRunCommitOrchestrator"/> (scoped DI for commit).
/// </remarks>
public sealed class ArchitectureRunService(
    IArchitectureRunCreateOrchestrator createOrchestrator,
    IArchitectureRunExecuteOrchestrator executeOrchestrator,
    IArchitectureRunCommitOrchestrator commitOrchestrator) : IArchitectureRunService
{
    private readonly IArchitectureRunCreateOrchestrator _createOrchestrator =
        createOrchestrator ?? throw new ArgumentNullException(nameof(createOrchestrator));
    private readonly IArchitectureRunExecuteOrchestrator _executeOrchestrator =
        executeOrchestrator ?? throw new ArgumentNullException(nameof(executeOrchestrator));
    private readonly IArchitectureRunCommitOrchestrator _commitOrchestrator =
        commitOrchestrator ?? throw new ArgumentNullException(nameof(commitOrchestrator));

    /// <inheritdoc />
    public Task<CreateRunResult> CreateRunAsync(
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency = null,
        CancellationToken cancellationToken = default) =>
        _createOrchestrator.CreateRunAsync(request, idempotency, cancellationToken);

    /// <inheritdoc />
    public Task<ExecuteRunResult> ExecuteRunAsync(string runId, CancellationToken cancellationToken = default) =>
        _executeOrchestrator.ExecuteRunAsync(runId, cancellationToken);

    /// <inheritdoc />
    public Task<CommitRunResult> CommitRunAsync(string runId, CancellationToken cancellationToken = default) =>
        _commitOrchestrator.CommitRunAsync(runId, cancellationToken);
}
