using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Coverage;

[ExcludeFromCodeCoverage(Justification = "API request/response DTO; no business logic.")]
public sealed class CoverageSummaryResponse
{
    public bool LegacyCoverageNotRecorded
    {
        get;
        init;
    }

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

    public IReadOnlyList<CoverageAssignmentResponse> Assignments
    {
        get;
        init;
    } = [];
}
