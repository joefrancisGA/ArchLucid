using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Coverage;

[ExcludeFromCodeCoverage(Justification = "API response DTO; no business logic.")]
public sealed class CoveragePreviewResponse
{
    public bool FocusedPilotModeEnabled
    {
        get;
        init;
    }

    public string SummaryLine
    {
        get;
        init;
    } = string.Empty;

    public int ProviderNeutralBaselineCount
    {
        get;
        init;
    }

    public int OrganizationRequiredCount
    {
        get;
        init;
    }

    public int PlatformOverlayCount
    {
        get;
        init;
    }

    public int ContextualRecommendedCount
    {
        get;
        init;
    }

    public int AdditionalOptionalCount
    {
        get;
        init;
    }

    public IReadOnlyList<CoveragePreviewAssignmentResponse> Assignments
    {
        get;
        init;
    } = [];
}
