using ArchLucid.Application.Operations;
using ArchLucid.Application.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Application.Runs.Orchestration.Execute;

/// <inheritdoc cref="IArchitectureRunExecuteCancellationGuardStage" />
public sealed class ArchitectureRunExecuteCancellationGuardStage(
    IScopeContextProvider scopeContextProvider,
    IRunRepository runRepository,
    IOperationCancellationRegistry operationCancellationRegistry,
    OperationRunCancellationMarker runCancellationMarker) : IArchitectureRunExecuteCancellationGuardStage
{
    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IOperationCancellationRegistry _operationCancellationRegistry =
        operationCancellationRegistry ?? throw new ArgumentNullException(nameof(operationCancellationRegistry));

    private readonly OperationRunCancellationMarker _runCancellationMarker =
        runCancellationMarker ?? throw new ArgumentNullException(nameof(runCancellationMarker));

    /// <inheritdoc />
    public async Task ThrowIfCooperativeCancelRequestedAsync(string runId, CancellationToken cancellationToken)
    {
        if (!ArchitectureRunExecuteRunIdHelper.TryParseRunGuid(runId, out Guid runGuid))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string operationId = OperationIdCodec.ForRun(runGuid);

        if (!_operationCancellationRegistry.IsCancelRequested(scope, operationId))
            return;

        await _runCancellationMarker.TryMarkRunCanceledAsync(scope, runGuid, cancellationToken);

        throw new OperationCooperativeCanceledException(runId);
    }
}
