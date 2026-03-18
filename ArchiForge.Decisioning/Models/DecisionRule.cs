namespace ArchiForge.Decisioning.Models;

public class DecisionRule
{
    public string RuleId { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = default!;
    public int Priority { get; set; }
    public bool IsMandatory { get; set; }

    public string AppliesToFindingType { get; set; } = default!;
    public string Action { get; set; } = default!;
    // allow | require | reject | prefer

    public Dictionary<string, string> Criteria { get; set; } = new();
}

