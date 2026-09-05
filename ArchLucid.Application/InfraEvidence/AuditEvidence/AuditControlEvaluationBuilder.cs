using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

/// <summary>Deterministic evaluation builder for audit controls over selected snapshot evidence.</summary>
public static class AuditControlEvaluationBuilder
{
    public const string InsufficientEvidenceLabel = "INSUFFICIENT EVIDENCE";

    public static AuditControlEvaluationBuildResult Build(
        Guid controlId,
        Guid frameworkId,
        Guid snapshotId,
        Guid tenantId,
        IReadOnlyList<AuditEvidenceRequirementSelectionRecord> selections,
        IReadOnlyList<string> approvedExceptionIds,
        IReadOnlyList<string> failingAzureResourceIds,
        DateTime createdUtc)
    {
        ArgumentNullException.ThrowIfNull(selections);
        ArgumentNullException.ThrowIfNull(approvedExceptionIds);
        ArgumentNullException.ThrowIfNull(failingAzureResourceIds);

        List<Guid> requirementIds = selections.Select(selection => selection.Requirement.RequirementId).ToList();

        bool hasBlockingGap = selections.Any(selection =>
            selection.CollectionStatus is AuditEvidenceCollectionStatus.Insufficient
                or AuditEvidenceCollectionStatus.Unsupported
            && !selection.Requirement.ManualEvidenceAllowed);

        List<AuditEvidenceCandidateRecord> candidates = selections
            .SelectMany(selection => selection.Candidates)
            .ToList();

        if (hasBlockingGap || candidates.Count == 0)
        {
            return BuildInsufficient(
                controlId,
                frameworkId,
                snapshotId,
                tenantId,
                requirementIds,
                approvedExceptionIds,
                createdUtc);
        }

        int applicableCount = candidates.Count;
        HashSet<string> failingResources = failingAzureResourceIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        int failingCount = candidates.Count(candidate =>
            candidate.AzureResourceId is not null
            && failingResources.Contains(candidate.AzureResourceId));

        int passCount = Math.Max(0, applicableCount - failingCount);
        decimal confidence = applicableCount == 0 ? 0m : Math.Round((decimal)passCount / applicableCount, 4);

        AuditEvaluationOutcome outcome = passCount == applicableCount
            ? AuditEvaluationOutcome.TechnicallySupported
            : approvedExceptionIds.Count > 0
                ? AuditEvaluationOutcome.TechnicallySupported
                : AuditEvaluationOutcome.TechnicallyNotSupported;

        string evaluationText = BuildEvaluationText(passCount, applicableCount, approvedExceptionIds, failingAzureResourceIds);
        string formula = $"passCount={passCount}; applicableCount={applicableCount}; failingResources={failingCount}";

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

    private static AuditControlEvaluationBuildResult BuildInsufficient(
        Guid controlId,
        Guid frameworkId,
        Guid snapshotId,
        Guid tenantId,
        IReadOnlyList<Guid> requirementIds,
        IReadOnlyList<string> approvedExceptionIds,
        DateTime createdUtc)
    {
        AuditControlEvaluationRecord evaluation = new()
        {
            EvaluationId = Guid.NewGuid(),
            ControlId = controlId,
            FrameworkId = frameworkId,
            SnapshotId = snapshotId,
            TenantId = tenantId,
            Outcome = AuditEvaluationOutcome.InsufficientEvidence,
            PassCount = 0,
            ApplicableCount = 0,
            Confidence = 0m,
            EvaluationText = InsufficientEvidenceLabel,
            Formula = "no collected evidence candidates",
            RequirementIds = requirementIds,
            ExceptionIds = approvedExceptionIds.ToList(),
            ProvenanceKind = ProvenanceKind.DeterministicInference,
            HumanDisposition = null,
            Notes = null,
            CreatedUtc = createdUtc,
        };

        return new AuditControlEvaluationBuildResult
        {
            Evaluation = evaluation,
            EvidenceItems = [],
        };
    }

    private static string BuildEvaluationText(
        int passCount,
        int applicableCount,
        IReadOnlyList<string> approvedExceptionIds,
        IReadOnlyList<string> failingAzureResourceIds)
    {
        string baseText =
            $"{passCount}/{applicableCount} applicable resources satisfy the technical requirement.";

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
