using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Async;

/// <summary>Drains the async execute/replay queue with scoped DI (TB-2075).</summary>
public sealed class ArchitectureRunAsyncOperationHostedService(
    ArchitectureRunAsyncOperationQueue queue,
    IServiceScopeFactory scopeFactory,
    IArchitectureRunAsyncOperationRegistrar registrar,
    IOperationCancellationRegistry operationCancellationRegistry,
    ILogger<ArchitectureRunAsyncOperationHostedService> logger) : BackgroundService
{
    private readonly ArchitectureRunAsyncOperationQueue _queue =
        queue ?? throw new ArgumentNullException(nameof(queue));

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IArchitectureRunAsyncOperationRegistrar _registrar =
        registrar ?? throw new ArgumentNullException(nameof(registrar));

    private readonly IOperationCancellationRegistry _operationCancellationRegistry =
        operationCancellationRegistry ?? throw new ArgumentNullException(nameof(operationCancellationRegistry));

    private readonly ILogger<ArchitectureRunAsyncOperationHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (ArchitectureRunAsyncOperationWorkItem item in _queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await ProcessWorkItemAsync(item, stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogError(
                    ex,
                    "Async run operation failed for run {RunId} kind {Kind}.",
                    item.RunId,
                    item.Kind);
            }
            finally
            {
                _registrar.Release(item.Scope, item.RunId, item.Kind);
            }
        }
    }

    private async Task ProcessWorkItemAsync(
        ArchitectureRunAsyncOperationWorkItem item,
        CancellationToken cancellationToken)
    {
        await using AsyncServiceScope scope = _scopeFactory.CreateAsyncScope();

        using IDisposable _ = AmbientScopeContext.Push(item.Scope);

        string operationRunId = item.Kind == ArchitectureRunAsyncOperationKind.Replay
            ? item.PreparedReplayRunId ?? item.RunId
            : item.RunId;

        if (Guid.TryParse(operationRunId, out Guid parsedRunId))
        {
            string operationId = OperationIdCodec.ForRun(parsedRunId);

            if (_operationCancellationRegistry.IsCancelRequested(item.Scope, operationId))
            {
                OperationRunCancellationMarker runCancellationMarker =
                    scope.ServiceProvider.GetRequiredService<OperationRunCancellationMarker>();

                await runCancellationMarker.TryMarkRunCanceledAsync(item.Scope, parsedRunId, cancellationToken);

                return;
            }
        }

        if (item.Kind == ArchitectureRunAsyncOperationKind.Execute)
        {
            IArchitectureRunExecuteOrchestrator orchestrator =
                scope.ServiceProvider.GetRequiredService<IArchitectureRunExecuteOrchestrator>();

            await orchestrator.ExecuteRunAsync(item.RunId, cancellationToken);

            return;
        }

        if (item.Kind == ArchitectureRunAsyncOperationKind.Create)
        {
            if (item.CreateRequest is null)
                throw new InvalidOperationException("Create work item is missing CreateRequest.");

            if (!Guid.TryParseExact(item.RunId, "N", out Guid parsedCreateRunId)
                && !Guid.TryParse(item.RunId, out parsedCreateRunId))
            {
                throw new InvalidOperationException($"Create work item run id '{item.RunId}' is not a valid GUID.");
            }

            IArchitectureRunCreateOrchestrator createOrchestrator =
                scope.ServiceProvider.GetRequiredService<IArchitectureRunCreateOrchestrator>();

            await createOrchestrator.CompleteAsyncAcceptedCreateRunAsync(
                parsedCreateRunId,
                item.CreateRequest,
                item.CreateIdempotency,
                cancellationToken);

            return;
        }

        IReplayRunService replayRunService = scope.ServiceProvider.GetRequiredService<IReplayRunService>();

        if (string.IsNullOrWhiteSpace(item.PreparedReplayRunId))
            throw new InvalidOperationException("Replay work item is missing PreparedReplayRunId.");

        await replayRunService.ExecutePreparedReplayAsync(
            item.PreparedReplayRunId,
            item.RunId,
            item.ReplayExecutionMode ?? ExecutionModes.Current,
            item.ReplayCommit,
            item.ReplayManifestVersionOverride,
            cancellationToken);
    }
}
