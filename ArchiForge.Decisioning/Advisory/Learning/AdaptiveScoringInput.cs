namespace ArchiForge.Decisioning.Advisory.Learning;

public class AdaptiveScoringInput
{
    public string Category { get; set; } = default!;
    public string Urgency { get; set; } = default!;
    public string? SignalType { get; set; }

    public int BasePriorityScore { get; set; }
}
