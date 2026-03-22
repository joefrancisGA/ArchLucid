namespace ArchiForge.Api.Contracts;

public class ImprovementRecommendationResponse
{
    public Guid RecommendationId { get; set; }
    public string Title { get; set; } = default!;
    public string Category { get; set; } = default!;
    public string Rationale { get; set; } = default!;
    public string SuggestedAction { get; set; } = default!;
    public string Urgency { get; set; } = default!;
    public string ExpectedImpact { get; set; } = default!;
    public int PriorityScore { get; set; }
}
