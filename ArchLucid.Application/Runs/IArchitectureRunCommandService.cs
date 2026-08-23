using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Runs;

/// <summary>
///     Application façade for architecture run mutations (create, execute, commit, replay) so HTTP controllers
///     depend on one service instead of the full orchestrator graph.
/// </summary>
public interface IArchitectureRunCommandService
{
    /// <summary>
    ///     Creates a run via synthesis or the review create orchestrator, honoring optional idempotency state.
    /// </summary>
    Task<CreateRunCommandResult> CreateRunAsync(
        ScopeContext scope,
        ArchitectureRequest request,
        string? idempotencyKey,
        CancellationToken cancellationToken = default);

    /// <summary>Creates up to 50 architecture runs in one batch with optional idempotency replay semantics.</summary>
    Task<BatchCreateRunOrchestrationResult> CreateRunBatchAsync(
        ScopeContext scope,
        IReadOnlyList<ArchitectureRequest> requests,
        string? idempotencyKey,
        string correlationId,
        CancellationToken cancellationToken = default);

    /// <summary>Executes all pending agent tasks for <paramref name="runId" />.</summary>
    Task<ExecuteRunResult> ExecuteRunAsync(string runId, CancellationToken cancellationToken = default);

    /// <summary>TB-938: re-executes selected agents/tasks for <paramref name="runId" />.</summary>
    Task<ExecuteRunResult> ExecuteRunSelectiveAsync(
        string runId,
        SelectiveAgentExecuteRequest request,
        CancellationToken cancellationToken = default);

    /// <summary>
    ///     Commits agent results for <paramref name="runId" />, applies idempotency replay semantics, and optionally
    ///     notifies the commit sponsor.
    /// </summary>
    Task<CommitRunIdempotencyOutcome> CommitRunAsync(
        ScopeContext scope,
        string runId,
        CommitRunRequest? request,
        string? idempotencyKey,
        CancellationToken cancellationToken = default);

    /// <summary>Replays <paramref name="runId" /> by cloning tasks/evidence and re-executing agents.</summary>
    Task<ReplayRunResult> ReplayRunAsync(
        string runId,
        string executionMode,
        bool commitReplay,
        string? manifestVersionOverride,
        CancellationToken cancellationToken = default);
}
