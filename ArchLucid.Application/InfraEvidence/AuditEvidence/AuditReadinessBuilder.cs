using ArchLucid.Core.InfraEvidence;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

/// <summary>Builds audit readiness separately from deterministic technical evaluation.</summary>
public static class AuditReadinessBuilder
{
    public static AuditControlReadinessRecord BuildControlReadiness(
        AuditControlRecord control,
        IReadOnlyList<AuditEvidenceRequirementRecord> requirements,
        IReadOnlyList<AuditEvidenceSnapshotItemRecord> evidenceItems,
        AuditControlEvaluationRecord? evaluation)
    {
        ArgumentNullException.ThrowIfNull(control);
        ArgumentNullException.ThrowIfNull(requirements);
        ArgumentNullException.ThrowIfNull(evidenceItems);

        AuditControlApplicabilityStatus applicability = ResolveApplicability(control.Applicability);
        List<AuditEvidenceRequirementRecord> controlRequirements = requirements
            .Where(requirement => requirement.ControlId == control.ControlId)
            .ToList();

        List<AuditEvidenceSnapshotItemRecord> controlItems = evidenceItems
            .Where(item => controlRequirements.Any(requirement => requirement.RequirementId == item.RequirementId))
            .ToList();

        int evidenceRequiredCount = controlRequirements.Count;
        int evidenceCollectedCount = controlRequirements.Count(requirement =>
            controlItems.Any(item =>
                item.RequirementId == requirement.RequirementId
                && item.CollectionStatus == AuditEvidenceCollectionStatus.Collected));

        AuditEvidenceFreshnessStatus worstFreshness = ResolveWorstFreshness(controlItems);
        AuditControlEvidenceCompleteness completeness = ResolveCompleteness(evidenceRequiredCount, evidenceCollectedCount);

        bool manualEvidenceRequired = controlRequirements.Any(requirement =>
            requirement.ManualEvidenceAllowed
            && controlItems.Any(item =>
                item.RequirementId == requirement.RequirementId
                && item.CollectionStatus is AuditEvidenceCollectionStatus.Insufficient
                    or AuditEvidenceCollectionStatus.Unsupported));

        IReadOnlyList<string> approvedExceptionIds = evaluation?.ExceptionIds ?? [];
        AuditEvaluationOutcome? automatedOutcome = evaluation?.Outcome;

        List<string> outstandingActions = BuildOutstandingActions(
            applicability,
            completeness,
            worstFreshness,
            manualEvidenceRequired,
            automatedOutcome,
            approvedExceptionIds);

        bool readyForAuditorReview = applicability == AuditControlApplicabilityStatus.Applicable
            && completeness == AuditControlEvidenceCompleteness.FullyEvident
            && !AuditEvidenceFreshnessGate.BlocksCurrentAssessment(worstFreshness)
            && !manualEvidenceRequired
            && automatedOutcome == AuditEvaluationOutcome.TechnicallySupported
            && outstandingActions.Count == 0;

        return new AuditControlReadinessRecord
        {
            ControlId = control.ControlId,
            ControlNumber = control.ControlNumber,
            Title = control.Title,
            Applicability = applicability,
            EvidenceRequiredCount = evidenceRequiredCount,
            EvidenceCollectedCount = evidenceCollectedCount,
            WorstFreshnessStatus = worstFreshness,
            Completeness = completeness,
            AutomatedEvaluationOutcome = automatedOutcome,
            ManualEvidenceRequired = manualEvidenceRequired,
            ApprovedExceptionIds = approvedExceptionIds,
            OutstandingActions = outstandingActions,
            ReadyForAuditorReview = readyForAuditorReview,
        };
    }

