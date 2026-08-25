using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs.Query;

/// <summary>
///     Application command surface for architecture run lifecycle mutations (create, execute, commit, replay).
/// </summary>
public interface IRunLifecycleCommandService
{
    IdempotencyKeyValidationResult ValidateIdempotencyKey(string? rawHeaderValue);

    Task<CreateRunCommandResult> CreateRunAsync(
        ScopeContext scope,
        ArchitectureRequest request,
        string? idempotencyKey,
        CancellationToken cancellationToken = default);

    Task<BatchCreateRunOrchestrationResult> CreateRunBatchAsync(
        ScopeContext scope,
        IReadOnlyList<ArchitectureRequest> requests,
        string? idempotencyKey,
        string correlationId,
        CancellationToken cancellationToken = default);

    Task<ExecuteRunResult> ExecuteRunAsync(string runId, CancellationToken cancellationToken = default);

    Task<ExecuteRunResult> ExecuteRunSelectiveAsync(
        string runId,
        SelectiveAgentExecuteRequest request,
        CancellationToken cancellationToken = default);

    Task<CommitRunIdempotencyOutcome> CommitRunAsync(
        ScopeContext scope,
        string runId,
        CommitRunRequest? request,
        string? idempotencyKey,
        CancellationToken cancellationToken = default);

    Task<ReplayRunResult> ReplayRunAsync(
        string runId,
        string? executionMode,
        bool commitReplay,
        string? manifestVersionOverride,
        CancellationToken cancellationToken = default);
}

public sealed record IdempotencyKeyValidationResult(bool IsValid, string? Key, string? ErrorMessage);
