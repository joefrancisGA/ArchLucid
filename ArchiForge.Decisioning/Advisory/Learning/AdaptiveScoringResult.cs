namespace ArchiForge.Decisioning.Advisory.Learning;

public class AdaptiveScoringResult
{
    public int BasePriorityScore { get; set; }
    public int AdaptedPriorityScore { get; set; }

    public double CategoryWeight { get; set; }
    public double UrgencyWeight { get; set; }
    public double SignalTypeWeight { get; set; }

    public List<string> Notes { get; set; } = [];
}
