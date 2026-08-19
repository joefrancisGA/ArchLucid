namespace ArchLucid.Core.Configuration;

/// <summary>Pilot-feedback semantic retrieval for planning materialize (TB-879).</summary>
public sealed class ProductLearningPlanningRetrievalOptions
{
    public const string SectionPath = "ProductLearning:PlanningRetrieval";

    /// <summary>When true, indexes pilot signals and retrieves semantic priors during materialize.</summary>
    public bool Enabled
    {
        get;
        set;
    }
}
