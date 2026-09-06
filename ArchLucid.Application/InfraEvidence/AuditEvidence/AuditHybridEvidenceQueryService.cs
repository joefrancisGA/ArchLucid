using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditHybridEvidenceQueryService(
    IAuditEvidenceSnapshotRepository snapshotRepository,
    IAuditManualEvidenceRepository manualEvidenceRepository,
    IAuditEvidenceRequirementRepository requirementRepository,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    ILogger<AuditHybridEvidenceQueryService> logger) : IAuditHybridEvidenceQueryService
{
    public async Task<AuditHybridControlEvidenceRecord?> TryGetControlEvidenceSourcesAsync(
        ScopeContext scope,
        Guid assessmentId,
        Guid controlId,
        Guid auditEvidenceSnapshotId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        try
        {
            Guid tenantId = scope.TenantId;

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

            if (architectureLinks.Any(link => requirementIds.Contains(link.RequirementId)))
            {
                await AuditArchitectureEvidenceSealedManifestHashGuard.EnsureLinkedRunsSealedManifestHashOrThrowAsync(
                    architectureLinks,
                    scope,
                    authorityQueryService,
                    manifestHashService,
                    cancellationToken);
            }

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
        catch (Exception ex) when (ex is not OperationCanceledException and not ConflictException)
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
