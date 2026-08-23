using ArchLucid.Api.Models.Coverage;
using ArchLucid.Contracts.Governance.Coverage;

namespace ArchLucid.Api.Mapping;

internal static class CoveragePreviewMapper
{
    public static CoveragePreviewResponse ToResponse(CoveragePreviewResult result)
    {
        ArgumentNullException.ThrowIfNull(result);

        return new CoveragePreviewResponse
        {
            FocusedPilotModeEnabled = result.FocusedPilotModeEnabled,
            SummaryLine = result.SummaryLine,
            ProviderNeutralBaselineCount = result.ProviderNeutralBaselineCount,
            OrganizationRequiredCount = result.OrganizationRequiredCount,
            PlatformOverlayCount = result.PlatformOverlayCount,
            ContextualRecommendedCount = result.ContextualRecommendedCount,
            AdditionalOptionalCount = result.AdditionalOptionalCount,
            Assignments = result.Assignments.Select(ToAssignmentResponse).ToList(),
        };
    }

    public static CoveragePreviewInput ToInput(CoveragePreviewRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        return new CoveragePreviewInput
        {
            CloudProvider = request.CloudProvider,
            FocusedPilotModeEnabled = request.FocusedPilotModeEnabled,
            SecurityIntakeAnswer = request.SecurityIntakeAnswer,
            DescriptionText = request.DescriptionText,
        };
    }

    private static CoveragePreviewAssignmentResponse ToAssignmentResponse(CoveragePreviewAssignment assignment) => new()
    {
        PolicyPackId = assignment.PolicyPackId.ToString("D"),
        PolicyPackDisplayName = assignment.PolicyPackDisplayName,
        PolicyPackVersion = assignment.PolicyPackVersion,
        CoverageType = assignment.CoverageType,
        SelectionState = assignment.SelectionState,
        RecommendationConfidence = assignment.RecommendationConfidence,
        RecommendationTrigger = assignment.RecommendationTrigger,
        RecommendationRationale = assignment.RecommendationRationale,
        TriggeringEvidenceRef = assignment.TriggeringEvidenceRef,
        QualityDimension = assignment.QualityDimension,
        IncludedInRunEvaluation = assignment.IncludedInRunEvaluation,
        EvaluationVersion = assignment.EvaluationVersion,
    };
}
