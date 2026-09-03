using ArchLucid.Contracts.Governance;

namespace ArchLucid.Persistence.Governance;

public sealed partial class ArchitectureRiskRegisterReader
{
    private static string BuildListQuerySql(Guid? projectId, ArchitectureRiskRegisterListOptions? options)
    {
        string projectFilter = projectId.HasValue ? " AND fr.ProjectId = @ProjectId" : string.Empty;
        string assigneeFilter = BuildAssigneeFilter(options);
        string openFindingsFilter = BuildOpenFindingsFilter(options);

        return $"""
                ;WITH latestDisposition AS (
                    SELECT FindingId, Disposition, RevisitDueUtc, EvidenceRequestText, OccurredAtUtc, ReviewerUserId,
                           ROW_NUMBER() OVER (PARTITION BY FindingId ORDER BY OccurredAtUtc DESC) AS rn
                    FROM dbo.FindingReviewEvents
                    WHERE TenantId = @TenantId AND WorkspaceId = @WorkspaceId AND Disposition IS NOT NULL
                )
                SELECT TOP (@MaxRows)
                       fr.FindingId,
                       TRY_CONVERT(uniqueidentifier, fr.RunIdRef) AS RunId,
                       runs.GoldenManifestId AS ManifestId,
                       fr.Title,
                       fr.Severity,
                       fr.Category,
                       fr.HumanReviewStatus,
                       fs.CreatedUtc,
                       fr.AssignedToUserId,
                       fr.RemediationDueUtc,
                       ld.Disposition,
                       ld.RevisitDueUtc,
                       ld.EvidenceRequestText,
                       ld.OccurredAtUtc AS LastReviewedUtc,
                       ld.ReviewerUserId AS OwnerUserId,
                       re.ExpiresAtUtc AS WaiverExpiresAtUtc,
                       itsmAgg.LinkedTickets AS ItsmLinkedTicketsSummary,
                       NULLIF(LTRIM(RTRIM(ar.SystemName)), N'') AS SystemName,
                       COALESCE(
                           NULLIF(LTRIM(RTRIM(resourceProp.PropertyValue)), N''),
                           NULLIF(LTRIM(RTRIM(JSON_VALUE(fr.PayloadJson, '$.resourceId'))), N''),
                           NULLIF(LTRIM(RTRIM(JSON_VALUE(fr.PayloadJson, '$.affectedResourceId'))), N'')) AS ResourceId
                FROM dbo.FindingRecords AS fr
                INNER JOIN dbo.FindingsSnapshots AS fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                LEFT JOIN dbo.Runs AS runs ON runs.RunId = TRY_CONVERT(uniqueidentifier, fr.RunIdRef)
                LEFT JOIN dbo.ArchitectureRequests AS ar ON ar.RequestId = runs.ArchitectureRequestId
                OUTER APPLY (
                    SELECT TOP (1) fp.PropertyValue
                    FROM dbo.FindingProperties AS fp
                    WHERE fp.FindingRecordId = fr.FindingRecordId
                      AND fp.PropertyKey IN (N'resourceId', N'affectedResourceId', N'ResourceId', N'AffectedResourceId')
                    ORDER BY fp.PropertySortOrder
                ) AS resourceProp
                LEFT JOIN latestDisposition AS ld ON ld.FindingId = fr.FindingId AND ld.rn = 1
                LEFT JOIN dbo.RiskExceptions AS re
                    ON re.TenantId = fr.TenantId
                   AND re.WorkspaceId = fr.WorkspaceId
                   AND re.FindingId = fr.FindingId
                   AND re.Status = N'Active'
                OUTER APPLY (
                    SELECT STRING_AGG(CONCAT(itsm.Provider, N':', itsm.ExternalKey), N'; ')
                        WITHIN GROUP (ORDER BY itsm.CreatedUtc) AS LinkedTickets
                    FROM dbo.ItsmFindingCorrelations AS itsm
                    WHERE itsm.TenantId = fr.TenantId AND itsm.FindingId = fr.FindingId
                ) AS itsmAgg
                WHERE fr.TenantId = @TenantId AND fr.WorkspaceId = @WorkspaceId{projectFilter}{assigneeFilter}{openFindingsFilter}
                ORDER BY fs.CreatedUtc DESC;
                """;
    }
}
