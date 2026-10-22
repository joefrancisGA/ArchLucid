using ArchLucid.Api.Models.Coverage;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Api.Mapping;

internal static class CoverageAssignmentMapper
{
    public static CoverageAssignmentResponse ToResponse(
        CoverageAssignment assignment,
        PolicyPack? policyPack)
    {
        ArgumentNullException.ThrowIfNull(assignment);

        return new CoverageAssignmentResponse
        {
            CoverageAssignmentId = assignment.CoverageAssignmentId.ToString("D"),
            RunId = assignment.RunId,
            PolicyPackId = assignment.PolicyPackId.ToString("D"),
            PolicyPackVersion = assignment.PolicyPackVersion,
            CoverageType = assignment.CoverageType,
            SelectionState = assignment.SelectionState,
            RecommendationConfidence = assignment.RecommendationConfidence,
            RecommendationTrigger = assignment.RecommendationTrigger,
            RecommendationRationale = assignment.RecommendationRationale,
            TriggeringEvidenceRef = assignment.TriggeringEvidenceRef,
            ExclusionReason = assignment.ExclusionReason,
            QualityDimension = policyPack?.QualityDimension,
            ActorUserId = assignment.ActorUserId,
            CreatedUtc = assignment.CreatedUtc,
            EvaluationVersion = assignment.EvaluationVersion,
        };
    }

    public static CoverageSummaryResponse ToSummaryResponse(
        CoverageSummary summary,
        IReadOnlyDictionary<Guid, PolicyPack> packById)
    {
        ArgumentNullException.ThrowIfNull(summary);
        ArgumentNullException.ThrowIfNull(packById);

        return new CoverageSummaryResponse
        {
            LegacyCoverageNotRecorded = summary.LegacyCoverageNotRecorded,
            ProviderNeutralBaselineCount = summary.ProviderNeutralBaselineCount,
            OrganizationRequiredCount = summary.OrganizationRequiredCount,
            PlatformOverlayCount = summary.PlatformOverlayCount,
            ContextualRecommendedCount = summary.ContextualRecommendedCount,
            AdditionalOptionalCount = summary.AdditionalOptionalCount,
            Assignments = summary.Assignments
                .Select(assignment =>
                {
                    packById.TryGetValue(assignment.PolicyPackId, out PolicyPack? pack);
                    return ToResponse(assignment, pack);
                })
                .ToList(),
        };
    }
}
