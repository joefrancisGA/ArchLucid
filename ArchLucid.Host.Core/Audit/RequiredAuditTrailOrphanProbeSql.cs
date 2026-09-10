namespace ArchLucid.Host.Core.Audit;

/// <summary>
///     Detection-only SQL for Required audit trail orphans (TB-955). Domain committed / dispositioned
///     without a matching Required <c>dbo.AuditEvents</c> row after the grace window.
/// </summary>
public static class RequiredAuditTrailOrphanProbeSql
{
    public const string DomainGovernanceApproved = "governance_approved";

    public const string DomainGovernanceRejected = "governance_rejected";

    public const string DomainGoldenManifestFinalized = "golden_manifest_finalized";

    public const string DomainArchitectureShareGranted = "architecture_share_granted";

    public const string DomainArchitectureRestrictToSharesEnabled = "architecture_restrict_to_shares_enabled";

    /// <summary>Approved governance requests missing <c>GovernanceApprovalApproved</c> audit.</summary>
    public const string GovernanceApprovedMissingAudit = """
                                                         SELECT COUNT_BIG(1)
                                                         FROM dbo.GovernanceApprovalRequests g
                                                         WHERE g.Status = N'Approved'
                                                           AND g.ReviewedUtc IS NOT NULL
                                                           AND g.ReviewedUtc < DATEADD(minute, -@GraceMinutes, SYSUTCDATETIME())
                                                           AND g.ReviewedUtc >= DATEADD(day, -@LookbackDays, SYSUTCDATETIME())
                                                           AND NOT EXISTS (
                                                               SELECT 1
                                                               FROM dbo.AuditEvents a
                                                               WHERE a.EventType = N'GovernanceApprovalApproved'
                                                                 AND a.TenantId = g.TenantId
                                                                 AND JSON_VALUE(a.DataJson, '$.approvalRequestId') = g.ApprovalRequestId);
                                                         """;

    /// <summary>Rejected governance requests missing <c>GovernanceApprovalRejected</c> audit.</summary>
    public const string GovernanceRejectedMissingAudit = """
                                                         SELECT COUNT_BIG(1)
                                                         FROM dbo.GovernanceApprovalRequests g
                                                         WHERE g.Status = N'Rejected'
                                                           AND g.ReviewedUtc IS NOT NULL
                                                           AND g.ReviewedUtc < DATEADD(minute, -@GraceMinutes, SYSUTCDATETIME())
                                                           AND g.ReviewedUtc >= DATEADD(day, -@LookbackDays, SYSUTCDATETIME())
                                                           AND NOT EXISTS (
                                                               SELECT 1
                                                               FROM dbo.AuditEvents a
                                                               WHERE a.EventType = N'GovernanceApprovalRejected'
                                                                 AND a.TenantId = g.TenantId
                                                                 AND JSON_VALUE(a.DataJson, '$.approvalRequestId') = g.ApprovalRequestId);
                                                         """;

    /// <summary>Golden manifests missing <c>ManifestFinalized</c> audit (legacy finalize path).</summary>
    public const string GoldenManifestMissingFinalizedAudit = """
                                                              SELECT COUNT_BIG(1)
                                                              FROM dbo.GoldenManifests m
                                                              WHERE m.CreatedUtc < DATEADD(minute, -@GraceMinutes, SYSUTCDATETIME())
                                                                AND m.CreatedUtc >= DATEADD(day, -@LookbackDays, SYSUTCDATETIME())
                                                                AND (m.ArchivedUtc IS NULL)
                                                                AND NOT EXISTS (
                                                                    SELECT 1
                                                                    FROM dbo.AuditEvents a
                                                                    WHERE a.EventType = N'ManifestFinalized'
                                                                      AND a.TenantId = m.TenantId
                                                                      AND (
                                                                          a.ManifestId = m.ManifestId
                                                                          OR a.RunId = m.RunId
                                                                      ));
                                                              """;

    /// <summary>Architecture share rows missing <c>ArchitectureIdentity.ShareGranted</c> audit (AS-093).</summary>
    public const string ArchitectureShareGrantedMissingAudit = """
                                                               SELECT COUNT_BIG(1)
                                                               FROM dbo.ArchitectureShares s
                                                               WHERE s.GrantedUtc < DATEADD(minute, -@GraceMinutes, SYSUTCDATETIME())
                                                                 AND s.GrantedUtc >= DATEADD(day, -@LookbackDays, SYSUTCDATETIME())
                                                                 AND NOT EXISTS (
                                                                     SELECT 1
                                                                     FROM dbo.AuditEvents a
                                                                     WHERE a.EventType = N'ArchitectureIdentity.ShareGranted'
                                                                       AND a.TenantId = s.TenantId
                                                                       AND JSON_VALUE(a.DataJson, '$.architectureId') = LOWER(CAST(s.ArchitectureId AS nvarchar(36)))
                                                                       AND JSON_VALUE(a.DataJson, '$.userId') = LOWER(CAST(s.UserId AS nvarchar(36))));
                                                               """;

    /// <summary>Restrict-to-shares architectures missing <c>ArchitectureIdentity.RestrictToSharesEnabled</c> audit (AS-093).</summary>
    public const string ArchitectureRestrictToSharesEnabledMissingAudit = """
                                                                          SELECT COUNT_BIG(1)
                                                                          FROM dbo.Architectures a
                                                                          WHERE a.RestrictToShares = 1
                                                                            AND a.UpdatedUtc < DATEADD(minute, -@GraceMinutes, SYSUTCDATETIME())
                                                                            AND a.UpdatedUtc >= DATEADD(day, -@LookbackDays, SYSUTCDATETIME())
                                                                            AND NOT EXISTS (
                                                                                SELECT 1
                                                                                FROM dbo.AuditEvents ae
                                                                                WHERE ae.EventType = N'ArchitectureIdentity.RestrictToSharesEnabled'
                                                                                  AND ae.TenantId = a.TenantId
                                                                                  AND JSON_VALUE(ae.DataJson, '$.architectureId') = LOWER(CAST(a.ArchitectureId AS nvarchar(36))));
                                                                          """;
}
