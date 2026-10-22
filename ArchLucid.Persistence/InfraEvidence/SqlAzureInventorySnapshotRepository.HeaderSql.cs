namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlAzureInventorySnapshotRepository
{
    private const string SnapshotHeaderSelectSql = """
                                                   SELECT TOP (1)
                                                       s.SnapshotId, s.TenantId, s.WorkspaceId, s.ProjectId, s.PackageId,
                                                       COALESCE(s.SubscriptionId, JSON_VALUE(p.ManifestJson, '$.subscriptionId')) AS SubscriptionId,
                                                       s.SubscriptionName, s.CapturedUtc, s.CaptureStatus, s.CaptureVersion,
                                                       s.ResourceCount, s.RelationshipCount, s.CaptureMethod, s.CollectorVersion,
                                                       s.RequestedBy, s.DurationMs, s.CompletenessScore, s.WarningCount, s.CompletenessWarningsJson, s.ErrorCount,
                                                       s.ContentHashSha256, s.CreatedUtc, s.UpdatedUtc,
                                                       JSON_VALUE(p.ManifestJson, '$.subscriptionName') AS ManifestSubscriptionName,
                                                       sibling.SiblingSubscriptionName
                                                   FROM dbo.AzureInventorySnapshots s
                                                   LEFT JOIN dbo.AzureExtractorPackages p
                                                       ON p.PackageId = s.PackageId
                                                       AND p.TenantId = s.TenantId
                                                       AND p.WorkspaceId = s.WorkspaceId
                                                       AND p.ProjectId = s.ProjectId
                                                   OUTER APPLY (
                                                       SELECT TOP (1)
                                                           COALESCE(
                                                               sib.SubscriptionName,
                                                               JSON_VALUE(pSib.ManifestJson, '$.subscriptionName')
                                                           ) AS SiblingSubscriptionName
                                                       FROM dbo.AzureInventorySnapshots sib
                                                       LEFT JOIN dbo.AzureExtractorPackages pSib
                                                           ON pSib.PackageId = sib.PackageId
                                                           AND pSib.TenantId = sib.TenantId
                                                           AND pSib.WorkspaceId = sib.WorkspaceId
                                                           AND pSib.ProjectId = sib.ProjectId
                                                       WHERE sib.TenantId = s.TenantId
                                                           AND sib.WorkspaceId = s.WorkspaceId
                                                           AND sib.ProjectId = s.ProjectId
                                                           AND sib.CaptureStatus IN (@SucceededStatus, @PartialStatus)
                                                           AND COALESCE(
                                                               sib.SubscriptionId,
                                                               JSON_VALUE(pSib.ManifestJson, '$.subscriptionId')
                                                           ) = COALESCE(
                                                               s.SubscriptionId,
                                                               JSON_VALUE(p.ManifestJson, '$.subscriptionId')
                                                           )
                                                           AND COALESCE(
                                                               sib.SubscriptionName,
                                                               JSON_VALUE(pSib.ManifestJson, '$.subscriptionName')
                                                           ) IS NOT NULL
                                                       ORDER BY COALESCE(sib.CapturedUtc, sib.CreatedUtc) DESC
                                                   ) sibling
                                                   WHERE s.TenantId = @TenantId
                                                       AND s.WorkspaceId = @WorkspaceId
                                                       AND s.ProjectId = @ProjectId
                                                       AND s.SnapshotId = @SnapshotId
                                                   """;
}
