using ArchLucid.Application.InfraEvidence.AuditEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Queries;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditEvidenceLineageService(
    IAuditAssessmentRepository assessmentRepository,
    IAuditFrameworkRepository frameworkRepository,
    IAuditEvidenceRequirementRepository requirementRepository,
    IAuditEvidenceSnapshotRepository snapshotRepository,
    IAuditControlEvaluationRepository evaluationRepository,
    IAuditManualEvidenceRepository manualEvidenceRepository,
    IAuditEvidenceSnapshotVerificationService verificationService,
    IAuthorityQueryService authorityQueryService,
    IManifestHashService manifestHashService,
    ILogger<AuditEvidenceLineageService> logger) : IAuditEvidenceLineageService
{
    public async Task<AuditEvidenceLineageQueryResult> TryGetControlLineageAsync(
        ScopeContext scope,
        Guid assessmentId,
        Guid auditEvidenceSnapshotId,
        Guid controlId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        try
        {
            AuditAssessmentRecord? assessment =
                await assessmentRepository.TryGetByIdAsync(scope.TenantId, assessmentId, cancellationToken);

            if (assessment is null)
            {
                return new AuditEvidenceLineageQueryResult
                {
                    Succeeded = false,
                    ErrorMessage = "Assessment was not found in the current tenant scope.",
                };
            }

            AuditEvidenceSnapshotHeaderRecord? snapshotHeader =
                await snapshotRepository.TryGetHeaderAsync(scope.TenantId, auditEvidenceSnapshotId, cancellationToken);

            if (snapshotHeader is null || snapshotHeader.AssessmentId != assessmentId)
            {
                return new AuditEvidenceLineageQueryResult
                {
                    Succeeded = false,
                    ErrorMessage = "Audit evidence snapshot was not found for the assessment.",
                };
            }

            IReadOnlyList<AuditControlRecord> controls =
                await frameworkRepository.ListControlsAsync(scope.TenantId, assessment.FrameworkId, cancellationToken);

            AuditControlRecord? control = controls.FirstOrDefault(row => row.ControlId == controlId);

            if (control is null)
            {
                return new AuditEvidenceLineageQueryResult
                {
                    Succeeded = false,
                    ErrorMessage = "Control was not found in the imported framework catalog.",
                };
            }

            IReadOnlyList<AuditEvidenceRequirementRecord> requirements =
                await requirementRepository.ListByControlIdAsync(scope.TenantId, controlId, cancellationToken);

            IReadOnlyList<AuditArchitectureEvidenceLinkRecord> architectureLinks =
                await manualEvidenceRepository.ListArchitectureLinksByControlAsync(
                    scope.TenantId,
                    assessmentId,
                    controlId,
                    cancellationToken);

            if (architectureLinks.Count > 0)
            {
                await AuditArchitectureEvidenceSealedManifestHashGuard.EnsureLinkedRunsSealedManifestHashOrThrowAsync(
                    architectureLinks,
                    scope,
                    authorityQueryService,
                    manifestHashService,
                    cancellationToken);
            }

            IReadOnlyList<AuditEvidenceSnapshotItemRecord> snapshotItems =
                await snapshotRepository.ListItemsAsync(scope.TenantId, auditEvidenceSnapshotId, cancellationToken);

            AuditControlEvaluationRecord? evaluation =
                await evaluationRepository.TryGetLatestByControlAsync(
                    scope.TenantId,
                    controlId,
                    auditEvidenceSnapshotId,
                    cancellationToken);

            IReadOnlyList<AuditEvidenceItemRecord> evaluationItems = evaluation is null
                ? []
                : await evaluationRepository.ListEvidenceItemsByEvaluationAsync(
                    scope.TenantId,
                    evaluation.EvaluationId,
                    cancellationToken);

            AuditEvidenceSnapshotVerificationResult verification =
                await verificationService.TryVerifyAsync(scope.TenantId, auditEvidenceSnapshotId, cancellationToken);

            List<AuditEvidenceLineageRequirementChain> requirementChains = [];
            List<string> brokenLinkReasons = [];

            foreach (AuditEvidenceRequirementRecord requirement in requirements)
            {
                List<AuditEvidenceSnapshotItemRecord> requirementItems = snapshotItems
                    .Where(item => item.RequirementId == requirement.RequirementId)
                    .ToList();

                List<AuditEvidenceLineageEvidenceNode> evidenceNodes = [];

                foreach (AuditEvidenceSnapshotItemRecord snapshotItem in requirementItems)
                {
                    AuditEvidenceItemRecord? evaluationItem = evaluationItems.FirstOrDefault(item =>
                        item.RequirementId == requirement.RequirementId
                        && item.CloudResourceId == snapshotItem.CloudResourceId
                        && string.Equals(item.AzureResourceId, snapshotItem.AzureResourceId, StringComparison.OrdinalIgnoreCase));

                    AuditEvidenceLineageEvidenceNode evidenceNode =
                        AuditEvidenceLineageBuilder.BuildEvidenceNode(snapshotItem, evaluationItem);

                    evidenceNodes.Add(evidenceNode);

                    if (!evidenceNode.LinkComplete)
                    {
                        brokenLinkReasons.Add(
                            $"Requirement {requirement.RequirementId} evidence row {snapshotItem.EvidenceRowId} missing: {string.Join(", ", evidenceNode.MissingLinkKinds)}.");
                    }
                }

                requirementChains.Add(new AuditEvidenceLineageRequirementChain
                {
                    RequirementId = requirement.RequirementId,
                    RequirementName = requirement.Name,
                    EvidenceType = requirement.EvidenceType,
                    Evidence = evidenceNodes,
                });
            }

            if (evaluation is null)
                brokenLinkReasons.Add("Automated evaluation is missing for this control and snapshot.");

            if (!verification.IsValid)
                brokenLinkReasons.Add(verification.FailureReason ?? "Snapshot hash verification failed.");

            AuditEvidenceLineageEvaluationNode? evaluationNode = evaluation is null
                ? null
                : new AuditEvidenceLineageEvaluationNode
                {
                    EvaluationId = evaluation.EvaluationId,
                    Outcome = evaluation.Outcome,
                    Formula = evaluation.Formula,
                    ExceptionIds = evaluation.ExceptionIds,
                    ProvenanceKind = evaluation.ProvenanceKind,
                };

            bool chainComplete = evaluation is not null
                && verification.IsValid
                && requirementChains.Count > 0
                && requirementChains.All(chain =>
                    chain.Evidence.Count > 0 && chain.Evidence.All(evidence => evidence.LinkComplete && evidence.ItemHashVerified));

            bool readyForPositiveCheckbox = AuditEvidenceLineageBuilder.IsReadyForPositiveCheckbox(
                control,
                evaluation,
                requirementChains,
                verification.IsValid);

            return new AuditEvidenceLineageQueryResult
            {
                Succeeded = true,
                Lineage = new AuditEvidenceLineageRecord
                {
                    AssessmentId = assessmentId,
                    AuditEvidenceSnapshotId = auditEvidenceSnapshotId,
                    ControlId = controlId,
                    ControlNumber = control.ControlNumber,
                    ControlTitle = control.Title,
                    ChainComplete = chainComplete,
                    SnapshotHashVerified = verification.IsValid,
                    ReadyForPositiveCheckbox = readyForPositiveCheckbox,
                    BrokenLinkReasons = brokenLinkReasons.Distinct(StringComparer.Ordinal).ToList(),
                    Evaluation = evaluationNode,
                    RequirementChains = requirementChains,
                },
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException and not ConflictException)
        {
            logger.LogWarning(
                ex,
                "Audit evidence lineage query failed for AssessmentId={AssessmentId} ControlId={ControlId}.",
                assessmentId,
                controlId);

            return new AuditEvidenceLineageQueryResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }
}
