namespace ArchiForge.Contracts.Agents;

public sealed class RequestEvidence
{
    public string Description { get; set; } = string.Empty;

    public List<string> Constraints { get; set; } = [];

    public List<string> RequiredCapabilities { get; set; } = [];

    public List<string> Assumptions { get; set; } = [];
}
