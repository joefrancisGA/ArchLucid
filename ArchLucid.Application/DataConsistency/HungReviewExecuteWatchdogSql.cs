namespace ArchLucid.Application.DataConsistency;

/// <summary>SQL for hung review execute watchdog (robustness #5).</summary>
internal static class HungReviewExecuteWatchdogSql
{
    // Base staleness on the latest recorded stage-start for the run, not Runs.CreatedUtc: selective re-execute
    // demotes a run back to WaitingForResults without touching CreatedUtc, which would mark it hung immediately.
    internal const string SelectHungExecuteRunIds = """
                                                  SELECT TOP (@MaxRows) r.RunId
                                                  FROM dbo.Runs r
                                                  OUTER APPLY
                                                  (
                                                      SELECT MAX(so.StartedUtc) AS LastStartedUtc
                                                      FROM dbo.RunStageOutcomes so
                                                      WHERE so.RunId = r.RunId
                                                  ) so
                                                  WHERE r.ArchivedUtc IS NULL
                                                    AND r.LegacyRunStatus = N'WaitingForResults'
                                                    AND COALESCE(so.LastStartedUtc, r.CreatedUtc) < DATEADD(HOUR, -@StaleHours, SYSUTCDATETIME())
                                                  ORDER BY COALESCE(so.LastStartedUtc, r.CreatedUtc) ASC;
                                                  """;

    internal const string MarkHungExecuteRunFailed = """
                                                   UPDATE dbo.Runs
                                                   SET LegacyRunStatus = @FailedStatus,
                                                       LastFailureReason = @LastFailureReason
                                                   WHERE RunId = @RunId
                                                     AND ArchivedUtc IS NULL
                                                     AND LegacyRunStatus = N'WaitingForResults';
                                                   SELECT @@ROWCOUNT;
                                                   """;
}
