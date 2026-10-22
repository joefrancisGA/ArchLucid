using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditContinuousReadinessService(
    IAuditAssessmentRepository assessmentRepository,
    IAuditEvidenceRequirementRepository requirementRepository,
    IAuditEvidenceSnapshotRepository auditEvidenceSnapshotRepository,
    IAuditControlEvaluationService evaluationService,
    IAuditControlTimelineRepository timelineRepository,
    IAuditEvaluationFindingHandoffService findingHandoffService,
    ILogger<AuditContinuousReadinessService> logger) : IAuditContinuousReadinessService
{
    public async Task<AuditContinuousReadinessProcessResult> ProcessInventoryDiffAsync(
        ScopeContext scope,
        AzureInventoryDiffSummaryRecord summary,
        IReadOnlyList<AzureInventoryChangeRecord> changes,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(summary);
        ArgumentNullException.ThrowIfNull(changes);

        try
        {
            IReadOnlySet<string> impactedEvidenceTypes =
                AuditInventoryChangeEvidenceImpactClassifier.GetImpactedEvidenceTypes(changes);

            if (impactedEvidenceTypes.Count == 0)
            {
                return new AuditContinuousReadinessProcessResult
                {
                    Succeeded = true,
                    AffectedControlIds = [],
                    ReEvaluatedControlIds = [],
                };
            }

            IReadOnlyList<AuditAssessmentRecord> assessments =
                await assessmentRepository.ListActiveByTenantAsync(scope.TenantId, cancellationToken);

            if (assessments.Count == 0)
            {
                return new AuditContinuousReadinessProcessResult
                {
                    Succeeded = true,
                    AffectedControlIds = [],
                    ReEvaluatedControlIds = [],
                };
            }

            List<Guid> affectedControlIds = [];
            List<Guid> reEvaluatedControlIds = [];
            int findingHandoffCount = 0;

            foreach (AuditAssessmentRecord assessment in assessments)
            {
                IReadOnlyList<AuditEvidenceRequirementRecord> requirements =
                    await requirementRepository.ListByFrameworkIdAsync(
                        scope.TenantId,
                        assessment.FrameworkId,
                        cancellationToken);

                List<AuditEvidenceRequirementRecord> impactedRequirements = requirements
                    .Where(requirement => impactedEvidenceTypes.Contains(requirement.EvidenceType))
                    .ToList();

                if (impactedRequirements.Count == 0)
                    continue;

                HashSet<Guid> impactedControlIds = impactedRequirements
                    .Select(requirement => requirement.ControlId)
                    .ToHashSet();

                IReadOnlyList<AuditEvidenceSnapshotHeaderRecord> auditSnapshots =
                    await auditEvidenceSnapshotRepository.ListByAssessmentAsync(
                        scope.TenantId,
                        assessment.AssessmentId,
                        cancellationToken);

                AuditEvidenceSnapshotHeaderRecord? latestAuditSnapshot = auditSnapshots
                    .OrderByDescending(header => header.CollectionCompletedUtc)
                    .FirstOrDefault();

                if (latestAuditSnapshot is null)
                    continue;

                IReadOnlyList<AuditEvidenceSnapshotItemRecord> snapshotItems =
                    await auditEvidenceSnapshotRepository.ListItemsAsync(
                        scope.TenantId,
                        latestAuditSnapshot.AuditEvidenceSnapshotId,
                        cancellationToken);

                HashSet<Guid> impactedRequirementIds = impactedRequirements
                    .Select(requirement => requirement.RequirementId)
                    .ToHashSet();

                List<AuditEvidenceFreshnessItemUpdate> freshnessUpdates = snapshotItems
                    .Where(item => impactedRequirementIds.Contains(item.RequirementId))
                    .Select(item => new AuditEvidenceFreshnessItemUpdate
                    {
                        EvidenceRowId = item.EvidenceRowId,
                        FreshnessStatus = AuditEvidenceFreshnessStatus.Stale,
                    })
                    .ToList();

                if (freshnessUpdates.Count > 0)
                {
                    await auditEvidenceSnapshotRepository.UpdateItemFreshnessAsync(
                        scope.TenantId,
                        latestAuditSnapshot.AuditEvidenceSnapshotId,
                        freshnessUpdates,
                        cancellationToken);
                }

                foreach (Guid controlId in impactedControlIds)
                {
                    affectedControlIds.Add(controlId);

                    AuditControlEvaluationResult evaluationResult =
                        await evaluationService.TryEvaluateControlForCurrentAssessmentAsync(
                            scope,
                            latestAuditSnapshot.AuditEvidenceSnapshotId,
                            assessment.FrameworkId,
                            controlId,
                            [],
                            [],
                            cancellationToken);

                    reEvaluatedControlIds.Add(controlId);

                    AuditControlTechnicalTimelineState nextState =
                        evaluationResult.Evaluation?.Outcome == AuditEvaluationOutcome.TechnicallySupported
                            ? AuditControlTechnicalTimelineState.TechnicallySupported
                            : AuditControlTechnicalTimelineState.DriftDetected;

                    await timelineRepository.UpsertAsync(
                        new AuditControlTechnicalTimelineRecord
                        {
                            TimelineStateId = Guid.NewGuid(),
                            TenantId = scope.TenantId,
                            AssessmentId = assessment.AssessmentId,
                            ControlId = controlId,
                            State = nextState,
                            InventoryDiffId = summary.DiffId,
                            UpdatedUtc = TimeProvider.System.UtcNowDateTime(),
                        },
                        cancellationToken);

                    if (evaluationResult.Evaluation?.Outcome == AuditEvaluationOutcome.TechnicallyNotSupported
                        || evaluationResult.Evaluation?.Outcome == AuditEvaluationOutcome.InsufficientEvidence)
                    {
                        bool handedOff = await findingHandoffService.TryHandoffAsync(
                            new AuditEvaluationFindingHandoffRequest
                            {
                                TenantId = scope.TenantId,
                                AssessmentId = assessment.AssessmentId,
                                ControlId = controlId,
                                InventoryDiffId = summary.DiffId,
                                AuditEvidenceSnapshotId = latestAuditSnapshot.AuditEvidenceSnapshotId,
                                Summary = evaluationResult.Evaluation.EvaluationText,
                            },
                            cancellationToken);

                        if (handedOff)
                            findingHandoffCount++;
                    }
                }
            }

            return new AuditContinuousReadinessProcessResult
            {
                Succeeded = true,
                AffectedControlIds = affectedControlIds.Distinct().ToList(),
                ReEvaluatedControlIds = reEvaluatedControlIds.Distinct().ToList(),
                FindingHandoffCount = findingHandoffCount,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Continuous readiness processing failed for DiffId={DiffId}.", summary.DiffId);

            return new AuditContinuousReadinessProcessResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }
}
