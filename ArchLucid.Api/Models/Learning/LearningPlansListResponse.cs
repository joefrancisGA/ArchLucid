using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Learning;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class LearningPlansListResponse
{
    public DateTime GeneratedUtc
    {
        get;
        init;
    }

    public IReadOnlyList<LearningPlanListItemResponse> Plans
    {
        get;
        init;
    } = [];
}
