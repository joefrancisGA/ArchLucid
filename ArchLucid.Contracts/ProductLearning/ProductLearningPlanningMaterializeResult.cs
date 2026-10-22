using ArchLucid.Contracts.Serialization;

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
    private IReadOnlyList<PlanningMaterializeCitation> citations = [];

    public IReadOnlyList<PlanningMaterializeCitation> Citations
    {
        get => citations;
        init => citations = ContractCollectionDefaults.CoalesceReadOnly(value);
    }

    private IReadOnlyList<PlanningRetrievalCitation> retrievalCitations = [];

    /// <summary>Semantic retrieval priors from indexed pilot-feedback corpus (TB-879).</summary>
    public IReadOnlyList<PlanningRetrievalCitation> RetrievalCitations
    {
        get => retrievalCitations;
        init => retrievalCitations = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
