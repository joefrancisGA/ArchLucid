using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Learning;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class LearningThemesListResponse
{
    public DateTime GeneratedUtc
    {
        get;
        init;
    }

    public IReadOnlyList<LearningThemeResponse> Themes
    {
        get;
        init;
    } = [];
}
