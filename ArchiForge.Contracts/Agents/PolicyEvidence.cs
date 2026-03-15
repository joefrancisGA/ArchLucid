namespace ArchiForge.Contracts.Agents;

public sealed class PolicyEvidence
{
    public string PolicyId { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public List<string> RequiredControls { get; set; } = [];

    public List<string> Tags { get; set; } = [];
}
