namespace ArchLucid.Contracts.ProductLearning;

/// <summary>Outcome of a planning bridge materialization request (59R V1 derivation).</summary>
public sealed class ProductLearningPlanningMaterializeResult
{
    public int ThemesInserted
    {
        get;
        init;
    }

    public int PlansInserted
    {
        get;
        init;
    }

    /// <summary>Skipped because theme ThemeKey already exists in the current scope.</summary>
    public int SkippedExistingThemeKeys
    {
        get;
        init;
    }

    /// <summary>Pilot feedback signals linked across all new plans (total row inserts attempted).</summary>
    public int SignalLinksInserted
    {
        get;
        init;
    }

    /// <summary>Citable pilot-feedback excerpts surfaced for the materialize response.</summary>
    public IReadOnlyList<PlanningMaterializeCitation> Citations
    {
        get;
        init;
    } = [];
}
