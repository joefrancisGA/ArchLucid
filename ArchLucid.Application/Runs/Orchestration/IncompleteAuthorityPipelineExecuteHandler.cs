using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Async;
using ArchLucid.ContextIngestion.Mapping;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration;

/// <inheritdoc cref="IIncompleteAuthorityPipelineExecuteHandler" />
public sealed class IncompleteAuthorityPipelineExecuteHandler(
    IAuthorityRunOrchestrator authorityRunOrchestrator,
    IArchitectureRequestRepository requestRepository,
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider,
    IRunGovernanceScopePinService runGovernanceScopePinService,
    IRunStateTransitionService runStateTransitionService,
    IFailedRunRetryAdmission failedRunRetryAdmission,
    ILogger<IncompleteAuthorityPipelineExecuteHandler> logger) : IIncompleteAuthorityPipelineExecuteHandler
{
    private readonly IAuthorityRunOrchestrator _authorityRunOrchestrator =
        authorityRunOrchestrator ?? throw new ArgumentNullException(nameof(authorityRunOrchestrator));

    private readonly IArchitectureRequestRepository _requestRepository =
        requestRepository ?? throw new ArgumentNullException(nameof(requestRepository));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly IRunGovernanceScopePinService _runGovernanceScopePinService =
        runGovernanceScopePinService ?? throw new ArgumentNullException(nameof(runGovernanceScopePinService));

    private readonly IRunStateTransitionService _runStateTransitionService =
        runStateTransitionService ?? throw new ArgumentNullException(nameof(runStateTransitionService));

    private readonly IFailedRunRetryAdmission _failedRunRetryAdmission =
        failedRunRetryAdmission ?? throw new ArgumentNullException(nameof(failedRunRetryAdmission));

    private readonly ILogger<IncompleteAuthorityPipelineExecuteHandler> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<ExecuteRunResult?> TryResumeAsync(
        ArchitectureRun run,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        int scheduledTaskCount = run.TaskIds?.Count ?? 0;

        if (!_runStateTransitionService.ShouldResumeDeferredAuthorityPipelineOnExecute(
                run.Status,
                run.ContextSnapshotId,
                scheduledTaskCount))
        {
            return null;
        }

        if (!TryParseRunGuid(runId, out Guid runGuid))
            return null;

        if (string.IsNullOrWhiteSpace(run.RequestId))
        {
            throw new InvalidOperationException(
                $"Run '{runId}' has no architecture request id; cannot resume the deferred authority pipeline.");
        }

        ArchitectureRequest request =
            await _requestRepository.GetByIdAsync(run.RequestId, cancellationToken)
            ?? throw new InvalidOperationException(
                $"Request '{run.RequestId}' not found; cannot resume the deferred authority pipeline.");

        ContextIngestionRequest ingestionRequest = ContextIngestionRequestMapper.FromArchitectureRequest(request);
        ingestionRequest.RunId = runGuid;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        await _failedRunRetryAdmission.TryMarkRetryingAsync(scope, runGuid, cancellationToken);

        RunRecord? runHeader = await _runRepository
            .GetByIdAsync(scope, runGuid, cancellationToken)
            .ConfigureAwait(false);

        if (runHeader is null)
        {
            throw new InvalidOperationException(
                $"Run '{runId}' header was not found; cannot resume the deferred authority pipeline.");
        }

        ReplayRunScopeAssertionGuard.EnsureCallerScopeMatchesSourceOrThrow(scope, runHeader, runId);

        if (_logger.IsEnabled(LogLevel.Information))
        {
            _logger.LogInformation(
                "Resuming deferred authority pipeline on execute: RunId={RunId}, PreviousStatus={Status}",
                LogSanitizer.Sanitize(runId),
                run.Status);
        }

        using IDisposable restoredPilotScope = _runGovernanceScopePinService.BeginRestoredScope(runHeader);

        await _authorityRunOrchestrator.CompleteQueuedAuthorityPipelineAsync(ingestionRequest, cancellationToken);

        return new ExecuteRunResult { RunId = runId, Results = [] };
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
