using ArchLucid.Application.Jobs;
using ArchLucid.Contracts.Operations;

namespace ArchLucid.Application.Operations;

internal static class BackgroundJobOperationProjector
{
  internal static OperationDetail Project(string operationId, BackgroundJobInfo job, bool cancelRequested)
  {
    OperationState state = MapState(job.State, cancelRequested);
    string stepLabel = ResolveStepLabel(job.State, state);
    DateTimeOffset heartbeat = ResolveHeartbeat(job);

    OperationResultRef resultRef = new(
      RunId: null,
      JobId: job.JobId,
      DownloadPath: job.State == BackgroundJobState.Succeeded
        ? $"/v1/jobs/{job.JobId}/file"
        : null);

    return new OperationDetail(
      operationId,
      state,
      stepLabel,
      CurrentStep: null,
      TotalSteps: null,
      heartbeat,
      resultRef);
  }

  private static OperationState MapState(BackgroundJobState state, bool cancelRequested)
  {
    if (state == BackgroundJobState.Canceled)
      return OperationState.Canceled;

    if (cancelRequested && state is BackgroundJobState.Pending or BackgroundJobState.Running)
      return OperationState.CancelRequested;

    return MapJobState(state);
  }

  private static OperationState MapJobState(BackgroundJobState state) =>
    state switch
    {
      BackgroundJobState.Pending => OperationState.Pending,
      BackgroundJobState.Running => OperationState.Running,
      BackgroundJobState.Succeeded => OperationState.Succeeded,
      BackgroundJobState.Failed => OperationState.Failed,
      BackgroundJobState.Canceled => OperationState.Canceled,
      _ => throw new ArgumentOutOfRangeException(nameof(state), state, "Unknown background job state.")
    };

  private static string ResolveStepLabel(BackgroundJobState state, OperationState operationState)
  {
    if (operationState == OperationState.CancelRequested)
      return "Cancel requested";

    if (operationState == OperationState.Canceled)
      return "Canceled";

    return ResolveJobStepLabel(state);
  }

  private static string ResolveJobStepLabel(BackgroundJobState state) =>
    state switch
    {
      BackgroundJobState.Pending => "Queued",
      BackgroundJobState.Running => "Processing export",
      BackgroundJobState.Succeeded => "Export complete",
      BackgroundJobState.Failed => "Export failed",
      BackgroundJobState.Canceled => "Canceled",
      _ => throw new ArgumentOutOfRangeException(nameof(state), state, "Unknown background job state.")
    };

  private static DateTimeOffset ResolveHeartbeat(BackgroundJobInfo job)
  {
    if (job.CompletedUtc is not null)
      return job.CompletedUtc.Value;

    if (job.StartedUtc is not null)
      return job.StartedUtc.Value;

    return job.CreatedUtc;
  }
}
