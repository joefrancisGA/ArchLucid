namespace ArchiForge.Decisioning.Advisory.Models;

public class ImprovementSignal
{
    public string SignalType { get; set; } = default!;
    public string Category { get; set; } = default!;
    public string Title { get; set; } = default!;
    public string Description { get; set; } = default!;
    public string Severity { get; set; } = "Medium";

    public List<string> FindingIds { get; set; } = [];
    public List<string> DecisionIds { get; set; } = [];
}
