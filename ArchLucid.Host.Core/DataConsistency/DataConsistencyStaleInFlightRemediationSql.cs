namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>
/// SQL for operator detection/remediation of stale in-flight runs (same predicate as
/// <c>DataConsistencyReconciliationSql.StaleInFlightRuns</c>).
/// </summary>
public static class DataConsistencyStaleInFlightRemediationSql
{
    /// <summary>
    /// Count non-archived runs stuck in Created / TasksGenerated / WaitingForResults / Retrying for more than 1 hour.
    /// </summary>
    public const string CountStaleInFlightRuns = """
                                                 SELECT COUNT_BIG(1)
                                                 FROM dbo.Runs r
                                                 WHERE r.ArchivedUtc IS NULL
                                                   AND r.LegacyRunStatus IN (N'Created', N'TasksGenerated', N'WaitingForResults', N'Retrying')
                                                   AND r.CreatedUtc < DATEADD(HOUR, -1, SYSUTCDATETIME());
                                                 """;

    /// <summary>
    /// Lists up to <c>@MaxRows</c> stale in-flight <c>RunId</c> values, oldest first.
    /// </summary>
    public const string SelectStaleInFlightRunIds = """
                                                    SELECT TOP (@MaxRows) r.RunId
                                                    FROM dbo.Runs r
                                                    WHERE r.ArchivedUtc IS NULL
                                                      AND r.LegacyRunStatus IN (N'Created', N'TasksGenerated', N'WaitingForResults', N'Retrying')
                                                      AND r.CreatedUtc < DATEADD(HOUR, -1, SYSUTCDATETIME())
                                                    ORDER BY r.CreatedUtc ASC;
                                                    """;
}
