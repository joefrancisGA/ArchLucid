using ArchLucid.Core.Scoping;
namespace ArchLucid.Persistence.Sql;

internal static class EngineInsightNoveltyRateSql
{
    internal static string BuildListByEngineType(ScopeContext scope)
    {
        string scopeFilter = AndTripleWhere(scope, "fs");

        return $"""
                SELECT
                    fr.EngineType,
                    COUNT(DISTINCT CONCAT(CAST(fs.RunId AS NVARCHAR(36)), N'|', fr.FindingId)) AS DecisionGradeCount,
                    COUNT(DISTINCT CASE
                        WHEN sig.SignalId IS NOT NULL
                            THEN CONCAT(CAST(fs.RunId AS NVARCHAR(36)), N'|', fr.FindingId)
                    END) AS DidNotThinkOfThatCount
                FROM dbo.FindingRecords AS fr
                INNER JOIN dbo.FindingsSnapshots AS fs
                    ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                LEFT JOIN dbo.FindingInsightSignals AS sig
                    ON sig.TenantId = fs.TenantId
                   AND sig.RunId = fs.RunId
                   AND sig.FindingId = fr.FindingId
                   AND sig.Kind = @DidNotThinkOfThatKind
                WHERE fs.CreatedUtc >= @FromUtc
                  AND fs.CreatedUtc < @ToUtcExclusive
                  AND fs.ArchivedUtc IS NULL
                  AND (
                      fr.Classification = @DecisionGradeClassification
                      OR (fr.Classification IS NULL AND ISNULL(fr.Treatment, @PromoteTreatment) = @PromoteTreatment))
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
            $" AND {tableAlias}.TenantId = @ScopeTenantId AND {tableAlias}.WorkspaceId = @ScopeWorkspaceId AND {tableAlias}.ProjectId = @ScopeProjectId";
    }
}
