namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <summary>
///     Records commit failures and publishes best-effort external status notifications.
/// </summary>
public interface IAuthorityCommitFailureRecorder
{
    Task RecordFailureAsync(
        string actor,
        string runId,
        string auditDetails,
        CancellationToken cancellationToken);

    Task TryPublishAzureDevOpsCommitStatusBestEffortAsync(
        string runId,
        bool succeeded,
        CancellationToken cancellationToken);
}