    public static AuditAssessmentReadinessSummaryRecord BuildAssessmentSummary(
        IReadOnlyList<AuditControlReadinessRecord> controls,
        string aggregateLabel)
    {
        ArgumentNullException.ThrowIfNull(controls);

        List<AuditControlReadinessRecord> applicableControls = controls
            .Where(control => control.Applicability == AuditControlApplicabilityStatus.Applicable)
            .ToList();

        return new AuditAssessmentReadinessSummaryRecord
        {
            AggregateLabel = aggregateLabel,
            ApplicableControlCount = applicableControls.Count,
            FullyEvidentCount = applicableControls.Count(control => control.Completeness == AuditControlEvidenceCompleteness.FullyEvident),
            PartiallyEvidentCount = applicableControls.Count(control => control.Completeness == AuditControlEvidenceCompleteness.PartiallyEvident),
            LackingEvidenceCount = applicableControls.Count(control => control.Completeness == AuditControlEvidenceCompleteness.LackingEvidence),
            StaleEvidenceCount = applicableControls.Count(control =>
                AuditEvidenceFreshnessGate.BlocksCurrentAssessment(control.WorstFreshnessStatus)),
            RequiresHumanEvidenceCount = applicableControls.Count(control => control.ManualEvidenceRequired),
            TechnicallyFailingCount = applicableControls.Count(control =>
                control.AutomatedEvaluationOutcome == AuditEvaluationOutcome.TechnicallyNotSupported),
            ApprovedExceptionCount = applicableControls.Count(control => control.ApprovedExceptionIds.Count > 0),
            ReadyForAuditorReviewCount = applicableControls.Count(control => control.ReadyForAuditorReview),
            Controls = controls,
        };
    }

    private static AuditControlApplicabilityStatus ResolveApplicability(string? applicabilityText)
    {
        if (string.IsNullOrWhiteSpace(applicabilityText))
            return AuditControlApplicabilityStatus.Applicable;

        string normalized = applicabilityText.Trim();

        if (normalized.Contains("not applicable", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("n/a", StringComparison.OrdinalIgnoreCase))
        {
            return AuditControlApplicabilityStatus.NotApplicable;
        }

        return AuditControlApplicabilityStatus.Applicable;
    }

    private static AuditEvidenceFreshnessStatus ResolveWorstFreshness(
        IReadOnlyList<AuditEvidenceSnapshotItemRecord> controlItems)
    {
        if (controlItems.Count == 0)
            return AuditEvidenceFreshnessStatus.Unknown;

        AuditEvidenceFreshnessStatus worst = AuditEvidenceFreshnessStatus.Current;

        foreach (AuditEvidenceSnapshotItemRecord item in controlItems)
        {
            if (item.CollectionStatus != AuditEvidenceCollectionStatus.Collected)
                continue;

            if (item.FreshnessStatus > worst)
                worst = item.FreshnessStatus;
        }

        return worst;
    }

    private static AuditControlEvidenceCompleteness ResolveCompleteness(
        int evidenceRequiredCount,
        int evidenceCollectedCount)
    {
        if (evidenceRequiredCount == 0 || evidenceCollectedCount == 0)
            return AuditControlEvidenceCompleteness.LackingEvidence;

        if (evidenceCollectedCount >= evidenceRequiredCount)
            return AuditControlEvidenceCompleteness.FullyEvident;

        return AuditControlEvidenceCompleteness.PartiallyEvident;
    }

    private static List<string> BuildOutstandingActions(
        AuditControlApplicabilityStatus applicability,
        AuditControlEvidenceCompleteness completeness,
        AuditEvidenceFreshnessStatus worstFreshness,
        bool manualEvidenceRequired,
        AuditEvaluationOutcome? automatedOutcome,
        IReadOnlyList<string> approvedExceptionIds)
    {
        List<string> actions = [];

        if (applicability == AuditControlApplicabilityStatus.NotApplicable)
            return actions;

        if (completeness == AuditControlEvidenceCompleteness.LackingEvidence)
            actions.Add("Collect missing automated evidence.");

        if (completeness == AuditControlEvidenceCompleteness.PartiallyEvident)
            actions.Add("Complete partial evidence collection.");

        if (AuditEvidenceFreshnessGate.BlocksCurrentAssessment(worstFreshness))
            actions.Add("Refresh stale or expired evidence via a new inventory snapshot and audit evidence snapshot.");

        if (manualEvidenceRequired)
            actions.Add("Provide required human-submitted evidence.");

        if (automatedOutcome == AuditEvaluationOutcome.InsufficientEvidence)
            actions.Add("Resolve insufficient automated evidence before auditor review.");

        if (automatedOutcome == AuditEvaluationOutcome.TechnicallyNotSupported && approvedExceptionIds.Count == 0)
            actions.Add("Remediate technical failures or record an approved exception.");

        return actions;
    }
}
