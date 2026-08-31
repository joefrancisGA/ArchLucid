namespace ArchLucid.Application.DataConsistency;

/// <summary>SQL for hung review execute watchdog (robustness #5).</summary>
internal static class HungReviewExecuteWatchdogSql
{
    internal const string SelectHungExecuteRunIds = """
                                                  SELECT TOP (@MaxRows) r.RunId
                                                  FROM dbo.Runs r
                                                  WHERE r.ArchivedUtc IS NULL
                                                    AND r.LegacyRunStatus = N'WaitingForResults'
                                                    AND r.CreatedUtc < DATEADD(HOUR, -@StaleHours, SYSUTCDATETIME())
                                                  ORDER BY r.CreatedUtc ASC;
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
