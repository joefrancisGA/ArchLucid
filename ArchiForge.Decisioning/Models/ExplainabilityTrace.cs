namespace ArchiForge.Decisioning.Models;

public class ExplainabilityTrace
{
    public List<string> GraphNodeIdsExamined { get; set; } = new();
    public List<string> RulesApplied { get; set; } = new();
    public List<string> DecisionsTaken { get; set; } = new();
    public List<string> AlternativePathsConsidered { get; set; } = new();
    public List<string> Notes { get; set; } = new();
}

