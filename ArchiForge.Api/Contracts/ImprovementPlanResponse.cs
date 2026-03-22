namespace ArchiForge.Api.Contracts;

public class ImprovementPlanResponse
{
    public Guid RunId { get; set; }
    public Guid? ComparedToRunId { get; set; }
    public DateTime GeneratedUtc { get; set; }

    public List<string> SummaryNotes { get; set; } = [];
    public List<ImprovementRecommendationResponse> Recommendations { get; set; } = [];
}
