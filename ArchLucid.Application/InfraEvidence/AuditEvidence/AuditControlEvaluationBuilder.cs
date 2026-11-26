using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

/// <summary>Deterministic evaluation builder for audit controls over selected snapshot evidence.</summary>
public static class AuditControlEvaluationBuilder
{
    public const string InsufficientEvidenceLabel = "INSUFFICIENT EVIDENCE";
    private const string IncompleteInventoryFormulaTerm = "inventoryCaptureComplete=false";
    private const string RequiredEvidenceGapFormulaTerm = "requiredEvidenceGap=true";

    internal static bool HasIncompleteInventoryCapture(string? formula) =>
        formula?.Split(';', StringSplitOptions.TrimEntries).Contains(IncompleteInventoryFormulaTerm) == true;

    internal static bool HasRequiredEvidenceGap(string? formula) =>
        formula?.Split(';', StringSplitOptions.TrimEntries).Contains(RequiredEvidenceGapFormulaTerm) == true;

    public static AuditControlEvaluationBuildResult Build(
        Guid controlId,
        Guid frameworkId,
        Guid snapshotId,
        Guid tenantId,
        IReadOnlyList<AuditEvidenceRequirementSelectionRecord> selections,
        IReadOnlyList<string> approvedExceptionIds,
        IReadOnlyList<string> failingAzureResourceIds,
        DateTime createdUtc,
        bool inventoryCaptureComplete = true,
        int unavailableInventorySnapshotCount = 0)
    {
        ArgumentNullException.ThrowIfNull(selections);
        ArgumentNullException.ThrowIfNull(approvedExceptionIds);
        ArgumentNullException.ThrowIfNull(failingAzureResourceIds);

        List<Guid> requirementIds = selections.Select(selection => selection.Requirement.RequirementId).Distinct().ToList();

        bool hasBlockingGap = selections.Any(selection =>
            selection.CollectionStatus is AuditEvidenceCollectionStatus.Insufficient
                or AuditEvidenceCollectionStatus.Unsupported
            && !selection.Requirement.ManualEvidenceAllowed);

        List<AuditEvidenceCandidateRecord> candidates = selections
            .SelectMany(selection => selection.Candidates)
            .ToList();

        int applicableCount = candidates.Count;
        HashSet<string> failingResources = failingAzureResourceIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        int failingCount = candidates.Count(candidate =>
            candidate.AzureResourceId is not null
            && failingResources.Contains(candidate.AzureResourceId));

        int passCount = Math.Max(0, applicableCount - failingCount);
        inventoryCaptureComplete &= unavailableInventorySnapshotCount == 0;
        bool coverageUnverified = !inventoryCaptureComplete || hasBlockingGap || applicableCount == 0;
        // A gap prevents a pass without erasing observed failures or their evidence.
        AuditEvaluationOutcome outcome = failingCount > 0 && approvedExceptionIds.Count == 0
            ? AuditEvaluationOutcome.TechnicallyNotSupported
            : coverageUnverified
                ? AuditEvaluationOutcome.InsufficientEvidence
                : AuditEvaluationOutcome.TechnicallySupported;

        decimal confidence = coverageUnverified ? 0m : Math.Round((decimal)passCount / applicableCount, 4);
        string evaluationText = coverageUnverified
            ? BuildCoverageLimitationText(inventoryCaptureComplete, hasBlockingGap, applicableCount, failingCount,
                unavailableInventorySnapshotCount)
            : BuildEvaluationText(passCount, applicableCount, approvedExceptionIds, failingAzureResourceIds);
        string formula = applicableCount == 0
            ? "no collected evidence candidates"
            : $"passCount={passCount}; applicableCount={applicableCount}; failingResources={failingCount}";
        if (!inventoryCaptureComplete)
            formula += $"; {IncompleteInventoryFormulaTerm}";
        if (hasBlockingGap)
            formula += $"; {RequiredEvidenceGapFormulaTerm}";
        if (unavailableInventorySnapshotCount > 0)
            formula += $"; unavailableInventorySnapshotCount={unavailableInventorySnapshotCount}";

        AuditControlEvaluationRecord evaluation = new()
        {
            EvaluationId = Guid.NewGuid(),
            ControlId = controlId,
            FrameworkId = frameworkId,
            SnapshotId = snapshotId,
            TenantId = tenantId,
            Outcome = outcome,
            PassCount = passCount,
            ApplicableCount = applicableCount,
            Confidence = confidence,
            EvaluationText = evaluationText,
            Formula = formula,
            RequirementIds = requirementIds,
            ExceptionIds = approvedExceptionIds.ToList(),
            ProvenanceKind = ProvenanceKind.DeterministicInference,
            HumanDisposition = null,
            Notes = null,
            CreatedUtc = createdUtc,
        };

        List<AuditEvidenceItemRecord> evidenceItems = selections
            .SelectMany(selection => selection.Candidates.Select(candidate => new AuditEvidenceItemRecord
            {
                EvidenceItemId = Guid.NewGuid(),
                EvaluationId = evaluation.EvaluationId,
                RequirementId = selection.Requirement.RequirementId,
                TenantId = tenantId,
                CloudResourceId = candidate.CloudResourceId,
                AzureResourceId = candidate.AzureResourceId,
                EvidenceType = candidate.EvidenceType,
                Summary = candidate.Summary,
                CollectionStatus = AuditEvidenceCollectionStatus.Collected,
                ProvenanceKind = candidate.ProvenanceKind,
                CreatedUtc = createdUtc,
            }))
            .ToList();

        return new AuditControlEvaluationBuildResult
        {
            Evaluation = evaluation,
            EvidenceItems = evidenceItems,
        };
    }

    private static string BuildCoverageLimitationText(
        bool inventoryCaptureComplete,
        bool hasBlockingGap,
        int applicableCount,
        int failingCount,
        int unavailableInventorySnapshotCount)
    {
        List<string> details = [];
        if (!inventoryCaptureComplete)
            details.Add($"{InsufficientEvidenceLabel}: inventory capture is incomplete.");
        if (hasBlockingGap)
            details.Add("Required evidence is missing.");
        if (unavailableInventorySnapshotCount > 0)
            details.Add($"Unavailable linked inventory snapshots: {unavailableInventorySnapshotCount}.");
        if (applicableCount > 0)
            details.Add($"Observed failing candidates: {failingCount} of {applicableCount} collected.");

        return details.Count == 0
            ? InsufficientEvidenceLabel
            : string.Join(" ", details) + " Full control coverage is unverified.";
    }

    private static string BuildEvaluationText(
        int passCount,
        int applicableCount,
        IReadOnlyList<string> approvedExceptionIds,
        IReadOnlyList<string> failingAzureResourceIds)
    {
        string baseText =
            $"{passCount}/{applicableCount} applicable evidence candidates satisfy the technical requirement.";

        if (approvedExceptionIds.Count == 0)
            return baseText;

        string exceptionSummary = string.Join(
            ", ",
            approvedExceptionIds.Select((exceptionId, index) =>
            {
                string resource = index < failingAzureResourceIds.Count
                    ? failingAzureResourceIds[index]
                    : "resource";

                return $"Exception {exceptionId} on resource {resource}";
            }));

        return baseText + " " + exceptionSummary
            + ". Technical evidence supports implementation with approved exception(s).";
    }
}

public sealed class AuditControlEvaluationBuildResult
{
    public AuditControlEvaluationRecord Evaluation
    {
        get;
        init;
    } = null!;

    public IReadOnlyList<AuditEvidenceItemRecord> EvidenceItems
    {
        get;
        init;
    } = [];
}
