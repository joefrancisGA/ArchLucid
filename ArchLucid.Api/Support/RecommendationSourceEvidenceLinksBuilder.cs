using ArchLucid.Contracts.Advisory.Workflow;

using ApiRecommendationSourceEvidenceLink = ArchLucid.Api.Contracts.RecommendationSourceEvidenceLink;

namespace ArchLucid.Api.Support;

/// <summary>
///     Maps persisted recommendation evidence anchors to API contract DTOs.
/// </summary>
public static class RecommendationSourceEvidenceLinksBuilder
{
    public static IReadOnlyList<ApiRecommendationSourceEvidenceLink> Build(RecommendationRecord record)
    {
        ArgumentNullException.ThrowIfNull(record);

        return RecommendationSourceEvidenceLinksComposer.FromRecord(record)
            .Select(link => new ApiRecommendationSourceEvidenceLink { Kind = link.Kind, Id = link.Id })
            .ToList();
    }
}
