namespace ArchLucid.Decisioning.Advisory.Models;

/// <summary>Compatibility shim; canonical model is <see cref="ArchLucid.Contracts.Advisory.Models.ImprovementPlan" />.</summary>
public sealed class ImprovementPlan
{
    public Guid RunId
    {
        get;
        set;
    }

    public Guid? ComparedToRunId
    {
        get;
        set;
    }

    public DateTime GeneratedUtc
    {
        get;
        set;
    } = TimeProvider.System.UtcNowDateTime();

    public List<ImprovementRecommendation> Recommendations
    {
        get;
        set;
    } = [];

    public List<string> SummaryNotes
    {
        get;
        set;
    } = [];

    public Dictionary<string, string> PolicyPackAdvisoryDefaults
    {
        get;
        set;
    } =
        new(StringComparer.OrdinalIgnoreCase);

    public static explicit operator ArchLucid.Contracts.Advisory.Models.ImprovementPlan(ImprovementPlan source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new ArchLucid.Contracts.Advisory.Models.ImprovementPlan
        {
            RunId = source.RunId,
            ComparedToRunId = source.ComparedToRunId,
            GeneratedUtc = source.GeneratedUtc,
            Recommendations = source.Recommendations.Select(
                    recommendation => new ArchLucid.Contracts.Advisory.Models.ImprovementRecommendation
                    {
                        RecommendationId = recommendation.RecommendationId,
                        Title = recommendation.Title,
                        Category = recommendation.Category,
                        Rationale = recommendation.Rationale,
                        SuggestedAction = recommendation.SuggestedAction,
                        Urgency = recommendation.Urgency,
                        ExpectedImpact = recommendation.ExpectedImpact,
                        SupportingFindingIds = recommendation.SupportingFindingIds.ToList(),
                        SupportingDecisionIds = recommendation.SupportingDecisionIds.ToList(),
                        SupportingArtifactIds = recommendation.SupportingArtifactIds.ToList(),
                        PriorityScore = recommendation.PriorityScore,
                    })
                .ToList(),
            SummaryNotes = source.SummaryNotes.ToList(),
            PolicyPackAdvisoryDefaults = new Dictionary<string, string>(source.PolicyPackAdvisoryDefaults, StringComparer.OrdinalIgnoreCase),
        };
    }

    public static explicit operator ImprovementPlan(ArchLucid.Contracts.Advisory.Models.ImprovementPlan source)
    {
        ArgumentNullException.ThrowIfNull(source);

        return new ImprovementPlan
        {
            RunId = source.RunId,
            ComparedToRunId = source.ComparedToRunId,
            GeneratedUtc = source.GeneratedUtc,
            Recommendations = source.Recommendations.Select(
                    recommendation => new ImprovementRecommendation
                    {
                        RecommendationId = recommendation.RecommendationId,
                        Title = recommendation.Title,
                        Category = recommendation.Category,
                        Rationale = recommendation.Rationale,
                        SuggestedAction = recommendation.SuggestedAction,
                        Urgency = recommendation.Urgency,
                        ExpectedImpact = recommendation.ExpectedImpact,
                        SupportingFindingIds = recommendation.SupportingFindingIds.ToList(),
                        SupportingDecisionIds = recommendation.SupportingDecisionIds.ToList(),
                        SupportingArtifactIds = recommendation.SupportingArtifactIds.ToList(),
                        PriorityScore = recommendation.PriorityScore,
                    })
                .ToList(),
            SummaryNotes = source.SummaryNotes.ToList(),
            PolicyPackAdvisoryDefaults = new Dictionary<string, string>(source.PolicyPackAdvisoryDefaults, StringComparer.OrdinalIgnoreCase),
        };
    }
}
