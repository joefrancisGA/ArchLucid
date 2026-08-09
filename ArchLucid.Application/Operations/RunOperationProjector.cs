using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Operations;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Operations;

internal static class RunOperationProjector
{
  internal static OperationDetail Project(
    string operationId,
    RunRecord run,
    IReadOnlyList<AgentTask> tasks,
    bool cancelRequested)
  {
    ArchitectureRunStatus status = ParseStatus(run.LegacyRunStatus);
    OperationState state = MapState(status, run, cancelRequested);
    (string stepLabel, int? currentStep, int? totalSteps) = ResolveProgress(status, tasks);

    if (state == OperationState.CancelRequested)
      stepLabel = "Cancel requested";

    if (state == OperationState.Canceled)
      stepLabel = "Canceled";
    DateTimeOffset heartbeat = ResolveHeartbeat(run, tasks, state);

    OperationResultRef resultRef = new(
      RunId: run.RunId,
      JobId: null,
      DownloadPath: null);

    return new OperationDetail(
      operationId,
      state,
      stepLabel,
      currentStep,
      totalSteps,
      heartbeat,
      resultRef);
  }

  private static ArchitectureRunStatus ParseStatus(string? legacyRunStatus)
  {
    if (string.IsNullOrWhiteSpace(legacyRunStatus))
      return ArchitectureRunStatus.Created;

    if (!Enum.TryParse(legacyRunStatus, ignoreCase: true, out ArchitectureRunStatus parsed))
      return ArchitectureRunStatus.Created;

    return parsed;
  }

  private static OperationState MapState(
    ArchitectureRunStatus status,
    RunRecord run,
    bool cancelRequested)
  {
    if (OperationRunCancellationMarker.IsAlreadyCanceled(run))
      return OperationState.Canceled;

    if (cancelRequested && status is not (
        ArchitectureRunStatus.ReadyForCommit
        or ArchitectureRunStatus.Committed
        or ArchitectureRunStatus.Failed
        or ArchitectureRunStatus.FailedPartial
        or ArchitectureRunStatus.ExecutionCompletedQualityRejected
        or ArchitectureRunStatus.PartiallyCompleted))
      return OperationState.CancelRequested;

    return MapStatusState(status);
  }

  private static OperationState MapStatusState(ArchitectureRunStatus status) =>
    status switch
    {
      ArchitectureRunStatus.Created or ArchitectureRunStatus.TasksGenerated => OperationState.Pending,
      ArchitectureRunStatus.WaitingForResults or ArchitectureRunStatus.Retrying => OperationState.Running,
      ArchitectureRunStatus.ReadyForCommit or ArchitectureRunStatus.Committed => OperationState.Succeeded,
      ArchitectureRunStatus.Failed
        or ArchitectureRunStatus.FailedPartial
        or ArchitectureRunStatus.ExecutionCompletedQualityRejected
        or ArchitectureRunStatus.PartiallyCompleted => OperationState.Failed,
      _ => throw new ArgumentOutOfRangeException(nameof(status), status, "Unknown architecture run status.")
    };

  private static (string StepLabel, int? CurrentStep, int? TotalSteps) ResolveProgress(
    ArchitectureRunStatus status,
    IReadOnlyList<AgentTask> tasks)
  {
    if (status is ArchitectureRunStatus.Created)
      return ("Creating review", null, null);

    if (status is ArchitectureRunStatus.TasksGenerated)
      return ("Agents queued", null, null);

    if (status is ArchitectureRunStatus.Retrying)
      return ("Retrying agents", CountCompletedSteps(tasks), tasks.Count > 0 ? tasks.Count : null);

    if (status is ArchitectureRunStatus.WaitingForResults)
      return ResolveAgentExecutionProgress(tasks);

    if (status is ArchitectureRunStatus.ReadyForCommit)
      return ("Execute complete", CountCompletedSteps(tasks), tasks.Count > 0 ? tasks.Count : null);

    if (status is ArchitectureRunStatus.Committed)
      return ("Committed", CountCompletedSteps(tasks), tasks.Count > 0 ? tasks.Count : null);

    if (status is ArchitectureRunStatus.ExecutionCompletedQualityRejected)
      return ("Quality gate rejected", CountCompletedSteps(tasks), tasks.Count > 0 ? tasks.Count : null);

    if (status is ArchitectureRunStatus.PartiallyCompleted)
      return ("Execute incomplete", CountCompletedSteps(tasks), tasks.Count > 0 ? tasks.Count : null);

    if (status is ArchitectureRunStatus.FailedPartial)
      return ("Execute failed (partial)", CountCompletedSteps(tasks), tasks.Count > 0 ? tasks.Count : null);

    if (status is ArchitectureRunStatus.Failed)
      return ("Execute failed", CountCompletedSteps(tasks), tasks.Count > 0 ? tasks.Count : null);

    return ("Processing review", null, null);
  }

  private static (string StepLabel, int? CurrentStep, int? TotalSteps) ResolveAgentExecutionProgress(
    IReadOnlyList<AgentTask> tasks)
  {
    if (tasks.Count == 0)
      return ("Running agents", null, null);

    if (StagedCriticOperationProgressResolver.TryResolveAgentExecutionStepLabel(tasks, out string stagedLabel))
      return (stagedLabel, CountCompletedSteps(tasks), tasks.Count);

    AgentTask? inProgress = tasks.FirstOrDefault(t => t.Status == AgentTaskStatus.InProgress);

    if (inProgress is not null)
      return ($"{inProgress.AgentType} agent running", CountCompletedSteps(tasks), tasks.Count);

    return ("Waiting for agent results", CountCompletedSteps(tasks), tasks.Count);
  }

  private static int CountCompletedSteps(IReadOnlyList<AgentTask> tasks) =>
    tasks.Count(t => t.Status is AgentTaskStatus.Completed or AgentTaskStatus.Rejected or AgentTaskStatus.Failed);

  private static DateTimeOffset ResolveHeartbeat(
    RunRecord run,
    IReadOnlyList<AgentTask> tasks,
    OperationState state)
  {
    if (run.CompletedUtc is not null)
      return new DateTimeOffset(DateTime.SpecifyKind(run.CompletedUtc.Value, DateTimeKind.Utc));

    DateTime latestTaskUtc = tasks
      .Select(t => t.CompletedUtc ?? t.CreatedUtc)
      .DefaultIfEmpty(run.CreatedUtc)
      .Max();

    if (state == OperationState.Running)
    {
      DateTime nowUtc = TimeProvider.System.GetUtcNow().UtcDateTime;

      if (nowUtc > latestTaskUtc)
        return new DateTimeOffset(DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc));
    }

    return new DateTimeOffset(DateTime.SpecifyKind(latestTaskUtc, DateTimeKind.Utc));
  }
}
