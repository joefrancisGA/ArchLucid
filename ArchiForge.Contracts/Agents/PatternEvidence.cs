namespace ArchiForge.Contracts.Agents;

public sealed class PatternEvidence
{
    public string PatternId { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public List<string> ApplicableCapabilities { get; set; } = [];

    public List<string> SuggestedServices { get; set; } = [];
}
