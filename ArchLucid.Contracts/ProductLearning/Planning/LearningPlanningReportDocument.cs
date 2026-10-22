using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.ProductLearning.Planning;

/// <summary>
///     59R planning export document: top themes, prioritized plans, and evidence references (JSON or markdown
///     source).
/// </summary>
public sealed class LearningPlanningReportDocument
{
    public DateTime GeneratedUtc
    {
        get;
        init;
    }

    public LearningPlanningReportSummaryBlock Summary
    {
        get;
        init;
    } = null!;

    private IReadOnlyList<LearningPlanningReportThemeEntry> themes = [];

    public IReadOnlyList<LearningPlanningReportThemeEntry> Themes
    {
        get => themes;
        init => themes = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<LearningPlanningReportPlanEntry> plans = [];

    public IReadOnlyList<LearningPlanningReportPlanEntry> Plans
    {
        get => plans;
        init => plans = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
