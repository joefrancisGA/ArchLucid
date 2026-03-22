namespace ArchiForge.Decisioning.Advisory.Models;

public class ImprovementRecommendation
{
    public Guid RecommendationId { get; set; } = Guid.NewGuid();

    public string Title { get; set; } = default!;
    public string Category { get; set; } = default!;

    public string Rationale { get; set; } = default!;
    public string SuggestedAction { get; set; } = default!;

    public string Urgency { get; set; } = "Medium";
    public string ExpectedImpact { get; set; } = default!;

    public List<string> SupportingFindingIds { get; set; } = [];
    public List<string> SupportingDecisionIds { get; set; } = [];
    public List<string> SupportingArtifactIds { get; set; } = [];

    public int PriorityScore { get; set; }
}
