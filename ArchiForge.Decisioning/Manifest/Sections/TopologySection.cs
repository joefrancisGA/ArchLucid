namespace ArchiForge.Decisioning.Models;

public class TopologySection
{
    public List<string> SelectedPatterns { get; set; } = new();
    public List<string> Resources { get; set; } = new();
    public List<string> Gaps { get; set; } = new();
}

