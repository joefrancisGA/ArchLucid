namespace ArchLucid.Application.DataConsistency;

/// <summary>
/// SQL for operator detection/remediation of stale in-flight runs (same predicate as
/// <c>DataConsistencyReconciliationSql.StaleInFlightRuns</c>).
/// </summary>
internal static class DataConsistencyStaleInFlightRemediationSql
{
    internal const string CountStaleInFlightRuns = """
                                                 SELECT COUNT_BIG(1)
                                                 FROM dbo.Runs r
                                                 WHERE r.ArchivedUtc IS NULL
                                                   AND r.LegacyRunStatus IN (N'Created', N'TasksGenerated', N'WaitingForResults', N'Retrying')
                                                   AND r.CreatedUtc < DATEADD(HOUR, -1, SYSUTCDATETIME());
                                                 """;

    internal const string SelectStaleInFlightRunIds = """
                                                    SELECT TOP (@MaxRows) r.RunId
                                                    FROM dbo.Runs r
                                                    WHERE r.ArchivedUtc IS NULL
                                                      AND r.LegacyRunStatus IN (N'Created', N'TasksGenerated', N'WaitingForResults', N'Retrying')
                                                      AND r.CreatedUtc < DATEADD(HOUR, -1, SYSUTCDATETIME())
                                                    ORDER BY r.CreatedUtc ASC;
                                                    """;
}
