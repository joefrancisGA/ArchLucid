namespace ArchLucid.Persistence.Sql;

/// <summary>
///     SQL for <see cref="Governance.Posture.SqlArchitecturePostureReader" /> (TB-2375, TB-2376).
/// </summary>
internal static class ArchitecturePostureReadSql
{
    /// <summary>
    ///     One round trip: pillar aggregates, pack assignments, review-integrity + uncategorized footer.
    ///     Snapshot-scoped findings use the latest <c>FindingsSnapshots</c> row for the scope triple.
    /// </summary>
    public const string ReadPostureBatch = """
        ;WITH latestSnapshot AS (
            SELECT TOP (1) fs.FindingsSnapshotId,
                           fs.CreatedUtc AS SnapshotCreatedUtc
            FROM dbo.FindingsSnapshots AS fs
            WHERE fs.TenantId = @TenantId
              AND fs.WorkspaceId = @WorkspaceId
              AND fs.ProjectId = @ProjectId
            ORDER BY fs.CreatedUtc DESC
        ),
        latestDisposition AS (
            SELECT fre.FindingId,
                   fre.Disposition,
                   ROW_NUMBER() OVER (PARTITION BY fre.FindingId ORDER BY fre.OccurredAtUtc DESC) AS rn
            FROM dbo.FindingReviewEvents AS fre
            WHERE fre.TenantId = @TenantId
              AND fre.WorkspaceId = @WorkspaceId
              AND fre.ProjectId = @ProjectId
              AND fre.Disposition IS NOT NULL
        ),
        scopedFindings AS (
            SELECT fr.FindingId,
                   fr.Severity,
                   fr.Category,
                   fr.QualityDimension,
                   fr.IsMuted,
                   ld.Disposition,
                   pcm.IsReviewIntegrity
            FROM dbo.FindingRecords AS fr
            INNER JOIN latestSnapshot AS ls ON ls.FindingsSnapshotId = fr.FindingsSnapshotId
            LEFT JOIN latestDisposition AS ld ON ld.FindingId = fr.FindingId AND ld.rn = 1
            LEFT JOIN dbo.PillarCategoryMap AS pcm ON pcm.SourceCategory = fr.Category
            WHERE fr.TenantId = @TenantId
              AND fr.WorkspaceId = @WorkspaceId
              AND fr.ProjectId = @ProjectId
        )
        SELECT sf.QualityDimension AS PillarKey,
               SUM(CASE WHEN sf.Severity = N'Critical' THEN 1 ELSE 0 END) AS CriticalCount,
               SUM(CASE WHEN sf.Severity = N'Error' THEN 1 ELSE 0 END) AS ErrorCount,
               SUM(CASE WHEN sf.Severity = N'Warning' THEN 1 ELSE 0 END) AS WarningCount,
               SUM(CASE WHEN sf.Severity = N'Info' THEN 1 ELSE 0 END) AS InfoCount,
               SUM(CASE WHEN sf.Disposition IS NOT NULL THEN 1 ELSE 0 END) AS DispositionedCount,
               SUM(CASE WHEN sf.IsMuted = 1 THEN 1 ELSE 0 END) AS MutedCount
        FROM scopedFindings AS sf
        WHERE sf.QualityDimension IS NOT NULL
        GROUP BY sf.QualityDimension;

        SELECT pp.QualityDimension AS PillarKey,
               ppa.PolicyPackId,
               pp.Name AS PolicyPackName,
               ppa.PolicyPackVersion,
               ppa.ScopeLevel,
               ppa.IsEnabled,
               ppa.AssignedUtc
        FROM dbo.PolicyPackAssignments AS ppa
        INNER JOIN dbo.PolicyPacks AS pp ON pp.PolicyPackId = ppa.PolicyPackId
        WHERE ppa.TenantId = @TenantId
          AND ppa.ArchivedUtc IS NULL
          AND pp.QualityDimension IS NOT NULL
          AND (
                (ppa.ScopeLevel = N'Tenant')
             OR (ppa.ScopeLevel = N'Workspace' AND ppa.WorkspaceId = @WorkspaceId)
             OR (ppa.ScopeLevel = N'Project' AND ppa.WorkspaceId = @WorkspaceId AND ppa.ProjectId = @ProjectId)
          );

        ;WITH latestSnapshot AS (
            SELECT TOP (1) fs.FindingsSnapshotId,
                           fs.CreatedUtc AS SnapshotCreatedUtc
            FROM dbo.FindingsSnapshots AS fs
            WHERE fs.TenantId = @TenantId
              AND fs.WorkspaceId = @WorkspaceId
              AND fs.ProjectId = @ProjectId
            ORDER BY fs.CreatedUtc DESC
        ),
        latestDisposition AS (
            SELECT fre.FindingId,
                   fre.Disposition,
                   ROW_NUMBER() OVER (PARTITION BY fre.FindingId ORDER BY fre.OccurredAtUtc DESC) AS rn
            FROM dbo.FindingReviewEvents AS fre
            WHERE fre.TenantId = @TenantId
              AND fre.WorkspaceId = @WorkspaceId
              AND fre.ProjectId = @ProjectId
              AND fre.Disposition IS NOT NULL
        ),
        scopedFindings AS (
            SELECT fr.Severity,
                   fr.Category,
                   fr.QualityDimension,
                   fr.IsMuted,
                   ld.Disposition,
                   pcm.IsReviewIntegrity
            FROM dbo.FindingRecords AS fr
            INNER JOIN latestSnapshot AS ls ON ls.FindingsSnapshotId = fr.FindingsSnapshotId
            LEFT JOIN latestDisposition AS ld ON ld.FindingId = fr.FindingId AND ld.rn = 1
            LEFT JOIN dbo.PillarCategoryMap AS pcm ON pcm.SourceCategory = fr.Category
            WHERE fr.TenantId = @TenantId
              AND fr.WorkspaceId = @WorkspaceId
              AND fr.ProjectId = @ProjectId
        )
        SELECT SUM(CASE WHEN sf.IsReviewIntegrity = 1 THEN CASE WHEN sf.Severity = N'Critical' THEN 1 ELSE 0 END ELSE 0 END) AS CriticalCount,
               SUM(CASE WHEN sf.IsReviewIntegrity = 1 THEN CASE WHEN sf.Severity = N'Error' THEN 1 ELSE 0 END ELSE 0 END) AS ErrorCount,
               SUM(CASE WHEN sf.IsReviewIntegrity = 1 THEN CASE WHEN sf.Severity = N'Warning' THEN 1 ELSE 0 END ELSE 0 END) AS WarningCount,
               SUM(CASE WHEN sf.IsReviewIntegrity = 1 THEN CASE WHEN sf.Severity = N'Info' THEN 1 ELSE 0 END ELSE 0 END) AS InfoCount,
               SUM(CASE WHEN sf.IsReviewIntegrity = 1 AND sf.Disposition IS NOT NULL THEN 1 ELSE 0 END) AS DispositionedCount,
               SUM(CASE WHEN sf.IsReviewIntegrity = 1 AND sf.IsMuted = 1 THEN 1 ELSE 0 END) AS MutedCount,
               SUM(CASE WHEN sf.QualityDimension IS NULL AND ISNULL(sf.IsReviewIntegrity, 0) = 0 THEN 1 ELSE 0 END) AS UncategorizedCount,
               (SELECT TOP (1) fs.CreatedUtc
                FROM dbo.FindingsSnapshots AS fs
                WHERE fs.TenantId = @TenantId
                  AND fs.WorkspaceId = @WorkspaceId
                  AND fs.ProjectId = @ProjectId
                ORDER BY fs.CreatedUtc DESC) AS LatestSnapshotCreatedUtc
        FROM scopedFindings AS sf;
        """;
}
