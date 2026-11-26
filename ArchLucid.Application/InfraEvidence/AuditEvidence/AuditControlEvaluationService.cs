using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditControlEvaluationService(
    IAzureInventorySnapshotRepository snapshotRepository,
    IAuditEvidenceRequirementRepository requirementRepository,
    IAuditEvidenceSelectorRegistry selectorRegistry,
    IAuditControlEvaluationRepository evaluationRepository,
    IAuditEvidenceSnapshotRepository auditEvidenceSnapshotRepository,
    ILogger<AuditControlEvaluationService> logger) : IAuditControlEvaluationService
{
    public const string StaleEvidenceInsufficientLabel =
        "INSUFFICIENT EVIDENCE: stale or expired evidence cannot be used for current assessment evaluation.";

    public async Task<AuditControlEvaluationResult> TryEvaluateControlForCurrentAssessmentAsync(
        ScopeContext scope,
        Guid auditEvidenceSnapshotId,
        Guid frameworkId,
        Guid controlId,
        IReadOnlyList<string> approvedExceptionIds,
        IReadOnlyList<string> failingAzureResourceIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(approvedExceptionIds);
        ArgumentNullException.ThrowIfNull(failingAzureResourceIds);

        try
        {
            IReadOnlyList<AuditEvidenceRequirementRecord> requirements =
                await requirementRepository.ListByControlIdAsync(scope.TenantId, controlId, cancellationToken);

            if (requirements.Count == 0)
            {
                return new AuditControlEvaluationResult
                {
                    Succeeded = false,
                    ErrorMessage = "Control has no evidence requirements in the imported catalog.",
                };
            }

            IReadOnlyList<AuditEvidenceSnapshotItemRecord> snapshotItems =
                await auditEvidenceSnapshotRepository.ListItemsInScopeAsync(
                    scope.ToProjectScopeKey(),
                    auditEvidenceSnapshotId,
                    cancellationToken);

            HashSet<Guid> requirementIds = requirements.Select(requirement => requirement.RequirementId).ToHashSet();

            bool hasBlockingFreshness = snapshotItems
                .Where(item => requirementIds.Contains(item.RequirementId))
                .Any(item => AuditEvidenceFreshnessGate.BlocksCurrentAssessment(item.FreshnessStatus));

            if (hasBlockingFreshness)
            {
                DateTime createdUtc = TimeProvider.System.UtcNowDateTime();

                AuditControlEvaluationRecord evaluation = new()
                {
                    EvaluationId = Guid.NewGuid(),
                    ControlId = controlId,
                    FrameworkId = frameworkId,
                    SnapshotId = auditEvidenceSnapshotId,
                    TenantId = scope.TenantId,
                    Outcome = AuditEvaluationOutcome.InsufficientEvidence,
                    PassCount = 0,
                    ApplicableCount = 0,
                    Confidence = 0m,
                    EvaluationText = StaleEvidenceInsufficientLabel,
                    Formula = "freshness gate blocked current assessment",
                    RequirementIds = requirements.Select(requirement => requirement.RequirementId).ToList(),
                    ExceptionIds = approvedExceptionIds.ToList(),
                    ProvenanceKind = ProvenanceKind.DeterministicInference,
                    HumanDisposition = null,
                    Notes = null,
                    CreatedUtc = createdUtc,
                };

                await evaluationRepository.InsertInScopeAsync(
                    scope.ToProjectScopeKey(),
                    new AuditControlEvaluationPersistRequest
                    {
                        Evaluation = evaluation,
                        EvidenceItems = [],
                    },
                    cancellationToken);

                return new AuditControlEvaluationResult
                {
                    Succeeded = true,
                    Evaluation = evaluation,
                    EvidenceItems = [],
                };
            }

            AuditEvidenceSnapshotHeaderRecord? auditSnapshotHeader =
                await auditEvidenceSnapshotRepository.TryGetHeaderInScopeAsync(
                    scope.ToProjectScopeKey(),
                    auditEvidenceSnapshotId,
                    cancellationToken);

            if (auditSnapshotHeader is null || auditSnapshotHeader.InventorySnapshotIds.Count == 0)
            {
                return new AuditControlEvaluationResult
                {
                    Succeeded = false,
                    ErrorMessage = "Audit evidence snapshot was not found or has no linked inventory snapshots.",
                };
            }

            return await TryEvaluateCurrentAssessmentControlCoreAsync(
                scope,
                auditSnapshotHeader,
                frameworkId,
                controlId,
                requirements,
                approvedExceptionIds,
                failingAzureResourceIds,
                cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(
                ex,
                "Current-assessment audit control evaluation failed for ControlId={ControlId} AuditEvidenceSnapshotId={AuditEvidenceSnapshotId}.",
                controlId,
                auditEvidenceSnapshotId);

            return new AuditControlEvaluationResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }

    private async Task<AuditControlEvaluationResult> TryEvaluateCurrentAssessmentControlCoreAsync(
        ScopeContext scope,
        AuditEvidenceSnapshotHeaderRecord auditSnapshotHeader,
        Guid frameworkId,
        Guid controlId,
        IReadOnlyList<AuditEvidenceRequirementRecord> requirements,
        IReadOnlyList<string> approvedExceptionIds,
        IReadOnlyList<string> failingAzureResourceIds,
        CancellationToken cancellationToken)
    {
        List<AuditEvidenceRequirementSelectionRecord> selections = [];
        bool inventoryCaptureComplete = auditSnapshotHeader.Failures.Count == 0;
        int unavailableInventorySnapshotCount = 0;
        foreach (Guid inventorySnapshotId in auditSnapshotHeader.InventorySnapshotIds.Distinct())
        {
            cancellationToken.ThrowIfCancellationRequested();

            try
            {
                AzureInventorySnapshotDetailReadModel? snapshot = inventorySnapshotId == Guid.Empty
                    ? null
                    : await snapshotRepository.TryGetSnapshotDetailAsync(scope, inventorySnapshotId, cancellationToken);

                if (snapshot is not null && snapshot.Header.SnapshotId == inventorySnapshotId)
                {
                    inventoryCaptureComplete &= IsRequiredEvidenceComplete(snapshot, requirements);
                    selections.AddRange(SelectEvidence(snapshot, requirements));
                    continue;
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex,
                    "A linked inventory snapshot could not be evaluated for audit snapshot {AuditEvidenceSnapshotId}.",
                    auditSnapshotHeader.AuditEvidenceSnapshotId);
            }

            unavailableInventorySnapshotCount++;
        }

        // Keep requirement identities even when all the linked sources are unavailable.
        if (selections.Count == 0)
        {
            selections.AddRange(requirements.Select(requirement =>
                AuditEvidenceSelectorSupport.Insufficient(requirement, "Linked inventory evidence was unavailable.")));
        }

        DateTime createdUtc = TimeProvider.System.UtcNowDateTime();

        AuditControlEvaluationBuildResult build = AuditControlEvaluationBuilder.Build(
            controlId,
            frameworkId,
            auditSnapshotHeader.AuditEvidenceSnapshotId,
            scope.TenantId,
            selections,
            approvedExceptionIds,
            failingAzureResourceIds,
            createdUtc,
            inventoryCaptureComplete: inventoryCaptureComplete && unavailableInventorySnapshotCount == 0,
            unavailableInventorySnapshotCount: unavailableInventorySnapshotCount);

        await evaluationRepository.InsertInScopeAsync(
            scope.ToProjectScopeKey(),
            new AuditControlEvaluationPersistRequest
            {
                Evaluation = build.Evaluation,
                EvidenceItems = build.EvidenceItems,
            },
            cancellationToken);

        return new AuditControlEvaluationResult
        {
            Succeeded = true,
            Evaluation = build.Evaluation,
            EvidenceItems = build.EvidenceItems,
        };
    }

    private List<AuditEvidenceRequirementSelectionRecord> SelectEvidence(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<AuditEvidenceRequirementRecord> requirements)
    {
        List<AuditEvidenceRequirementSelectionRecord> selections = [];
        foreach (AuditEvidenceRequirementRecord requirement in requirements)
        {
            selections.Add(selectorRegistry.TryGetSelector(requirement.EvidenceType, out IAuditEvidenceSelector? selector)
                && selector is not null
                ? selector.Select(snapshot, requirement)
                : AuditEvidenceSelectorSupport.Unsupported(
                    requirement, $"No snapshot selector is registered for evidence type '{requirement.EvidenceType}'."));
        }

        return selections;
    }

    private static bool IsRequiredEvidenceComplete(
        AzureInventorySnapshotDetailReadModel snapshot,
        IReadOnlyList<AuditEvidenceRequirementRecord> requirements)
    {
        AzureInventorySnapshotRecord header = snapshot.Header;
        IReadOnlyList<string> warnings = AzureInventorySnapshotCompletenessWarningsJson.Deserialize(header.CompletenessWarningsJson);
        // Missing, malformed or inconsistent warning metadata must not authorize a scoped pass.
        if (header.WarningCount != warnings.Count
            || (!string.IsNullOrWhiteSpace(header.CompletenessWarningsJson) && warnings.Count == 0)
            || header.ErrorCount != 0)
            return false;

        bool onlyIndependentDomains = requirements.Count > 0 && requirements.All(requirement =>
            string.Equals(requirement.EvidenceType, AuditEvidenceTypeNames.Network, StringComparison.OrdinalIgnoreCase)
            || string.Equals(requirement.EvidenceType, AuditEvidenceTypeNames.Data, StringComparison.OrdinalIgnoreCase)
            || string.Equals(requirement.EvidenceType, AuditEvidenceTypeNames.Logging, StringComparison.OrdinalIgnoreCase));

        bool hasEntraGap = warnings.Any(SecurityEvidenceAddCredentialAdapterWarnings.IsEntraEvidenceWarning);
        if (hasEntraGap && !onlyIndependentDomains)
            return false;

        if (header.CaptureStatus == AzureInventoryCaptureStatus.Succeeded)
            return true;

        // Never reinterpret a legacy or unexplained partial capture as complete.
        return header.CaptureStatus == AzureInventoryCaptureStatus.Partial
            && header.ResourceCount > 0
            && snapshot.Resources.Count > 0
            && onlyIndependentDomains
            && hasEntraGap
            && warnings.Contains(SecurityEvidenceAddCredentialAdapterWarnings.EntraOnlyCapturePartial, StringComparer.OrdinalIgnoreCase)
            && warnings.All(warning =>
                string.Equals(warning, SecurityEvidenceAddCredentialAdapterWarnings.EntraOnlyCapturePartial, StringComparison.OrdinalIgnoreCase)
                || SecurityEvidenceAddCredentialAdapterWarnings.IsEntraEvidenceWarning(warning));
    }

    public async Task<AuditControlEvaluationResult> TryEvaluateControlAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid frameworkId,
        Guid controlId,
        IReadOnlyList<string> approvedExceptionIds,
        IReadOnlyList<string> failingAzureResourceIds,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(approvedExceptionIds);
        ArgumentNullException.ThrowIfNull(failingAzureResourceIds);

        try
        {
            AzureInventorySnapshotDetailReadModel? snapshot =
                await snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

            if (snapshot is null)
            {
                return new AuditControlEvaluationResult
                {
                    Succeeded = false,
                    ErrorMessage = "Snapshot was not found in the current scope.",
                };
            }

            IReadOnlyList<AuditEvidenceRequirementRecord> requirements =
                await requirementRepository.ListByControlIdAsync(scope.TenantId, controlId, cancellationToken);

            if (requirements.Count == 0)
            {
                return new AuditControlEvaluationResult
                {
                    Succeeded = false,
                    ErrorMessage = "Control has no evidence requirements in the imported catalog.",
                };
            }

            List<AuditEvidenceRequirementSelectionRecord> selections = SelectEvidence(snapshot, requirements);

            DateTime createdUtc = TimeProvider.System.UtcNowDateTime();

            AuditControlEvaluationBuildResult build = AuditControlEvaluationBuilder.Build(
                controlId,
                frameworkId,
                snapshotId,
                scope.TenantId,
                selections,
                approvedExceptionIds,
                failingAzureResourceIds,
                createdUtc,
                inventoryCaptureComplete: IsRequiredEvidenceComplete(snapshot, requirements));

            await evaluationRepository.InsertAsync(
                new AuditControlEvaluationPersistRequest
                {
                    Evaluation = build.Evaluation,
                    EvidenceItems = build.EvidenceItems,
                },
                cancellationToken);

            return new AuditControlEvaluationResult
            {
                Succeeded = true,
                Evaluation = build.Evaluation,
                EvidenceItems = build.EvidenceItems,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(
                ex,
                "Audit control evaluation failed for ControlId={ControlId} SnapshotId={SnapshotId}.",
                controlId,
                snapshotId);

            return new AuditControlEvaluationResult
            {
                Succeeded = false,
                ErrorMessage = ex.Message,
            };
        }
    }
}
