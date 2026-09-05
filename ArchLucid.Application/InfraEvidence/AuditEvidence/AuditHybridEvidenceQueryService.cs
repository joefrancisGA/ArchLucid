using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditHybridEvidenceQueryService(
    IAuditEvidenceSnapshotRepository snapshotRepository,
    IAuditManualEvidenceRepository manualEvidenceRepository,
    IAuditEvidenceRequirementRepository requirementRepository,
    ILogger<AuditHybridEvidenceQueryService> logger) : IAuditHybridEvidenceQueryService
{
    public async Task<AuditHybridControlEvidenceRecord?> TryGetControlEvidenceSourcesAsync(
        Guid tenantId,
        Guid assessmentId,
        Guid controlId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            AuditEvidenceSnapshotHeaderRecord? snapshotHeader =
                await snapshotRepository.TryGetHeaderAsync(tenantId, auditEvidenceSnapshotId, cancellationToken);

            if (snapshotHeader is null || snapshotHeader.AssessmentId != assessmentId)
                return null;

            IReadOnlyList<AuditEvidenceRequirementRecord> requirements =
                await requirementRepository.ListByControlIdAsync(tenantId, controlId, cancellationToken);

            if (requirements.Count == 0)
                return null;

            HashSet<Guid> requirementIds = requirements.Select(requirement => requirement.RequirementId).ToHashSet();

            IReadOnlyList<AuditEvidenceSnapshotItemRecord> snapshotItems =
                await snapshotRepository.ListItemsAsync(tenantId, auditEvidenceSnapshotId, cancellationToken);

            IReadOnlyList<AuditManualEvidenceSubmissionRecord> manualSubmissions =
                await manualEvidenceRepository.ListByControlAsync(tenantId, assessmentId, controlId, cancellationToken);

            IReadOnlyList<AuditArchitectureEvidenceLinkRecord> architectureLinks =
                await manualEvidenceRepository.ListArchitectureLinksByControlAsync(
                    tenantId,
                    assessmentId,
                    controlId,
                    cancellationToken);

            List<AuditEvidenceSourceKind> sourceKinds = [];

            if (snapshotItems.Any(item =>
                    requirementIds.Contains(item.RequirementId)
                    && item.CollectionStatus == AuditEvidenceCollectionStatus.Collected))
            {
                sourceKinds.Add(AuditEvidenceSourceKind.Automated);
            }

            if (manualSubmissions.Any(submission =>
                    requirementIds.Contains(submission.RequirementId)
                    && submission.ReviewStatus != AuditEvidenceReviewStatus.Rejected))
            {
                sourceKinds.Add(AuditEvidenceSourceKind.Manual);
            }

            if (architectureLinks.Any(link => requirementIds.Contains(link.RequirementId)))
                sourceKinds.Add(AuditEvidenceSourceKind.Architecture);

            return new AuditHybridControlEvidenceRecord
            {
                ControlId = controlId,
                SourceKinds = sourceKinds,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(
                ex,
                "Hybrid evidence source query failed for ControlId={ControlId} AssessmentId={AssessmentId}.",
                controlId,
                assessmentId);

            return null;
        }
    }
}
