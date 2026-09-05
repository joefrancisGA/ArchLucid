namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditReadinessService
{
    Task<AuditAssessmentReadinessSummaryRecord?> TryBuildAssessmentReadinessAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid auditEvidenceSnapshotId,
        bool catalogAllowsComplianceScoreAggregate = false,
        CancellationToken cancellationToken = default);
}
