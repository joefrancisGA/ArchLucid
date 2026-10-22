namespace ArchLucid.Contracts.ProductLearning.Planning;

/// <summary>List projection for improvement plans without <c>BoundedActionsJson</c> deserialization.</summary>
public sealed class ProductLearningImprovementPlanListRecord
{
    public Guid PlanId
    {
        get;
        init;
    }

    public Guid ThemeId
    {
        get;
        init;
    }

    public string Title
    {
        get;
        init;
    } = string.Empty;

    public string Summary
    {
        get;
        init;
    } = string.Empty;

    public int PriorityScore
    {
        get;
        init;
    }

    public string? PriorityExplanation
    {
        get;
        init;
    }

    public string Status
    {
        get;
        init;
    } = string.Empty;

    public DateTime CreatedUtc
    {
        get;
        init;
    }

    public int? ThemeEvidenceSignalCount
    {
        get;
        init;
    }
}
