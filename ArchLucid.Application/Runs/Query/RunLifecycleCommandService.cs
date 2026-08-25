using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Query;

/// <inheritdoc cref="IRunLifecycleCommandService"/>
public sealed class RunLifecycleCommandService(IArchitectureRunCommandService architectureRunCommandService)
    : IRunLifecycleCommandService
{
    private readonly IArchitectureRunCommandService _architectureRunCommandService =
        architectureRunCommandService ?? throw new ArgumentNullException(nameof(architectureRunCommandService));

    public IdempotencyKeyValidationResult ValidateIdempotencyKey(string? rawHeaderValue)
    {
        if (rawHeaderValue is null)
            return new IdempotencyKeyValidationResult(true, null, null);

        string trimmedKey = rawHeaderValue.Trim();

        if (trimmedKey.Length > ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength)
        {
            return new IdempotencyKeyValidationResult(
                false,
                null,
                $"Idempotency-Key must be at most {ArchitectureRunIdempotencyHashing.MaxIdempotencyKeyLength} characters after trim.");
        }

        return new IdempotencyKeyValidationResult(true, trimmedKey.Length == 0 ? null : trimmedKey, null);
    }

    public Task<CreateRunCommandResult> CreateRunAsync(
        ScopeContext scope,
        ArchitectureRequest request,
        string? idempotencyKey,
        CancellationToken cancellationToken = default) =>
        _architectureRunCommandService.CreateRunAsync(scope, request, idempotencyKey, cancellationToken);

    public Task<BatchCreateRunOrchestrationResult> CreateRunBatchAsync(
        ScopeContext scope,
        IReadOnlyList<ArchitectureRequest> requests,
        string? idempotencyKey,
        string correlationId,
        CancellationToken cancellationToken = default) =>
        _architectureRunCommandService.CreateRunBatchAsync(scope, requests, idempotencyKey, correlationId, cancellationToken);

    public Task<ExecuteRunResult> ExecuteRunAsync(string runId, CancellationToken cancellationToken = default) =>
        _architectureRunCommandService.ExecuteRunAsync(runId, cancellationToken);

    public Task<ExecuteRunResult> ExecuteRunSelectiveAsync(
        string runId,
        SelectiveAgentExecuteRequest request,
        CancellationToken cancellationToken = default) =>
        _architectureRunCommandService.ExecuteRunSelectiveAsync(runId, request, cancellationToken);

    public Task<CommitRunIdempotencyOutcome> CommitRunAsync(
        ScopeContext scope,
        string runId,
        CommitRunRequest? request,
        string? idempotencyKey,
        CancellationToken cancellationToken = default) =>
        _architectureRunCommandService.CommitRunAsync(scope, runId, request, idempotencyKey, cancellationToken);

    public Task<ReplayRunResult> ReplayRunAsync(
        string runId,
        string? executionMode,
        bool commitReplay,
        string? manifestVersionOverride,
        CancellationToken cancellationToken = default) =>
        _architectureRunCommandService.ReplayRunAsync(
            runId,
            executionMode ?? string.Empty,
            commitReplay,
            manifestVersionOverride,
            cancellationToken);
}
