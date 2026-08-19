using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     TB-1985 composition rules: disposition never overwrites conclusion;
///     <see cref="GovernanceDisposition.Accepted" /> requires fail/indeterminate plus an actor id.
/// </summary>
public static class FindingStatusCompositionRules
{
    public static bool TryApplyGovernanceDisposition(
        SpecialistReviewFinding finding,
        GovernanceDispositionLifecycleEvent lifecycleEvent,
        string? actorUserId,
        out SpecialistReviewFinding updatedFinding,
        out string? violationReason)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (!GovernanceDispositionTransitionTable.TryTransition(
                finding.GovernanceDisposition,
                lifecycleEvent,
                out GovernanceDisposition targetDisposition))
        {
            updatedFinding = finding;
            violationReason =
                $"Disposition transition '{lifecycleEvent}' is illegal from '{finding.GovernanceDisposition}'.";
            return false;
        }

        if (targetDisposition is GovernanceDisposition.Accepted
            && finding.Conclusion is not (ReviewConclusion.Fail or ReviewConclusion.Indeterminate))
        {
            updatedFinding = finding;
            violationReason =
                "Risk accepted (Accepted disposition) requires a Fail or Indeterminate conclusion — conclusion must not read as pass.";
            return false;
        }

        if (targetDisposition is GovernanceDisposition.Accepted && string.IsNullOrWhiteSpace(actorUserId))
        {
            updatedFinding = finding;
            violationReason = "Accepted disposition requires a non-null actor id.";
            return false;
        }

        updatedFinding = CloneWithDisposition(finding, targetDisposition);
        violationReason = null;
        return true;
    }

    public static bool DispositionWouldOverwriteConclusion(
        ReviewConclusion conclusion,
        GovernanceDispositionLifecycleEvent lifecycleEvent)
    {
        // Disposition transitions never change conclusion — any event that would imply a conclusion change is illegal.
        return lifecycleEvent switch
        {
            GovernanceDispositionLifecycleEvent.SetOpen => false,
            GovernanceDispositionLifecycleEvent.SetAccepted => false,
            GovernanceDispositionLifecycleEvent.SetRemediationPlanned => false,
            GovernanceDispositionLifecycleEvent.SetDeferred => false,
            GovernanceDispositionLifecycleEvent.SetExceptionGranted => false,
            GovernanceDispositionLifecycleEvent.SetHumanDecisionRequired => false,
            _ => true,
        };
    }

    private static SpecialistReviewFinding CloneWithDisposition(
        SpecialistReviewFinding source,
        GovernanceDisposition disposition)
    {
        return new SpecialistReviewFinding
        {
            FindingId = source.FindingId,
            Dimension = source.Dimension,
            Title = source.Title,
            Rationale = source.Rationale,
            Conclusion = source.Conclusion,
            EvidenceCondition = source.EvidenceCondition,
            GovernanceDisposition = disposition,
            Provenance = source.Provenance,
            Confidence = source.Confidence,
            EvidenceArtifactIds = [.. source.EvidenceArtifactIds],
            Severity = source.Severity,
            LifecycleScope = source.LifecycleScope,
            RelatedModelElementIds = [.. source.RelatedModelElementIds],
            RelatedRequirementElementIds = [.. source.RelatedRequirementElementIds],
            RelatedDecisionElementIds = [.. source.RelatedDecisionElementIds],
            EvidenceSupportTier = source.EvidenceSupportTier,
        };
    }
}
