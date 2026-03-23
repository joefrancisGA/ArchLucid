namespace ArchiForge.Decisioning.Advisory.Learning;

public class RecommendationLearningProfile
{
    public Guid TenantId
    {
        get; set;
    }
    public Guid WorkspaceId
    {
        get; set;
    }
    public Guid ProjectId
    {
        get; set;
    }

    public DateTime GeneratedUtc { get; set; } = DateTime.UtcNow;

    public List<RecommendationOutcomeStats> CategoryStats { get; set; } = [];
    public List<RecommendationOutcomeStats> UrgencyStats { get; set; } = [];
    public List<RecommendationOutcomeStats> SignalTypeStats { get; set; } = [];

    public Dictionary<string, double> CategoryWeights { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public Dictionary<string, double> UrgencyWeights { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public Dictionary<string, double> SignalTypeWeights { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public List<string> Notes { get; set; } = [];
}
