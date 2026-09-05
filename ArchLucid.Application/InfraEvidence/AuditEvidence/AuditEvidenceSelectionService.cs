using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

public sealed class AuditEvidenceSelectionService(
    IAzureInventorySnapshotRepository snapshotRepository,
    IAuditEvidenceRequirementRepository requirementRepository,
    IAuditEvidenceSelectorRegistry selectorRegistry,
    ILogger<AuditEvidenceSelectionService> logger) : IAuditEvidenceSelectionService
{
    public async Task<AuditEvidenceSelectionResult?> TrySelectForFrameworkAsync(
        ScopeContext scope,
        Guid snapshotId,
        Guid frameworkId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        try
        {
            AzureInventorySnapshotDetailReadModel? snapshot =
                await snapshotRepository.TryGetSnapshotDetailAsync(scope, snapshotId, cancellationToken);

            if (snapshot is null)
                return null;

            IReadOnlyList<AuditEvidenceRequirementRecord> requirements =
                await requirementRepository.ListByFrameworkIdAsync(scope.TenantId, frameworkId, cancellationToken);

            HashSet<string> requiredEvidenceTypes = requirements
                .Select(requirement => requirement.EvidenceType)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            Dictionary<string, IAuditEvidenceSelector> activeSelectors = new(StringComparer.OrdinalIgnoreCase);

            foreach (string evidenceType in requiredEvidenceTypes)
            {
                if (selectorRegistry.TryGetSelector(evidenceType, out IAuditEvidenceSelector? selector)
                    && selector is not null)
                {
                    activeSelectors[evidenceType] = selector;
                }
            }

            List<AuditEvidenceRequirementSelectionRecord> selections = [];

            foreach (AuditEvidenceRequirementRecord requirement in requirements)
            {
                if (!activeSelectors.TryGetValue(requirement.EvidenceType, out IAuditEvidenceSelector? selector)
                    || selector is null)
                {
                    selections.Add(AuditEvidenceSelectorSupport.Unsupported(
                        requirement,
                        $"No snapshot selector is registered for evidence type '{requirement.EvidenceType}'."));
                    continue;
                }

                selections.Add(selector.Select(snapshot, requirement));
            }

            return new AuditEvidenceSelectionResult
            {
                SnapshotId = snapshotId,
                Selections = selections,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(
                ex,
                "Audit evidence selection failed for SnapshotId={SnapshotId} FrameworkId={FrameworkId}.",
                snapshotId,
                frameworkId);

            return null;
        }
    }
}
