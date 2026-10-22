using System.Diagnostics.CodeAnalysis;

namespace ArchLucid.Api.Models.Learning;

/// <summary>Planning list view: summary KPIs plus themes and plans from one scoped read pass.</summary>
[ExcludeFromCodeCoverage(Justification = "API request/response DTO; auto-properties only.")]
public sealed class LearningPlanningListBundleResponse
{
    public LearningSummaryResponse Summary
    {
        get;
        init;
    } = new();

    public LearningThemesListResponse Themes
    {
        get;
        init;
    } = new();

    public LearningPlansListResponse Plans
    {
        get;
        init;
    } = new();
}
