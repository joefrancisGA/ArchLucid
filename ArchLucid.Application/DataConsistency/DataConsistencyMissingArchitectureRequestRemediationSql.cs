namespace ArchLucid.Application.DataConsistency;

/// <summary>
/// SQL for operator detection/remediation of runs that reference a missing ArchitectureRequest
/// (same core predicate as reconciliation <c>runs_missing_architecture_request</c>, plus age grace).
/// </summary>
internal static class DataConsistencyMissingArchitectureRequestRemediationSql
{
    internal const string CountMissingArchitectureRequestRuns = """
                                                                SELECT COUNT_BIG(1)
                                                                FROM dbo.Runs r
                                                                WHERE r.ArchivedUtc IS NULL
                                                                  AND r.ArchitectureRequestId IS NOT NULL
                                                                  AND LEN(LTRIM(RTRIM(r.ArchitectureRequestId))) > 0
                                                                  AND r.CreatedUtc < DATEADD(MINUTE, -@MinAgeMinutes, SYSUTCDATETIME())
                                                                  AND NOT EXISTS (
                                                                      SELECT 1
                                                                      FROM dbo.ArchitectureRequests a
                                                                      WHERE a.RequestId = r.ArchitectureRequestId);
                                                                """;

    internal const string SelectMissingArchitectureRequestRunIds = """
                                                                   SELECT TOP (@MaxRows) r.RunId
                                                                   FROM dbo.Runs r
                                                                   WHERE r.ArchivedUtc IS NULL
                                                                     AND r.ArchitectureRequestId IS NOT NULL
                                                                     AND LEN(LTRIM(RTRIM(r.ArchitectureRequestId))) > 0
                                                                     AND r.CreatedUtc < DATEADD(MINUTE, -@MinAgeMinutes, SYSUTCDATETIME())
                                                                     AND NOT EXISTS (
                                                                         SELECT 1
                                                                         FROM dbo.ArchitectureRequests a
                                                                         WHERE a.RequestId = r.ArchitectureRequestId)
                                                                   ORDER BY r.CreatedUtc ASC;
                                                                   """;
}
