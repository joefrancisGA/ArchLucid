namespace ArchiForge.Decisioning.Advisory.Models;

public class ImprovementPlan
{
    public Guid RunId { get; set; }
    public Guid? ComparedToRunId { get; set; }

    public DateTime GeneratedUtc { get; set; } = DateTime.UtcNow;

    public List<ImprovementRecommendation> Recommendations { get; set; } = [];
    public List<string> SummaryNotes { get; set; } = [];
}
