using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditControlEvaluationService(
    IAzureInventorySnapshotRepository snapshotRepository,
    IAuditEvidenceRequirementRepository requirementRepository,
    IAuditEvidenceSelectorRegistry selectorRegistry,
    IAuditControlEvaluationRepository evaluationRepository,
    ILogger<AuditControlEvaluationService> logger) : IAuditControlEvaluationService
{
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

            List<AuditEvidenceRequirementSelectionRecord> selections = [];

            foreach (AuditEvidenceRequirementRecord requirement in requirements)
            {
                if (!selectorRegistry.TryGetSelector(requirement.EvidenceType, out IAuditEvidenceSelector? selector)
                    || selector is null)
                {
                    selections.Add(AuditEvidenceSelectorSupport.Unsupported(
                        requirement,
                        $"No snapshot selector is registered for evidence type '{requirement.EvidenceType}'."));
                    continue;
                }

                selections.Add(selector.Select(snapshot, requirement));
            }

            DateTime createdUtc = TimeProvider.System.UtcNowDateTime();

            AuditControlEvaluationBuildResult build = AuditControlEvaluationBuilder.Build(
                controlId,
                frameworkId,
                snapshotId,
                scope.TenantId,
                selections,
                approvedExceptionIds,
                failingAzureResourceIds,
                createdUtc);

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
