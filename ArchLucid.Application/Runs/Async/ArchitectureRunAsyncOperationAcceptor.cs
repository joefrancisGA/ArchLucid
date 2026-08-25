using ArchLucid.Application.Common;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Runs.Async;

/// <summary>Accepts async execute/replay/create and returns unified operation handles (TB-2075).</summary>
public interface IArchitectureRunAsyncOperationAcceptor
{
    /// <summary>
    ///     Validates scope, enqueues background work, and returns the operation id for poll
    ///     (<c>run:{runId}</c>).
    /// </summary>
    /// <exception cref="RunNotFoundException">When <paramref name="runId" /> is not in scope.</exception>
    /// <exception cref="ConflictException">When the same async operation is already in flight.</exception>
    Task<string> AcceptExecuteAsync(
        string runId,
        ScopeContext scope,
        string actor,
        string correlationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Prepares a replay run synchronously, enqueues agent execution, and returns
    ///     <c>run:{replayRunId}</c> for poll.
    /// </summary>
    Task<string> AcceptReplayAsync(
        string originalRunId,
        string executionMode,
        bool commitReplay,
        string? manifestVersionOverride,
        ScopeContext scope,
        string actor,
        string correlationId,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Fast-admits create (request + run stub + idempotency), enqueues coordination, and returns
    ///     <c>run:{runId}</c> for poll (Tier C create sibling).
    /// </summary>
    Task<string> AcceptCreateAsync(
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency,
        ScopeContext scope,
        string actor,
        string correlationId,
        CancellationToken cancellationToken = default);
}

public sealed class ArchitectureRunAsyncOperationAcceptor(
    IRunRepository runRepository,
    IArchitectureRunAsyncOperationQueue queue,
    IArchitectureRunAsyncOperationRegistrar registrar,
    IReplayRunService replayRunService,
    IArchitectureRunAsyncCreateAdmitter createAdmitter) : IArchitectureRunAsyncOperationAcceptor
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IArchitectureRunAsyncOperationQueue _queue =
        queue ?? throw new ArgumentNullException(nameof(queue));

    private readonly IArchitectureRunAsyncOperationRegistrar _registrar =
        registrar ?? throw new ArgumentNullException(nameof(registrar));

    private readonly IReplayRunService _replayRunService =
        replayRunService ?? throw new ArgumentNullException(nameof(replayRunService));

    private readonly IArchitectureRunAsyncCreateAdmitter _createAdmitter =
        createAdmitter ?? throw new ArgumentNullException(nameof(createAdmitter));

    public async Task<string> AcceptExecuteAsync(
        string runId,
        ScopeContext scope,
        string actor,
        string correlationId,
        CancellationToken cancellationToken = default)
    {
        Guid parsedRunId = ParseRunId(runId);
        await EnsureRunInScopeAsync(scope, parsedRunId, cancellationToken);

        if (!_registrar.TryRegister(scope, runId, ArchitectureRunAsyncOperationKind.Execute))
            throw new ConflictException($"Async execute is already in flight for run '{runId}'.");

        try
        {
            await _queue.EnqueueAsync(
                new ArchitectureRunAsyncOperationWorkItem(
                    ArchitectureRunAsyncOperationKind.Execute,
                    scope,
                    actor,
                    correlationId,
                    runId,
                    ReplayExecutionMode: null,
                    ReplayCommit: false,
                    ReplayManifestVersionOverride: null,
                    PreparedReplayRunId: null),
                cancellationToken);

            return OperationIdCodec.ForRun(parsedRunId);
        }
        catch
        {
            _registrar.Release(scope, runId, ArchitectureRunAsyncOperationKind.Execute);
            throw;
        }
    }

    public async Task<string> AcceptReplayAsync(
        string originalRunId,
        string executionMode,
        bool commitReplay,
        string? manifestVersionOverride,
        ScopeContext scope,
        string actor,
        string correlationId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(executionMode);

        Guid parsedOriginalRunId = ParseRunId(originalRunId);
        await EnsureRunInScopeAsync(scope, parsedOriginalRunId, cancellationToken);

        if (!_registrar.TryRegister(scope, originalRunId, ArchitectureRunAsyncOperationKind.Replay))
            throw new ConflictException($"Async replay is already in flight for run '{originalRunId}'.");

        try
        {
            string preparedReplayRunId = await _replayRunService.PrepareReplayRunAsync(originalRunId, cancellationToken);
            Guid parsedReplayRunId = ParseRunId(preparedReplayRunId);

            await _queue.EnqueueAsync(
                new ArchitectureRunAsyncOperationWorkItem(
                    ArchitectureRunAsyncOperationKind.Replay,
                    scope,
                    actor,
                    correlationId,
                    originalRunId,
                    executionMode,
                    commitReplay,
                    manifestVersionOverride,
                    preparedReplayRunId),
                cancellationToken);

            return OperationIdCodec.ForRun(parsedReplayRunId);
        }
        catch
        {
            _registrar.Release(scope, originalRunId, ArchitectureRunAsyncOperationKind.Replay);
            throw;
        }
    }

    public async Task<string> AcceptCreateAsync(
        ArchitectureRequest request,
        CreateRunIdempotencyState? idempotency,
        ScopeContext scope,
        string actor,
        string correlationId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(scope);

        ArchitectureRunAsyncCreateAdmitResult admitResult =
            await _createAdmitter.AdmitAsync(request, idempotency, scope, cancellationToken);

        string runId = admitResult.RunId.ToString("N");
        string operationId = OperationIdCodec.ForRun(admitResult.RunId);

        if (admitResult.IdempotentReplay)
        {
            if (!await IsCreateIncompleteAsync(scope, admitResult.RunId, cancellationToken))
                return operationId;

            if (_registrar.IsRegistered(scope, runId, ArchitectureRunAsyncOperationKind.Create))
                return operationId;
        }

        if (!_registrar.TryRegister(scope, runId, ArchitectureRunAsyncOperationKind.Create))
        {
            if (admitResult.IdempotentReplay)
                return operationId;

            throw new ConflictException($"Async create is already in flight for run '{runId}'.");
        }

        try
        {
            await _queue.EnqueueAsync(
                new ArchitectureRunAsyncOperationWorkItem(
                    ArchitectureRunAsyncOperationKind.Create,
                    scope,
                    actor,
                    correlationId,
                    runId,
                    ReplayExecutionMode: null,
                    ReplayCommit: false,
                    ReplayManifestVersionOverride: null,
                    PreparedReplayRunId: null,
                    CreateRequest: request,
                    CreateIdempotency: idempotency),
                cancellationToken);

            return operationId;
        }
        catch
        {
            _registrar.Release(scope, runId, ArchitectureRunAsyncOperationKind.Create);
            throw;
        }
    }

    private async Task<bool> IsCreateIncompleteAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runId, cancellationToken);

        return ArchitectureRunAsyncCreateCompleteness.IsIncomplete(header);
    }

    private async Task EnsureRunInScopeAsync(ScopeContext scope, Guid runId, CancellationToken cancellationToken)
    {
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runId, cancellationToken);

        if (run is null)
            throw new RunNotFoundException(runId.ToString("D"));
    }

    private static Guid ParseRunId(string runId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!Guid.TryParse(runId, out Guid parsed))
            throw new ArgumentException($"Run id '{runId}' is not a valid GUID.", nameof(runId));

        return parsed;
    }
}
