using System.Text.Json;

using ArchLucid.Application.Architecture;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Coordinates architecture run create/execute/commit/replay orchestrators behind a single application façade.
/// </summary>
public sealed class ArchitectureRunCommandService(
    IArchitectureRunCreateOrchestrator architectureRunCreateOrchestrator,
    IArchitectureRunBatchCreateOrchestrator architectureRunBatchCreateOrchestrator,
    IArchitectureRunExecuteOrchestrator architectureRunExecuteOrchestrator,
    IArchitectureRunCommitOrchestrator architectureRunCommitOrchestrator,
    IReplayRunService replayRunService,
    ICommitRunIdempotencyCoordinator commitRunIdempotencyCoordinator,
    ICommitSponsorEmailNotifier commitSponsorEmailNotifier,
    IArchitectureSynthesisKernel architectureSynthesisKernel) : IArchitectureRunCommandService
{
    private readonly IArchitectureRunCreateOrchestrator _architectureRunCreateOrchestrator =
        architectureRunCreateOrchestrator ?? throw new ArgumentNullException(nameof(architectureRunCreateOrchestrator));

    private readonly IArchitectureRunBatchCreateOrchestrator _architectureRunBatchCreateOrchestrator =
        architectureRunBatchCreateOrchestrator
        ?? throw new ArgumentNullException(nameof(architectureRunBatchCreateOrchestrator));

    private readonly IArchitectureRunExecuteOrchestrator _architectureRunExecuteOrchestrator =
        architectureRunExecuteOrchestrator ?? throw new ArgumentNullException(nameof(architectureRunExecuteOrchestrator));

    private readonly IArchitectureRunCommitOrchestrator _architectureRunCommitOrchestrator =
        architectureRunCommitOrchestrator ?? throw new ArgumentNullException(nameof(architectureRunCommitOrchestrator));

    private readonly IReplayRunService _replayRunService =
        replayRunService ?? throw new ArgumentNullException(nameof(replayRunService));

    private readonly ICommitRunIdempotencyCoordinator _commitRunIdempotencyCoordinator =
        commitRunIdempotencyCoordinator ?? throw new ArgumentNullException(nameof(commitRunIdempotencyCoordinator));

    private readonly ICommitSponsorEmailNotifier _commitSponsorEmailNotifier =
        commitSponsorEmailNotifier ?? throw new ArgumentNullException(nameof(commitSponsorEmailNotifier));

    private readonly IArchitectureSynthesisKernel _architectureSynthesisKernel =
        architectureSynthesisKernel ?? throw new ArgumentNullException(nameof(architectureSynthesisKernel));

    public async Task<CreateRunCommandResult> CreateRunAsync(
        ScopeContext scope,
        ArchitectureRequest request,
        string? idempotencyKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(request);

        CreateRunIdempotencyState? idempotency = BuildCreateRunIdempotency(scope, idempotencyKey, request);

        if (string.Equals(
                request.WorkflowIntent,
                ArchitectureWorkflowIntent.CreateArchitecture,
                StringComparison.OrdinalIgnoreCase))
        {
            ArchitectureSynthesisGenerateResult generated =
                await _architectureSynthesisKernel.GenerateAsync(request, idempotency, cancellationToken);

            return new CreateRunCommandResult { SynthesisResult = generated };
        }

        CreateRunResult result =
            await _architectureRunCreateOrchestrator.CreateRunAsync(request, idempotency, cancellationToken);

        return new CreateRunCommandResult { StandardResult = result };
    }

    public Task<BatchCreateRunOrchestrationResult> CreateRunBatchAsync(
        ScopeContext scope,
        IReadOnlyList<ArchitectureRequest> requests,
        string? idempotencyKey,
        string correlationId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(requests);
        ArgumentException.ThrowIfNullOrWhiteSpace(correlationId);

        CreateRunIdempotencyState? idempotency = BuildBatchCreateRunIdempotency(scope, idempotencyKey, requests);

        return _architectureRunBatchCreateOrchestrator.CreateBatchAsync(
            requests,
            idempotency,
            correlationId,
            cancellationToken);
    }

    public Task<ExecuteRunResult> ExecuteRunAsync(string runId, CancellationToken cancellationToken = default) =>
        _architectureRunExecuteOrchestrator.ExecuteRunAsync(runId, cancellationToken);

    public Task<ExecuteRunResult> ExecuteRunSelectiveAsync(
        string runId,
        SelectiveAgentExecuteRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        return _architectureRunExecuteOrchestrator.ExecuteSelectiveRunAsync(runId, request, cancellationToken);
    }

    public async Task<CommitRunIdempotencyOutcome> CommitRunAsync(
        ScopeContext scope,
        string runId,
        CommitRunRequest? request,
        string? idempotencyKey,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        CommitRunIdempotencyState? idempotency = idempotencyKey is null
            ? null
            : CommitRunIdempotencyState.Create(scope, runId, request, idempotencyKey);

        CommitRunIdempotencyOutcome outcome = await _commitRunIdempotencyCoordinator.CommitAsync(
            idempotency,
            token => _architectureRunCommitOrchestrator.CommitRunAsync(runId, request, token),
            cancellationToken);

        if (request?.NotifySponsor == true && !outcome.IdempotentReplay)
        {
            await _commitSponsorEmailNotifier.NotifyAfterCommitAsync(scope.TenantId, runId, cancellationToken);
        }

        return outcome;
    }

    public Task<ReplayRunResult> ReplayRunAsync(
        string runId,
        string executionMode,
        bool commitReplay,
        string? manifestVersionOverride,
        CancellationToken cancellationToken = default) =>
        _replayRunService.ReplayAsync(runId, executionMode, commitReplay, manifestVersionOverride, cancellationToken);

    private static CreateRunIdempotencyState? BuildBatchCreateRunIdempotency(
        ScopeContext scope,
        string? idempotencyKey,
        IReadOnlyList<ArchitectureRequest> requests) =>
        string.IsNullOrWhiteSpace(idempotencyKey)
            ? null
            : BuildCreateRunIdempotency(
                scope,
                idempotencyKey,
                ArchitectureRunIdempotencyHashing.HashIdempotencyKey(JsonSerializer.Serialize(requests)));

    private static CreateRunIdempotencyState? BuildCreateRunIdempotency(
        ScopeContext scope,
        string? idempotencyKey,
        ArchitectureRequest request) =>
        string.IsNullOrWhiteSpace(idempotencyKey)
            ? null
            : BuildCreateRunIdempotency(
                scope,
                idempotencyKey,
                ArchitectureRunIdempotencyHashing.FingerprintRequest(request));

    private static CreateRunIdempotencyState BuildCreateRunIdempotency(
        ScopeContext scope,
        string idempotencyKey,
        byte[] requestFingerprint) =>
        new(
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            ArchitectureRunIdempotencyHashing.HashIdempotencyKey(idempotencyKey),
            requestFingerprint);
}
