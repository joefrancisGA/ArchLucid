using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Application.Governance.Coverage;

/// <summary>Validates coverage assignment rows before persistence.</summary>
public sealed class CoverageAssignmentValidator
{
    public CoverageAssignmentValidationResult Validate(
        CoverageAssignment assignment,
        PolicyPack? policyPack)
    {
        ArgumentNullException.ThrowIfNull(assignment);
        List<string> errors = [];

        if (assignment.CoverageAssignmentId == Guid.Empty)
            errors.Add("CoverageAssignmentId is required.");

        if (assignment.TenantId == Guid.Empty)
            errors.Add("TenantId is required.");

        if (assignment.WorkspaceId == Guid.Empty)
            errors.Add("WorkspaceId is required.");

        if (assignment.ProjectId == Guid.Empty)
            errors.Add("ProjectId is required.");

        if (assignment.PolicyPackId == Guid.Empty)
            errors.Add("PolicyPackId is required.");

        if (string.IsNullOrWhiteSpace(assignment.PolicyPackVersion))
            errors.Add("PolicyPackVersion is required.");

        if (string.IsNullOrWhiteSpace(assignment.EvaluationVersion))
            errors.Add("EvaluationVersion is required.");

        if (string.IsNullOrWhiteSpace(assignment.ActorUserId))
            errors.Add("ActorUserId is required.");

        if (assignment.CreatedUtc == default)
            errors.Add("CreatedUtc is required.");

        if (assignment.SelectionState == CoverageSelectionState.RecommendedButExcluded)
        {
            if (string.IsNullOrWhiteSpace(assignment.ExclusionReason))
                errors.Add("ExclusionReason is required when SelectionState is RecommendedButExcluded.");
        }
        else if (!string.IsNullOrWhiteSpace(assignment.ExclusionReason))
        {
            errors.Add("ExclusionReason is only allowed when SelectionState is RecommendedButExcluded.");
        }

        if (assignment.CoverageType == CoverageType.ContextualRecommended)
        {
            if (!assignment.RecommendationConfidence.HasValue)
                errors.Add("RecommendationConfidence is required when CoverageType is ContextualRecommended.");
        }
        else if (assignment.RecommendationConfidence.HasValue)
        {
            errors.Add("RecommendationConfidence is only allowed when CoverageType is ContextualRecommended.");
        }

        if (assignment.CoverageType == CoverageType.ProviderNeutralBaseline)
        {
            if (policyPack is null)
            {
                errors.Add("PolicyPack metadata is required to validate ProviderNeutralBaseline coverage.");
            }
            else if (!policyPack.QualityDimension.HasValue)
            {
                errors.Add("ProviderNeutralBaseline coverage requires PolicyPack.QualityDimension to be set.");
            }
        }

        if (assignment.CoverageType == CoverageType.PlatformOverlay
            && policyPack?.QualityDimension is not null)
        {
            errors.Add("PlatformOverlay coverage must reference a pack with null QualityDimension.");
        }

        if (assignment.CoverageType != CoverageType.ContextualRecommended)
        {
            if (!string.IsNullOrWhiteSpace(assignment.RecommendationTrigger))
                errors.Add("RecommendationTrigger is only allowed for ContextualRecommended coverage.");

            if (!string.IsNullOrWhiteSpace(assignment.RecommendationRationale))
                errors.Add("RecommendationRationale is only allowed for ContextualRecommended coverage.");

            if (!string.IsNullOrWhiteSpace(assignment.TriggeringEvidenceRef))
                errors.Add("TriggeringEvidenceRef is only allowed for ContextualRecommended coverage.");
        }

        return errors.Count == 0
            ? CoverageAssignmentValidationResult.Success()
            : new CoverageAssignmentValidationResult(errors);
    }
}
