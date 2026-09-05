using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditReadinessService(
    IAuditAssessmentRepository assessmentRepository,
    IAuditFrameworkRepository frameworkRepository,
    IAuditEvidenceRequirementRepository requirementRepository,
    IAuditEvidenceSnapshotRepository snapshotRepository,
    IAuditControlEvaluationRepository evaluationRepository,
    IAuditManualEvidenceRepository manualEvidenceRepository,
    ILogger<AuditReadinessService> logger) : IAuditReadinessService
{
    public async Task<AuditAssessmentReadinessSummaryRecord?> TryBuildAssessmentReadinessAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid auditEvidenceSnapshotId,
        bool catalogAllowsComplianceScoreAggregate = false,
        CancellationToken cancellationToken = default)
    {
        try
        {
            AuditAssessmentRecord? assessment =
                await assessmentRepository.TryGetByIdAsync(tenantId, assessmentId, cancellationToken);

            if (assessment is null)
                return null;

            AuditEvidenceSnapshotHeaderRecord? snapshotHeader =
                await snapshotRepository.TryGetHeaderAsync(tenantId, auditEvidenceSnapshotId, cancellationToken);

            if (snapshotHeader is null || snapshotHeader.AssessmentId != assessmentId)
                return null;

            IReadOnlyList<AuditControlRecord> controls =
                await frameworkRepository.ListControlsAsync(tenantId, assessment.FrameworkId, cancellationToken);

            IReadOnlyList<AuditEvidenceRequirementRecord> requirements =
                await requirementRepository.ListByFrameworkIdAsync(tenantId, assessment.FrameworkId, cancellationToken);

            IReadOnlyList<AuditEvidenceSnapshotItemRecord> evidenceItems =
                await snapshotRepository.ListItemsAsync(tenantId, auditEvidenceSnapshotId, cancellationToken);

            IReadOnlyList<AuditManualEvidenceSubmissionRecord> manualSubmissions =
                await manualEvidenceRepository.ListByAssessmentAsync(tenantId, assessmentId, cancellationToken);

            List<AuditControlReadinessRecord> controlReadiness = [];

            foreach (AuditControlRecord control in controls)
            {
                AuditControlEvaluationRecord? evaluation =
                    await evaluationRepository.TryGetLatestByControlAsync(
                        tenantId,
                        control.ControlId,
                        auditEvidenceSnapshotId,
                        cancellationToken);

                controlReadiness.Add(
                    AuditReadinessBuilder.BuildControlReadiness(
                        control,
                        requirements,
                        evidenceItems,
                        evaluation,
                        manualSubmissions));
            }

            return AuditReadinessBuilder.BuildAssessmentSummary(
                controlReadiness,
                AuditReadinessLabels.ResolveAggregateLabel(catalogAllowsComplianceScoreAggregate));
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(
                ex,
                "Audit readiness build failed for AssessmentId={AssessmentId} AuditEvidenceSnapshotId={AuditEvidenceSnapshotId}.",
                assessmentId,
                auditEvidenceSnapshotId);

            return null;
        }
    }
}
