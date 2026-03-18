namespace ArchiForge.Decisioning.Models;

public class DecisionTrace
{
    public Guid DecisionTraceId { get; set; }
    public Guid RunId { get; set; }
    public DateTime CreatedUtc { get; set; }

    public List<string> AppliedRuleIds { get; set; } = new();
    public List<string> AcceptedFindingIds { get; set; } = new();
    public List<string> RejectedFindingIds { get; set; } = new();
    public List<string> Notes { get; set; } = new();
}

