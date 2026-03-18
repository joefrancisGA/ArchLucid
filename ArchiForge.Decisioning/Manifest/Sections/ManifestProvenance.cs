namespace ArchiForge.Decisioning.Models;

public class ManifestProvenance
{
    public List<string> SourceFindingIds { get; set; } = new();
    public List<string> SourceGraphNodeIds { get; set; } = new();
    public List<string> AppliedRuleIds { get; set; } = new();
}

