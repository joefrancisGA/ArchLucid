using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.InfraEvidence;

public interface IAuditReadinessService
{
    Task<AuditAssessmentReadinessSummaryRecord?> TryBuildAssessmentReadinessAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid auditEvidenceSnapshotId,
        bool catalogAllowsComplianceScoreAggregate = false,
        CancellationToken cancellationToken = default);

    Task<AuditAssessmentReadinessSummaryRecord?> TryBuildAssessmentReadinessInScopeAsync(
        ProjectScopeKey scope,
        Guid assessmentId,
        Guid auditEvidenceSnapshotId,
        bool catalogAllowsComplianceScoreAggregate = false,
        CancellationToken cancellationToken = default);
}
