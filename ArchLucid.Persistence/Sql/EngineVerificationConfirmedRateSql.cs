using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Sql;

internal static class EngineVerificationConfirmedRateSql
{
    internal static string BuildListByEngineType(ScopeContext scope)
    {
        string scopeFilter = AndTripleWhere(scope, "rep");

        return $"""
                SELECT
                    fr.EngineType,
                    COUNT(*) AS VerifiableDenominator,
                    SUM(CASE WHEN r.Status IN (0, 1) THEN 1 ELSE 0 END) AS ConfirmedNumerator
                FROM dbo.FindingVerificationResults AS r
                INNER JOIN dbo.FindingVerificationReports AS rep
                    ON rep.ReportId = r.ReportId
                INNER JOIN dbo.FindingRecords AS fr
                    ON fr.FindingsSnapshotId = rep.SourceFindingsSnapshotId
                   AND fr.FindingId = r.FindingId
                WHERE rep.CreatedUtc >= @FromUtc
                  AND rep.CreatedUtc < @ToUtcExclusive
                  AND r.Status <> 3
                  AND fr.EngineType IS NOT NULL
                  AND LTRIM(RTRIM(fr.EngineType)) <> N''
                  {scopeFilter}
                GROUP BY fr.EngineType
                ORDER BY fr.EngineType ASC;
                """;
    }

    private static string AndTripleWhere(ScopeContext scope, string tableAlias)
    {
        if (scope.TenantId == Guid.Empty)
        {
            return string.Empty;
        }

        return
            $" AND {tableAlias}.TenantId = @ScopeTenantId AND {tableAlias}.WorkspaceId = @ScopeWorkspaceId AND {tableAlias}.ScopeProjectId = @ScopeProjectId";
    }
}
